<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class PostController extends Controller
{
    /**
     * Envia imagens + legenda para o n8n via multipart
     */
    public function store(Request $request): JsonResponse
    {
        // 🔹 Validação básica
        $validator = Validator::make($request->all(), [
            'legenda' => 'nullable|string|max:1000',
            'imagens' => 'nullable|array',
            'imagens.*' => 'image|mimes:jpeg,png,jpg,webp|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // 🔹 Montar corpo multipart
        $multipart = [
            [
                'name' => 'legenda',
                'contents' => $request->legenda ?? '',
            ]
        ];

        if ($request->hasFile('imagens')) {
            foreach ($request->file('imagens') as $idx => $file) {
                $multipart[] = [
                    'name' => "imagens[$idx]",
                    'contents' => fopen($file->getRealPath(), 'r'),
                    'filename' => $file->getClientOriginalName(),
                ];
            }
        }

        // 🔹 Envio ao n8n
        try {
            $response = Http::withOptions([
                'verify' => false, // Ignorar SSL
            ])
                ->asMultipart()
                ->timeout(30)
                ->post('https://webhook.chatfacil.cloud/webhook/postar-instagram', $multipart);

            if (!$response->successful()) {
                throw new \Exception("Erro no retorno do n8n: " . $response->body());
            }

            return response()->json([
                'message' => 'Enviado com sucesso ao n8n',
                'response' => $response->json(),
            ], 201);

        } catch (\Throwable $e) {
            Log::error('Erro ao enviar para n8n: ' . $e->getMessage());

            return response()->json([
                'error' => 'Falha ao enviar dados para o n8n.',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}
