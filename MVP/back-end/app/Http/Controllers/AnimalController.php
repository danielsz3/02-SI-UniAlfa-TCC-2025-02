<?php

namespace App\Http\Controllers;

use App\Models\Animal;
use App\Models\ImagemAnimal;
use App\Models\Usuario;
use App\Traits\SearchIndex;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Arr;
use Carbon\Carbon;

class AnimalController extends Controller
{
    use SearchIndex;

    /**
     * Listar animais (suporta paginação, filtros e ordenação)
     */
    public function index(Request $request): JsonResponse
    {
        try {
            return $this->SearchIndex(
                $request,
                Animal::with('imagens'),
                'animais',
                ['nome', 'descricao']
            );
        } catch (\Exception $e) {
            Log::error('Erro ao listar animais: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['error' => 'Não foi possível carregar os animais'], 500);
        }
    }

    /**
     * Criar animal
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nome' => 'required|string|max:100',
            'sexo' => 'required|in:macho,femea',

            'data_nascimento' => 'nullable|date|after:1900-01-01|before_or_equal:today',

            'castrado' => 'nullable|boolean',
            'vale_castracao' => 'nullable|boolean',
            'descricao' => 'nullable|string|max:2000',
            'tipo_animal' => 'required|in:cao,gato,outro',

            'nivel_energia' => 'nullable|in:baixa,moderada,alta',
            'tamanho' => 'nullable|in:pequeno,medio,grande',
            'tempo_necessario' => 'nullable|in:pouco_tempo,tempo_moderado,muito_tempo',
            'ambiente_ideal' => 'nullable|in:area_pequena,area_media,area_externa',

            'imagens' => 'nullable|array|max:10',
            'imagens.*' => 'image|mimes:jpeg,png,jpg,gif,webp|max:10240',
        ], [
            'nome.required' => 'O nome do animal é obrigatório.',
            'nome.max' => 'O nome pode ter no máximo 100 caracteres.',

            'sexo.required' => 'O sexo é obrigatório.',
            'sexo.in' => 'O sexo deve ser "macho" ou "femea".',

            'data_nascimento.date' => 'A data de nascimento deve ser uma data válida.',
            'data_nascimento.after' => 'A data de nascimento deve ser posterior a 01/01/1900.',
            'data_nascimento.before_or_equal' => 'A data de nascimento não pode ser no futuro.',

            'tipo_animal.required' => 'O tipo do animal é obrigatório.',
            'tipo_animal.in' => 'O tipo do animal deve ser "cao", "gato" ou "outro".',

            'imagens.array' => 'As imagens devem ser enviadas como um array.',
            'imagens.max' => 'Você pode enviar no máximo 10 imagens.',
            'imagens.*.image' => 'Cada arquivo enviado deve ser uma imagem válida.',
            'imagens.*.max' => 'Cada imagem deve ter no máximo 10MB.',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            return DB::transaction(function () use ($request) {
                $animal = Animal::create($request->only([
                    'nome',
                    'sexo',
                    'data_nascimento',
                    'castrado',
                    'vale_castracao',
                    'descricao',
                    'tipo_animal',
                    'nivel_energia',
                    'tamanho',
                    'tempo_necessario',
                    'ambiente_ideal'
                ]));

                $files = Arr::wrap($request->file('imagens', []));

                foreach ($files as $file) {
                    if ($file && $file->isValid()) {
                        $path = $file->store('animais', 'public');
                        [$width, $height] = @getimagesize($file->getRealPath()) ?: [null, null];

                        ImagemAnimal::create([
                            'animal_id' => $animal->id,
                            'caminho' => $path,
                            'width' => $width,
                            'height' => $height,
                        ]);
                    }
                }

                return response()->json($animal->load('imagens'), 201);
            });
        } catch (\Exception $e) {
            Log::error('Erro ao criar animal: ' . $e->getMessage(), ['exception' => $e, 'payload' => $request->except('imagens')]);
            return response()->json([
                'error' => 'Não foi possível criar o animal',
                'message' => config('app.debug') ? $e->getMessage() : 'Erro interno do servidor'
            ], 500);
        }
    }

    /**
     * Mostrar um animal
     */
    public function show($id): JsonResponse
    {
        try {
            $animal = Animal::with('imagens')->find($id);

            if (!$animal) {
                return response()->json(['error' => 'Animal não encontrado'], 404);
            }

            return response()->json($animal, 200);
        } catch (\Exception $e) {
            Log::error('Erro ao exibir animal: ' . $e->getMessage(), ['id' => $id, 'exception' => $e]);
            return response()->json(['error' => 'Não foi possível carregar o animal'], 500);
        }
    }

    /**
     * Atualizar animal
     */
    public function update(Request $request, $id): JsonResponse
    {
        $animal = Animal::find($id);

        if (!$animal) {
            return response()->json(['error' => 'Animal não encontrado'], 404);
        }

        $rules = [
            'nome' => 'sometimes|required|string|max:100',
            'sexo' => 'sometimes|required|in:macho,femea',

            'data_nascimento' => 'nullable|date|after:1900-01-01|before_or_equal:today',

            'castrado' => 'nullable|boolean',
            'vale_castracao' => 'nullable|boolean',
            'descricao' => 'nullable|string|max:2000',
            'tipo_animal' => 'sometimes|required|in:cao,gato,outro',

            'nivel_energia' => 'nullable|in:baixa,moderada,alta',
            'tamanho' => 'nullable|in:pequeno,medio,grande',
            'tempo_necessario' => 'nullable|in:pouco_tempo,tempo_moderado,muito_tempo',
            'ambiente_ideal' => 'nullable|in:area_pequena,area_media,area_externa',

            'imagens' => 'nullable|array|max:10',
        ];

        // Só valida como file se houver arquivos enviados
        if ($request->hasFile('imagens')) {
            $rules['imagens.*'] = 'file|image|mimes:jpeg,png,jpg,gif|max:10240';
        }

        $validator = Validator::make($request->all(), $rules, [
            'nome.required' => 'O nome do animal é obrigatório.',
            'nome.max' => 'O nome pode ter no máximo 100 caracteres.',

            'sexo.in' => 'O sexo deve ser "macho" ou "femea".',

            'data_nascimento.date' => 'A data de nascimento deve ser uma data válida.',
            'data_nascimento.after' => 'A data de nascimento deve ser posterior a 01/01/1900.',
            'data_nascimento.before_or_equal' => 'A data de nascimento não pode ser no futuro.',

            'tipo_animal.in' => 'O tipo do animal deve ser "cao", "gato" ou "outro".',
        ]);      

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            return DB::transaction(function () use ($request, $animal) {
                $animal->update($request->only([
                    'nome',
                    'data_nascimento',
                    'sexo',
                    'castrado',
                    'vale_castracao',
                    'descricao',
                    'tipo_animal',
                    'nivel_energia',
                    'tamanho',
                    'tempo_necessario',
                    'ambiente_ideal'
                ]));

                // === Tratamento de imagens ===
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
                    $imagensAtuais = ImagemAnimal::where('animal_id', $animal->id)->get();

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
                            $path = $file->store('animais', 'public');
                            [$width, $height] = @getimagesize($file->getRealPath()) ?: [null, null];

                            ImagemAnimal::create([
                                'animal_id' => $animal->id,
                                'caminho' => $path,
                                'width' => $width,
                                'height' => $height,
                            ]);
                        }
                    }
                }

                return response()->json($animal->fresh('imagens'), 200);
            });
        } catch (\Exception $e) {
            Log::error('Erro ao atualizar animal: ' . $e->getMessage(), ['id' => $id, 'exception' => $e, 'payload' => $request->except('imagens')]);
            return response()->json([
                'error' => 'Não foi possível atualizar o animal',
                'message' => config('app.debug') ? $e->getMessage() : 'Erro interno do servidor'
            ], 500);
        }
    }

    /**
     * Deletar (soft delete)
     */
    public function destroy($id): JsonResponse
    {
        try {
            $animal = Animal::with('imagens')->find($id);
            if (!$animal) {
                return response()->json(['error' => 'Animal não encontrado'], 404);
            }

            // Apagar arquivos do storage
            foreach ($animal->imagens as $img) {
                if ($img->caminho) {
                    $oldPath = ltrim(str_replace('/storage/', '', $img->caminho), '/');
                    if (Storage::disk('public')->exists($oldPath)) {
                        Storage::disk('public')->delete($oldPath);
                    }
                }
            }

            $animal->delete(); // soft delete
            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error('Erro ao deletar animal: ' . $e->getMessage(), ['id' => $id, 'exception' => $e]);
            return response()->json([
                'error' => 'Não foi possível excluir o animal',
                'message' => config('app.debug') ? $e->getMessage() : 'Erro interno do servidor'
            ], 500);
        }
    }

    /**
     * Restaurar animal deletado
     */
    public function restore($id): JsonResponse
    {
        try {
            $animal = Animal::withTrashed()->find($id);

            if (!$animal) {
                return response()->json(['error' => 'Animal não encontrado'], 404);
            }

            if (!$animal->trashed()) {
                return response()->json(['error' => 'Animal já está ativo'], 400);
            }

            $animal->restore();
            return response()->json($animal->fresh('imagens'), 200);
        } catch (\Exception $e) {
            Log::error('Erro ao restaurar animal: ' . $e->getMessage(), ['id' => $id, 'exception' => $e]);
            return response()->json([
                'error' => 'Não foi possível restaurar o animal',
                'message' => config('app.debug') ? $e->getMessage() : 'Erro interno do servidor'
            ], 500);
        }
    }

    /**
     * Recomendar animais para um usuário de acordo com preferências
     */
    public function recomendar($usuarioId): JsonResponse
    {
        try {
            $usuario = Usuario::with('preferencias')->find($usuarioId);

            if (!$usuario) {
                return response()->json(['error' => 'Usuário não encontrado'], 404);
            }

            $pref = $usuario->preferencias;
            if (!$pref) {
                return response()->json(['error' => 'Usuário não possui preferências definidas'], 400);
            }

            // Considera apenas animais ativos (não deletados)
            $animais = Animal::with('imagens')->get();

            $resultados = $animais->map(function ($animal) use ($pref) {
                $score = 0;
                $total = 4; // número de critérios ponderados

                if (!empty($pref->tamanho_pet) && $pref->tamanho_pet === $animal->tamanho) {
                    $score += 1;
                }
                if (!empty($pref->tempo_disponivel) && $pref->tempo_disponivel === $animal->tempo_necessario) {
                    $score += 1;
                }
                if (!empty($pref->estilo_vida) && $pref->estilo_vida === $animal->nivel_energia) {
                    $score += 1;
                }
                if (!empty($pref->espaco_casa) && $pref->espaco_casa === $animal->ambiente_ideal) {
                    $score += 1;
                }

                $percent = $total > 0 ? intval(($score / $total) * 100) : 0;

                return [
                    'animal' => $animal,
                    'afinidade' => $score,
                    'afinidade_percent' => $percent,
                ];
            });

            $ordenados = $resultados->sortByDesc('afinidade')->values();

            return response()->json($ordenados, 200);
        } catch (\Exception $e) {
            Log::error('Erro ao recomendar animais: ' . $e->getMessage(), ['usuario_id' => $usuarioId, 'exception' => $e]);
            return response()->json([
                'error' => 'Não foi possível gerar recomendações',
                'message' => config('app.debug') ? $e->getMessage() : 'Erro interno do servidor'
            ], 500);
        }
    }
}
