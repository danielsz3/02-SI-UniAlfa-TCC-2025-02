<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\ImagemPost;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class PostController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        // Validação básica
        $validator = Validator::make($request->all(), [
            'legenda' => 'nullable|string|max:1000',
            'imagens' => 'nullable|array|max:10',
            'imagens.*' => 'file|image|mimes:jpeg,png,jpg,webp|max:10240',
            'imagens_base64' => 'nullable|array|max:10',
            'imagens_base64.*' => 'string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            return DB::transaction(function () use ($request) {
                // Cria o post
                $post = Post::create([
                    'legenda' => $request->input('legenda', ''),
                ]);

                $multipart = [
                    [
                        'name' => 'legenda',
                        'contents' => $request->input('legenda', ''),
                    ],
                ];

                // Processa arquivos enviados via multipart/form-data
                if ($request->hasFile('imagens')) {
                    foreach ($request->file('imagens') as $idx => $imagem) {
                        $caminho = $imagem->store('posts', 'public');

                        ImagemPost::create([
                            'post_id' => $post->id,
                            'caminho' => $caminho,
                            'nome_original' => $imagem->getClientOriginalName(),
                        ]);

                        $multipart[] = [
                            'name' => "imagens[$idx]",
                            'contents' => fopen($imagem->getRealPath(), 'r'),
                            'filename' => $imagem->getClientOriginalName(),
                        ];
                    }
                }

                // Processa imagens em base64
                if ($request->has('imagens_base64')) {
                    foreach ($request->input('imagens_base64') as $idx => $base64Image) {
                        if (preg_match('/^data:image\/(\w+);base64,/', $base64Image, $type)) {
                            $data = substr($base64Image, strpos($base64Image, ',') + 1);
                            $ext = strtolower($type[1]); // jpg, png, etc

                            $data = base64_decode($data);
                            if ($data === false) {
                                continue; // base64 inválido
                            }

                            $fileName = uniqid() . '.' . $ext;
                            $filePath = 'posts/' . $fileName;

                            Storage::disk('public')->put($filePath, $data);

                            ImagemPost::create([
                                'post_id' => $post->id,
                                'caminho' => $filePath,
                                'nome_original' => $fileName,
                            ]);

                            // Para enviar ao n8n, adiciona o arquivo do storage
                            $fullPath = Storage::disk('public')->path($filePath);
                            $multipart[] = [
                                'name' => "imagens[" . (count($multipart) - 1) . "]",
                                'contents' => fopen($fullPath, 'r'),
                                'filename' => $fileName,
                            ];
                        }
                    }
                }

                // Envia para o webhook n8n
                $response = Http::withOptions(['verify' => false])
                    ->asMultipart()
                    ->timeout(60)
                    ->post('https://webhook.chatfacil.cloud/webhook/postar-instagram', $multipart);

                if (!$response->successful()) {
                    Log::error('Erro no retorno do n8n:', [
                        'status' => $response->status(),
                        'body' => $response->body(),
                    ]);
                    throw new \Exception("Erro no retorno do n8n: " . $response->body());
                }

                return response()->json(['id' => $post->id], 201);
            });
        } catch (\Throwable $e) {
            Log::error('Erro ao criar post e enviar para n8n: ' . $e->getMessage(), [
                'payload' => $request->all(),
                'exception' => $e,
            ]);

            return response()->json([
                'error' => 'Não foi possível criar o post e enviar para o n8n',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}