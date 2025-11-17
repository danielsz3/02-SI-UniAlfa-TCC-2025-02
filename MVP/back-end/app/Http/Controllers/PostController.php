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
                        $multipart[] = [
                            'name' => "imagens[$idx]",
                            'contents' => fopen($imagem->getRealPath(), 'r'),
                            'filename' => $imagem->getClientOriginalName(),
                        ];
                    }
                }


                // Envia para o webhook n8n
                $response = Http::withOptions(['verify' => false])
                    ->asMultipart()
                    ->timeout(120)
                    ->post('https://webhook.chatfacil.cloud/webhook/postar-instagram', $multipart);

                if (!$response->successful()) {
                    Log::error('Erro no retorno do n8n:', [
                        'status' => $response->status(),
                        'body' => $response->body(),
                    ]);
                    throw new \Exception("Erro no retorno do n8n: " . $response->body());
                }

                return response()->json(['id' => $response->id ?? 1], 201);
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