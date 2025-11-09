<?php

namespace App\Http\Controllers;

use App\Models\MatchAfinidade;
use App\Models\Adocao;
use App\Traits\SearchIndex;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class MatchAfinidadeController extends Controller
{
    use SearchIndex;

    public function index(Request $request): JsonResponse
    {
        try {
            $query = MatchAfinidade::with(['usuario', 'animal']);

            if ($request->filled('status')) {
                $query->where('status', $request->input('status'));
            }
            if ($request->filled('animal_id')) {
                $query->where('animal_id', $request->input('animal_id'));
            }
            if ($request->filled('usuario_id')) {
                $query->where('usuario_id', $request->input('usuario_id'));
            }

            return $this->SearchIndex($request, $query, 'match_afinidades', []);
        } catch (\Exception $e) {
            Log::error('Erro ao listar matches: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['error' => 'Não foi possível carregar os matches'], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'usuario_id' => 'required|exists:usuarios,id',
            'animal_id' => 'required|exists:animais,id',
            'status' => ['required', Rule::in(['em_adocao', 'escolhido', 'rejeitado'])],
        ], [
            'usuario_id.required' => 'O usuário é obrigatório.',
            'usuario_id.exists' => 'Usuário não encontrado.',
            'animal_id.required' => 'O animal é obrigatório.',
            'animal_id.exists' => 'Animal não encontrado.',
            'status.required' => 'O status é obrigatório.',
            'status.in' => 'Status inválido.',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $existe = MatchAfinidade::where('usuario_id', $request->usuario_id)
                ->where('animal_id', $request->animal_id)
                ->exists();

            if ($existe) {
                return response()->json([
                    'error' => 'Já existe um match para este usuário e animal.'
                ], 422);
            }

            return DB::transaction(function () use ($request) {
                $match = MatchAfinidade::create([
                    'usuario_id' => $request->usuario_id,
                    'animal_id' => $request->animal_id,
                    'status' => $request->status,
                ]);

                $match->load(['usuario', 'animal']);

                return response()->json($match, 201);
            });
        } catch (\Exception $e) {
            Log::error('Erro ao criar match: ' . $e->getMessage(), [
                'exception' => $e,
                'payload' => $request->all()
            ]);
            return response()->json([
                'error' => 'Não foi possível criar o match',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $match = MatchAfinidade::with(['usuario', 'animal'])->find($id);

            if (!$match) {
                return response()->json(['error' => 'Match não encontrado'], 404);
            }

            return response()->json($match, 200);
        } catch (\Exception $e) {
            Log::error('Erro ao exibir match: ' . $e->getMessage(), ['id' => $id, 'exception' => $e]);
            return response()->json(['error' => 'Não foi possível carregar o match'], 500);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        try {
            $match = MatchAfinidade::find($id);

            if (!$match) {
                return response()->json(['error' => 'Match não encontrado'], 404);
            }

            $validator = Validator::make($request->all(), [
                'usuario_id' => 'sometimes|required|exists:usuarios,id',
                'animal_id' => 'sometimes|required|exists:animais,id',
                'status' => ['sometimes', 'required', Rule::in(['em_adocao', 'escolhido', 'rejeitado'])],
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $data = $request->only(['usuario_id', 'animal_id', 'status']);

            if (isset($data['usuario_id']) || isset($data['animal_id'])) {
                $usuarioId = $data['usuario_id'] ?? $match->usuario_id;
                $animalId = $data['animal_id'] ?? $match->animal_id;

                $existe = MatchAfinidade::where('usuario_id', $usuarioId)
                    ->where('animal_id', $animalId)
                    ->where('id', '!=', $match->id)
                    ->exists();

                if ($existe) {
                    return response()->json([
                        'error' => 'Já existe um match para este usuário e animal.'
                    ], 422);
                }
            }

            $match->update($data);

            return response()->json($match->fresh(['usuario', 'animal']), 200);
        } catch (\Exception $e) {
            Log::error('Erro ao atualizar match: ' . $e->getMessage(), [
                'id' => $id,
                'exception' => $e,
                'payload' => $request->all()
            ]);
            return response()->json([
                'error' => 'Não foi possível atualizar o match',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id): JsonResponse
    {
        try {
            $match = MatchAfinidade::find($id);

            if (!$match) {
                return response()->json(['error' => 'Match não encontrado'], 404);
            }

            $match->delete();

            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error('Erro ao deletar match: ' . $e->getMessage(), ['id' => $id, 'exception' => $e]);
            return response()->json(['error' => 'Não foi possível excluir o match'], 500);
        }
    }

    public function restore($id): JsonResponse
    {
        try {
            $match = MatchAfinidade::withTrashed()->find($id);

            if (!$match) {
                return response()->json(['error' => 'Match não encontrado'], 404);
            }

            if (!$match->trashed()) {
                return response()->json(['error' => 'Match já está ativo'], 400);
            }

            $match->restore();

            return response()->json($match->fresh(['usuario', 'animal']), 200);
        } catch (\Exception $e) {
            Log::error('Erro ao restaurar match: ' . $e->getMessage(), ['id' => $id, 'exception' => $e]);
            return response()->json(['error' => 'Não foi possível restaurar o match'], 500);
        }
    }

    public function MudarStatus(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Usuário não autenticado'], 401);
        }

        $validator = Validator::make($request->all(), [
            'usuario_id' => 'required|exists:usuarios,id',
            'animal_id' => 'required|exists:animais,id',
            'status' => ['required', Rule::in(['em_adocao', 'escolhido', 'rejeitado'])],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $match = MatchAfinidade::where('usuario_id', $request->usuario_id)
                ->where('animal_id', $request->animal_id)
                ->firstOrCreate([
                    'status' => $request->status,
                    'usuario_id' => $request->usuario_id,
                    'animal_id' => $request->animal_id,
                ]);

            if ($user->id !== (int)$request->usuario_id && ($user->role ?? '') !== 'admin') {
                return response()->json(['error' => 'Não autorizado a alterar este match'], 403);
            }

            return DB::transaction(function () use ($match, $request) {
                if ($match->wasRecentlyCreated) {
                    $newStatus = $request->status;
                    $match->status = $newStatus;
                    $match->save();

                    if ($newStatus === 'escolhido') {
                        $existeAprovada = Adocao::where('animal_id', $match->animal_id)
                            ->where('status', 'aprovado')
                            ->exists();

                        if ($existeAprovada) {
                            return response()->json(['error' => 'Este animal já possui uma adoção aprovada.'], 422);
                        }

                        $adocao = Adocao::firstOrCreate(
                            ['usuario_id' => $match->usuario_id, 'animal_id' => $match->animal_id],
                            ['status' => 'aprovado']
                        );

                        if ($adocao->status !== 'aprovado') {
                            $adocao->status = 'aprovado';
                            $adocao->save();
                        }

                        Adocao::where('animal_id', $match->animal_id)
                            ->where('id', '!=', $adocao->id)
                            ->where('status', '!=', 'negado')
                            ->update(['status' => 'negado']);

                        $animal = $match->animal;
                        if ($animal) {
                            $animal->situacao = 'adotado';
                            $animal->save();
                        }
                    } elseif ($newStatus === 'rejeitado') {
                        // ao rejeitar o match, marcar a adoção vinculada como negada (se existir)
                        $adocao = Adocao::where('usuario_id', $match->usuario_id)
                            ->where('animal_id', $match->animal_id)
                            ->first();

                        if ($adocao && $adocao->status !== 'negado') {
                            $adocao->status = 'negado';
                            $adocao->save();
                        }

                        // Se não existir nenhuma adoção aprovada para o animal, liberar a situacao do animal
                        $existeAprovada = Adocao::where('animal_id', $match->animal_id)
                            ->where('status', 'aprovado')
                            ->exists();

                        if (!$existeAprovada) {
                            $animal = $match->animal;
                            if ($animal) {
                                $animal->situacao = 'disponivel';
                                $animal->save();
                            }
                        }
                    }
                }

                return response()->json($match->fresh(['usuario', 'animal']), 200);
            });
        } catch (\Exception $e) {
            Log::error('Erro ao alterar status do match: ' . $e->getMessage(), [
                'payload' => $request->all(),
                'exception' => $e
            ]);
            return response()->json([
                'error' => 'Não foi possível alterar o status do match',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
