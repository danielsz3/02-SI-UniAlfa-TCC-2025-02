<?php

namespace App\Http\Controllers;

use App\Models\Evento;
use App\Models\ImagemEvento;
use App\Traits\SearchIndex;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Arr;

class EventoController extends Controller
{
    use SearchIndex;

    public function index(Request $request): JsonResponse
    {
        try {
            return $this->SearchIndex(
                $request,
                Evento::with('imagens'),
                'eventos',
                ['titulo']
            );
        } catch (\Exception $e) {
            Log::error('Erro ao listar documentos: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['error' => 'Não foi possível carregar os documentos'], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'titulo' => 'required|string|max:255',
            'data_inicio' => 'required|date|after:now',
            'data_fim' => 'required|date|after_or_equal:data_inicio',
            'local' => 'required|string|max:255',
            'descricao' => 'nullable|string|max:1000',
            'imagem_capa' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:10240',
            'imagens' => 'nullable|array',
            'imagens.*' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:10240',
        ], [
            'titulo.required' => 'O título do evento é obrigatório.',
            'titulo.max' => 'O título deve ter no máximo 255 caracteres.',

            'data_inicio.required' => 'A data de início é obrigatória.',
            'data_inicio.date' => 'A data de início deve ser uma data válida.',
            'data_inicio.after' => 'A data de início deve ser uma data futura.',

            'data_fim.required' => 'A data de fim é obrigatória.',
            'data_fim.date' => 'A data de fim deve ser uma data válida.',
            'data_fim.after_or_equal' => 'A data de fim deve ser igual ou posterior à data de início.',

            'local.required' => 'O local do evento é obrigatório.',
            'local.max' => 'O local deve ter no máximo 255 caracteres.',

            'descricao.max' => 'A descrição deve ter no máximo 1000 caracteres.',

            'imagem_capa.image' => 'A imagem de capa deve ser uma imagem válida.',
            'imagem_capa.mimes' => 'A imagem de capa deve ser do tipo jpeg, png, jpg ou webp.',
            'imagem_capa.max' => 'A imagem de capa deve ter no máximo 10MB.',

            'imagens.array' => 'As imagens devem ser enviadas como um array.',
            'imagens.*.image' => 'Cada imagem deve ser um arquivo de imagem válido.',
            'imagens.*.mimes' => 'As imagens devem ser do tipo jpeg, png, jpg ou webp.',
            'imagens.*.max' => 'Cada imagem deve ter no máximo 10MB.',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Validação adicional para limite de 10 imagens
        if ($request->hasFile('imagens') && count($request->file('imagens')) > 10) {
            return response()->json([
                'errors' => ['imagens' => ['Você pode enviar no máximo 10 imagens.']]
            ], 422);
        }

        try {
            return DB::transaction(function () use ($request) {
                $data = $request->only(['titulo', 'data_inicio', 'data_fim', 'local', 'descricao']);

                // Upload imagem capa
                if ($request->hasFile('imagem')) {
                    $path = $request->file('imagem')->store('eventos', 'public');
                    $data['imagem'] = $path;
                }

                $evento = Evento::create($data);

                // Upload imagens adicionais
                if ($request->hasFile('imagens')) {
                    foreach ($request->file('imagens') as $file) {
                        $nomeOriginal = $file->getClientOriginalName();
                        $path = $file->store('eventos', 'public');
                        [$width, $height] = getimagesize($file->getRealPath()) ?: [null, null];
                        ImagemEvento::create([
                            'evento_id' => $evento->id,
                            'caminho' => $path,
                            'nome_original' => $nomeOriginal,
                            'width' => $width,
                            'height' => $height,
                        ]);
                    }
                }

                return response()->json($evento->load('imagens'), 201);
            });
        } catch (\Exception $e) {
            Log::error('Erro ao criar evento: ' . $e->getMessage(), [
                'request_data' => $request->except(['imagem_capa', 'imagens']),
                'exception' => $e
            ]);

            return response()->json([
                'error' => 'Não foi possível criar o evento',
                'message' => config('app.debug') ? $e->getMessage() : 'Erro interno do servidor'
            ], 500);
        }
    }

    public function show($id): JsonResponse
    {
        $evento = Evento::with('imagens')->find($id);

        if (!$evento) {
            return response()->json(['error' => 'Evento não encontrado'], 404);
        }

        return response()->json($evento);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $evento = Evento::find($id);

        if (!$evento) {
            return response()->json(['error' => 'Evento não encontrado'], 404);
        }

        $rules = [
            'titulo' => 'sometimes|required|string|max:255',
            'data_inicio' => 'sometimes|required|date|after:now',
            'data_fim' => 'sometimes|required|date|after_or_equal:data_inicio',
            'local' => 'sometimes|required|string|max:255',
            'descricao' => 'nullable|string|max:1000',
            'imagem_capa' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:10240',
            'imagens' => 'nullable|array',
        ];

        // Só valida como file se houver arquivos enviados
        if ($request->hasFile('imagens')) {
            $rules['imagens.*'] = 'nullable|image|mimes:jpeg,png,jpg,webp|max:10240';
        }

        $validator = Validator::make($request->all(), $rules, [
            'titulo.required' => 'O título do evento é obrigatório.',
            'titulo.max' => 'O título deve ter no máximo 255 caracteres.',

            'data_inicio.required' => 'A data de início é obrigatória.',
            'data_inicio.date' => 'A data de início deve ser uma data válida.',
            'data_inicio.after' => 'A data de início deve ser uma data futura.',

            'data_fim.required' => 'A data de fim é obrigatória.',
            'data_fim.date' => 'A data de fim deve ser uma data válida.',
            'data_fim.after_or_equal' => 'A data de fim deve ser igual ou posterior à data de início.',

            'local.required' => 'O local do evento é obrigatório.',
            'local.max' => 'O local deve ter no máximo 255 caracteres.',

            'descricao.max' => 'A descrição deve ter no máximo 1000 caracteres.',

            'imagem_capa.image' => 'A imagem de capa deve ser uma imagem válida.',
            'imagem_capa.mimes' => 'A imagem de capa deve ser do tipo jpeg, png, jpg ou webp.',
            'imagem_capa.max' => 'A imagem de capa deve ter no máximo 10MB.',

            'imagens.array' => 'As imagens devem ser enviadas como um array.',
            'imagens.*.image' => 'Cada imagem deve ser um arquivo de imagem válido.',
            'imagens.*.mimes' => 'As imagens devem ser do tipo jpeg, png, jpg ou webp.',
            'imagens.*.max' => 'Cada imagem deve ter no máximo 10MB.',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Validação adicional para limite de 10 imagens
        if ($request->hasFile('imagens')) {
            $totalImagens = count($request->file('imagens'));
            $imagensExistentes = ImagemEvento::where('evento_id', $evento->id)->count();

            if (($totalImagens + $imagensExistentes) > 10) {
                return response()->json([
                    'errors' => ['imagens' => ['O total de imagens não pode exceder 10.']]
                ], 422);
            }
        }

        try {
            return DB::transaction(function () use ($request, $evento) {
                $data = $request->only(['titulo', 'data_inicio', 'data_fim', 'local', 'descricao']);

                // Atualizar imagem capa
                if ($request->hasFile('imagem')) {
                    // Deletar imagem capa antiga
                    if ($evento->imagem_capa) {
                        $oldPath = str_replace('/storage/', '', $evento->imagem);
                        if (Storage::disk('public')->exists($oldPath)) {
                            Storage::disk('public')->delete($oldPath);
                        }
                    }
                    $path = $request->file('imagem')->store('eventos', 'public');
                    $data['imagem'] = $path;
                }

                $evento->update($data);

                if ($request->has('imagens') || $request->hasFile('imagens')) {
                    // 🔹 1. Capturar arquivos novos
                    $arquivosNovos = [];
                    if ($request->hasFile('imagens')) {
                        $arquivosNovos = Arr::wrap($request->file('imagens'));
                    }

                    // 🔹 2. Processar imagens mantidas
                    $imagensMantidas = [];
                    $imagensInput = $request->input('imagens', []);

                    if (is_array($imagensInput)) {
                        foreach ($imagensInput as $item) {
                            // Se for string JSON, decodifica
                            if (is_string($item)) {
                                $decoded = json_decode($item, true);
                                if ($decoded && isset($decoded['src'])) {
                                    $imagensMantidas[] = basename(parse_url($decoded['src'], PHP_URL_PATH));
                                }
                            }
                            // Se já vier como array com 'src'
                            elseif (is_array($item) && isset($item['src'])) {
                                $imagensMantidas[] = basename(parse_url($item['src'], PHP_URL_PATH));
                            }
                        }
                    }

                    // 🔹 3. Buscar imagens atuais do banco
                    $imagensAtuais = ImagemEvento::where('evento_id', $evento->id)->get();

                    // 🔹 4. Excluir as removidas
                    foreach ($imagensAtuais as $imagem) {
                        $arquivoAtual = basename($imagem->caminho);

                        if (!in_array($arquivoAtual, $imagensMantidas)) {
                            if (Storage::disk('public')->exists($imagem->caminho)) {
                                Storage::disk('public')->delete($imagem->caminho);
                            }
                            $imagem->delete();
                        }
                    }

                    // 🔹 5. Salvar novas imagens
                    foreach ($arquivosNovos as $file) {
                        if ($file instanceof \Illuminate\Http\UploadedFile && $file->isValid()) {
                            $nomeOriginal = $file->getClientOriginalName();
                            $path = $file->store('eventos', 'public');
                            [$width, $height] = @getimagesize($file->getRealPath()) ?: [null, null];

                            ImagemEvento::create([
                                'evento_id' => $evento->id,
                                'caminho' => $path,
                                'nome_original' => $nomeOriginal,
                                'width' => $width,
                                'height' => $height,
                            ]);
                        }
                    }
                }

                return response()->json($evento->fresh('imagens'), 200);
            });
        } catch (\Exception $e) {
            Log::error('Erro ao atualizar evento: ' . $e->getMessage(), [
                'evento_id' => $id,
                'request_data' => $request->except(['imagem_capa', 'imagens']),
                'exception' => $e
            ]);

            return response()->json([
                'error' => 'Não foi possível atualizar o evento',
                'message' => config('app.debug') ? $e->getMessage() : 'Erro interno do servidor'
            ], 500);
        }
    }

    public function destroy($id): JsonResponse
    {
        $evento = Evento::find($id);

        if (!$evento) {
            return response()->json(['error' => 'Evento não encontrado'], 404);
        }

        try {
            // Deletar imagens do storage antes de deletar o evento
            if ($evento->imagem_capa) {
                $oldPath = str_replace('/storage/', '', $evento->imagem_capa);
                if (Storage::disk('public')->exists($oldPath)) {
                    Storage::disk('public')->delete($oldPath);
                }
            }

            foreach ($evento->imagens as $imagem) {
                $oldPath = str_replace('/storage/', '', $imagem->caminho);
                if (Storage::disk('public')->exists($oldPath)) {
                    Storage::disk('public')->delete($oldPath);
                }
            }

            $evento->delete();

            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error('Erro ao deletar evento: ' . $e->getMessage(), [
                'evento_id' => $id,
                'exception' => $e
            ]);

            return response()->json([
                'error' => 'Não foi possível deletar o evento',
                'message' => config('app.debug') ? $e->getMessage() : 'Erro interno do servidor'
            ], 500);
        }
    }

    public function restore($id): JsonResponse
    {
        $evento = Evento::withTrashed()->find($id);

        if (!$evento) {
            return response()->json(['error' => 'Evento não encontrado'], 404);
        }

        if (!$evento->trashed()) {
            return response()->json(['error' => 'Evento já está ativo'], 400);
        }

        try {
            $evento->restore();
            return response()->json($evento->load('imagens'), 200);
        } catch (\Exception $e) {
            Log::error('Erro ao restaurar evento: ' . $e->getMessage(), [
                'evento_id' => $id,
                'exception' => $e
            ]);

            return response()->json([
                'error' => 'Não foi possível restaurar o evento',
                'message' => config('app.debug') ? $e->getMessage() : 'Erro interno do servidor'
            ], 500);
        }
    }
}
