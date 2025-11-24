<?php

namespace App\Http\Controllers;

use App\Models\Evento;
use App\Models\ImagemEvento;
use App\Traits\ManagerGallery;
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
    use ManagerGallery;

    protected $campoImagemCapa = 'imagem';
    protected $campoGaleria = 'imagens';
    protected $storagePath = 'eventos';
    protected $modeloRelacaoGaleria = ImagemEvento::class;
    protected $foreignKeyGaleria = 'evento_id';

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
            Log::error('Erro ao listar eventos: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['error' => 'Não foi possível carregar os eventos'], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'titulo' => 'required|string|max:255',
            'data_inicio' => 'required|date|after_or_equal:today',
            'data_fim' => 'required|date|after_or_equal:data_inicio',
            'local' => 'required|string|max:255',
            'descricao' => 'nullable|string|max:1000',
            'imagem' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:10240',
            'imagens' => 'nullable|array|max:10',
            'imagens.*' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:10240',
        ], [
            'titulo.required' => 'O título do evento é obrigatório.',
            'titulo.max' => 'O título deve ter no máximo 255 caracteres.',

            'data_inicio.required' => 'A data de início é obrigatória.',
            'data_inicio.date' => 'A data de início deve ser uma data válida.',
            'data_inicio.after_or_equal' => 'A data de início deve ser hoje ou uma data futura.',

            'data_fim.required' => 'A data de encerramento é obrigatória.',
            'data_fim.date' => 'A data de encerramento deve ser uma data válida.',
            'data_fim.after_or_equal' => 'A data de encerramento deve ser igual ou posterior à data de início.',

            'local.required' => 'O local do evento é obrigatório.',
            'local.max' => 'O local deve ter no máximo 255 caracteres.',

            'descricao.max' => 'A descrição deve ter no máximo 1000 caracteres.',

            'imagem.image' => 'A imagem de capa deve ser uma imagem válida.',
            'imagem.mimes' => 'A imagem de capa deve ser do tipo jpeg, png, jpg ou webp.',
            'imagem.max' => 'A imagem de capa deve ter no máximo 10MB.',

            'imagens.array' => 'As imagens devem ser enviadas como um array.',
            'imagens.max' => 'Você pode enviar no máximo 10 imagens.',
            'imagens.*.image' => 'Cada imagem deve ser um arquivo de imagem válido.',
            'imagens.*.mimes' => 'As imagens devem ser do tipo jpeg, png, jpg ou webp.',
            'imagens.*.max' => 'Cada imagem deve ter no máximo 10MB.',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if ($request->hasFile('imagens') && count($request->file('imagens')) > 10) {
            return response()->json([
                'errors' => ['imagens' => ['Você pode enviar no máximo 10 imagens.']]
            ], 422);
        }

        try {
            return DB::transaction(function () use ($request) {
                $data = $request->only(['titulo', 'data_inicio', 'data_fim', 'local', 'descricao']);

                if ($request->hasFile('imagem')) {
                    $path = $request->file('imagem')->store('eventos', 'public');
                    $data['imagem'] = $path;
                }

                $evento = Evento::create($data);

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
                'request_data' => $request->except(['imagem', 'imagens']),
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

        if ($request->has('imagens') && is_array($request->input('imagens'))) {
            $decodedImagens = [];
            foreach ($request->input('imagens') as $imagem) {
                if (is_string($imagem)) {
                    $decodedItem = json_decode($imagem, true);
                    if (json_last_error() === JSON_ERROR_NONE) {
                        $decodedImagens[] = $decodedItem;
                    }
                } elseif (is_array($imagem)) {
                    $decodedImagens[] = $imagem;
                }
            }
            $request->merge(['imagens' => $decodedImagens]);
        }

        $rules = [
            'titulo' => 'sometimes|required|string|max:255',
            'data_inicio' => 'sometimes|required|date|after_or_equal:today',
            'data_fim' => 'sometimes|required|date|after_or_equal:data_inicio',
            'local' => 'sometimes|required|string|max:255',
            'descricao' => 'nullable|string|max:1000',
            'imagem' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:10240',
            'imagens' => 'nullable|array|max:10',
            'imagens.*.src' => 'required|string',
        ];

        $messages = [
            'titulo.required' => 'O título do evento é obrigatório.',
            'titulo.max' => 'O título deve ter no máximo 255 caracteres.',

            'data_inicio.required' => 'A data de início é obrigatória.',
            'data_inicio.date' => 'A data de início deve ser uma data válida.',
            'data_inicio.after_or_equal' => 'A data de início deve ser hoje ou uma data futura.',

            'data_fim.required' => 'A data de encerramento é obrigatória.',
            'data_fim.date' => 'A data de encerramento deve ser uma data válida.',
            'data_fim.after_or_equal' => 'A data de encerramento deve ser igual ou posterior à data de início.',

            'local.required' => 'O local do evento é obrigatório.',
            'local.max' => 'O local deve ter no máximo 255 caracteres.',

            'descricao.max' => 'A descrição deve ter no máximo 1000 caracteres.',

            'imagem.image' => 'A imagem de capa deve ser uma imagem válida.',
            'imagem.mimes' => 'A imagem de capa deve ser do tipo jpeg, png, jpg ou webp.',
            'imagem.max' => 'A imagem de capa deve ter no máximo 10MB.',

            'imagens.array' => 'As imagens devem ser enviadas como um array.',
            'imagens.max' => 'Você pode enviar no máximo 10 imagens.',
            'imagens.*.image' => 'Cada imagem deve ser um arquivo de imagem válido.',
            'imagens.*.mimes' => 'As imagens devem ser do tipo jpeg, png, jpg ou webp.',
            'imagens.*.max' => 'Cada imagem deve ter no máximo 10MB.',
        ];

        $validator = Validator::make($request->all(), $rules, $messages);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if ($request->hasFile('imagens')) {
            $totalImagens = count($request->file('imagens'));
            $imagensExistentes = ImagemEvento::where('evento_id', $evento->id)->count();

            if (($totalImagens + $imagensExistentes) > 10) {
                return response()->json([
                    'errors' => ['imagens' => ['O total de imagens não pode exceder 10.']]
                ], 422);
            }
        }

        $imgRules = [];
        if ($request->hasFile('imagens')) {
            $imgRules['imagens.*'] = 'image|mimes:jpeg,png,jpg,webp|max:10240';
        }
        if ($request->hasFile('imagem')) {
            $imgRules['imagem'] = 'image|mimes:jpeg,png,jpg,webp|max:10240';
        }
        if (!empty($imgRules)) {
            $imgValidator = Validator::make($request->all(), $imgRules);
            if ($imgValidator->fails()) {
                return response()->json(['errors' => $imgValidator->errors()], 422);
            }
        }

        try {
            return DB::transaction(function () use ($request, $evento) {

                $fillable = $evento->getFillable();
                $data = [];
                foreach ($fillable as $field) {
                    if ($request->has($field) && $field !== 'imagem' && $field !== 'imagens') {
                        $data[$field] = $request->input($field);
                    }
                }

                if ($request->has($this->campoImagemCapa) || $request->hasFile('imagem')) {
                    $data['imagem'] = $this->processarCapaParaUpdate($request, $evento);
                }

                if (!empty($data)) {
                    $evento->update($data);
                }

                if ($request->has('imagens') || $request->hasFile('imagens')) {
                    $this->sincronizarGaleria($request, $evento);
                }

                return response()->json($evento->fresh('imagens'), 200);
            });
        } catch (\Exception $e) {
            Log::error('Erro ao atualizar evento: ' . $e->getMessage(), [
                'evento_id' => $evento->id,
                'request_data' => $request->except(['imagem', 'imagens']),
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

            if ($evento->imagem) {
                $oldPath = str_replace('/storage/', '', $evento->imagem);
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
}