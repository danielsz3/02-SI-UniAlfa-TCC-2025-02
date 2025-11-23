<?php

namespace App\Http\Controllers;

use App\Models\Animal;
use App\Models\ImagemAnimal;
use App\Models\MatchAfinidade;
use App\Models\Usuario;
use App\Traits\ManagerGallery;
use App\Traits\SearchIndex;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Illuminate\Http\UploadedFile;

class AnimalController extends Controller
{
    use SearchIndex;
    use ManagerGallery;

    protected $campoImagemCapa = 'imagem';
    protected $campoGaleria = 'imagens';
    protected $storagePath = 'animais';
    protected $modeloRelacaoGaleria = ImagemAnimal::class;
    protected $foreignKeyGaleria = 'animal_id';

    public function index(Request $request): JsonResponse
    {
        try {
            return $this->SearchIndex(
                $request,
                Animal::with(['imagens', 'usuario', 'larTemporario']),
                'animais',
                ['nome', 'descricao']
            );
        } catch (\Exception $e) {
            Log::error('Erro ao listar animais: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['error' => 'Não foi possível carregar os animais'], 500);
        }
    }

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
            'imagens.*' => 'image|mimes:jpeg,png,jpg,webp|max:10240',
            'usuario_id' => 'nullable|exists:usuarios,id',
            'lar_temporario_id' => 'nullable|exists:lares_temporarios,id',
            'fica_usuario' => 'nullable|boolean',
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
            'usuario_id.exists' => 'Usuário não encontrado.',
            'lar_temporario_id.exists' => 'Lar temporário não encontrado.',
            'fica_usuario.boolean' => 'O campo fica_usuario deve ser verdadeiro ou falso.',
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
                    'situacao',
                    'descricao',
                    'tipo_animal',
                    'nivel_energia',
                    'tamanho',
                    'tempo_necessario',
                    'ambiente_ideal',
                    'usuario_id',
                    'lar_temporario_id',
                    'fica_usuario',
                ]));

                $files = Arr::wrap($request->file('imagens', []));

                foreach ($files as $file) {
                    if ($file instanceof UploadedFile && $file->isValid()) {
                        $nomeOriginal = $file->getClientOriginalName();
                        $ext = $file->getClientOriginalExtension() ?: 'jpg';
                        $filename = 'animais/' . Str::uuid() . '.' . $ext;
                        $path = $file->storeAs('animais', basename($filename), 'public');
                        [$width, $height] = @getimagesize($file->getRealPath()) ?: [null, null];

                        ImagemAnimal::create([
                            'animal_id' => $animal->id,
                            'caminho' => $path,
                            'nome_original' => $nomeOriginal,
                            'width' => $width,
                            'height' => $height,
                        ]);
                    }
                }

                $animal->load(['imagens', 'usuario', 'larTemporario']);
                $animal->imagens->transform(function ($img) {
                    $img->url = Storage::url($img->caminho);
                    return $img;
                });

                return response()->json($animal, 201);
            });
        } catch (\Exception $e) {
            Log::error('Erro ao criar animal: ' . $e->getMessage(), ['exception' => $e, 'payload' => $request->except('imagens')]);
            return response()->json([
                'error' => 'Não foi possível criar o animal',
                'message' => config('app.debug') ? $e->getMessage() : 'Erro interno do servidor'
            ], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $animal = Animal::with(['imagens', 'usuario', 'larTemporario'])->find($id);

            if (!$animal) {
                return response()->json(['error' => 'Animal não encontrado'], 404);
            }

            $animal->imagens->transform(function ($img) {
                $img->url = Storage::url($img->caminho);
                return $img;
            });

            return response()->json($animal, 200);
        } catch (\Exception $e) {
            Log::error('Erro ao exibir animal: ' . $e->getMessage(), ['id' => $id, 'exception' => $e]);
            return response()->json(['error' => 'Não foi possível carregar o animal'], 500);
        }
    }

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
            'usuario_id' => 'required|exists:usuarios,id',
            'lar_temporario_id' => 'nullable|exists:lares_temporarios,id',
            'fica_usuario' => 'nullable|boolean',
        ];

        $messages = [
            'nome.required' => 'O nome do animal é obrigatório.',
            'nome.max' => 'O nome pode ter no máximo 100 caracteres.',
            'sexo.in' => 'O sexo deve ser "macho" ou "femea".',
            'data_nascimento.date' => 'A data de nascimento deve ser uma data válida.',
            'data_nascimento.after' => 'A data de nascimento deve ser posterior a 01/01/1900.',
            'data_nascimento.before_or_equal' => 'A data de nascimento não pode ser no futuro.',
            'tipo_animal.in' => 'O tipo do animal deve ser "cao", "gato" ou "outro".',
            'imagens.array' => 'As imagens devem ser enviadas como um array.',
            'imagens.max' => 'Você pode enviar no máximo 10 imagens.',
            'imagens.*.image' => 'Cada arquivo enviado deve ser uma imagem válida.',
            'imagens.*.max' => 'Cada imagem deve ter no máximo 10MB.',
            'usuario_id.exists' => 'Usuário não encontrado.',
            'lar_temporario_id.exists' => 'Lar temporário não encontrado.',
            'fica_usuario.boolean' => 'O campo fica_usuario deve ser verdadeiro ou falso.',
        ];

        $validator = Validator::make($request->all(), $rules, $messages);

        if ($request->fica_usuario == 0) {
            $validator = Validator::make($request->all(), [
                'lar_temporario_id' => 'required|exists:lares_temporarios,id',
            ]);
        }

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $imagensExistentes = $animal->imagens()->count();
        $novasImagens = is_array($request->file('imagens')) ? count($request->file('imagens')) : 0;
        $total = $imagensExistentes + $novasImagens;

        if ($total > 10) {
            return response()->json([
                'errors' => [
                    'imagens' => ['O total de imagens não pode exceder 10.'],
                ],
            ], 422);
        }

        try {
            return DB::transaction(function () use ($request, $animal) {

                $animal->update($request->only([
                    'nome',
                    'data_nascimento',
                    'sexo',
                    'castrado',
                    'situacao',
                    'vale_castracao',
                    'descricao',
                    'tipo_animal',
                    'nivel_energia',
                    'tamanho',
                    'tempo_necessario',
                    'ambiente_ideal',
                    'usuario_id',
                    'lar_temporario_id',
                    'fica_usuario',
                ]));

                if ($request->has('imagens') || $request->hasFile('imagens')) {
                    $this->sincronizarGaleria($request, $animal);
                }

                $fresh = $animal->fresh(['imagens', 'usuario', 'larTemporario']);
                $fresh->imagens->transform(function ($img) {
                    $img->url = Storage::url($img->caminho);
                    return $img;
                });

                return response()->json($fresh, 200);
            });
        } catch (\Exception $e) {
            Log::error('Erro ao atualizar animal: ' . $e->getMessage(), [
                'id' => ($animal->id ?? null),
                'exception' => $e,
                'payload' => $request->except('imagens'),
            ]);
            return response()->json([
                'error' => 'Não foi possível atualizar o animal',
                'message' => config('app.debug') ? $e->getMessage() : 'Erro interno do servidor'
            ], 500);
        }
    }

    public function destroy($id): JsonResponse
    {
        try {
            $animal = Animal::with('imagens')->find($id);
            if (!$animal) {
                return response()->json(['error' => 'Animal não encontrado'], 404);
            }

            $toDelete = [];
            foreach ($animal->imagens as $img) {
                if ($img->caminho && Storage::disk('public')->exists($img->caminho)) {
                    Storage::disk('public')->delete($img->caminho);
                }
                $toDelete[] = $img->id;
            }
            if (!empty($toDelete)) {
                ImagemAnimal::whereIn('id', $toDelete)->delete();
            }

            $animal->delete();

            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error('Erro ao deletar animal: ' . $e->getMessage(), ['id' => $id, 'exception' => $e]);
            return response()->json([
                'error' => 'Não foi possível excluir o animal',
                'message' => config('app.debug') ? $e->getMessage() : 'Erro interno do servidor'
            ], 500);
        }
    }

    public function recomendar(Request $request, $usuarioId): JsonResponse
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

            $animaisComMatch = MatchAfinidade::where('usuario_id', $usuarioId)
                ->pluck('animal_id')
                ->toArray();

            $animais = Animal::with(['imagens', 'usuario', 'larTemporario'])->get()->whereIn('situacao', ['disponivel', 'em_adocao']);

            $animaisFiltrados = $animais->filter(function ($animal) use ($animaisComMatch) {
                return !in_array($animal->id, $animaisComMatch);
            });

            $resultados = $animaisFiltrados->map(function ($animal) use ($pref) {
                $score = 0;
                $total = 4;

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

            $range = json_decode($request->query('range', '[0,9]'), true);
            $start = $range[0] ?? 0;
            $end   = $range[1] ?? 9;
            $perPage = ($end - $start + 1);
            $page    = intval($start / $perPage) + 1;

            $itemsForCurrentPage = $ordenados->forPage($page, $perPage)->values();
            $total = $ordenados->count();

            $response = response()
                ->json($itemsForCurrentPage->toArray())
                ->header('Content-Range', "recomendacoes {$start}-{$end}/{$total}")
                ->header('Access-Control-Expose-Headers', 'Content-Range');

            return $response;
        } catch (\Exception $e) {
            Log::error('Erro ao recomendar animais: ' . $e->getMessage(), ['usuario_id' => $usuarioId, 'exception' => $e]);
            return response()->json([
                'error' => 'Não foi possível gerar recomendações',
                'message' => config('app.debug') ? $e->getMessage() : 'Erro interno do servidor'
            ], 500);
        }
    }
}
