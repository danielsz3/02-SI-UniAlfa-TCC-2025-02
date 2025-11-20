<?php

namespace App\Http\Controllers;

use App\Models\Adocao;
use App\Models\Animal;
use App\Models\MatchAfinidade;
use App\Traits\SearchIndex;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class AdocaoController extends Controller
{
    use SearchIndex;

    public function index(Request $request): JsonResponse
    {
        try {
            $query = Adocao::with(['usuario', 'animal.imagens']);

            if ($request->filled('status')) {
                $query->where('status', $request->input('status'));
            }
            if ($request->filled('animal_id')) {
                $query->where('animal_id', $request->input('animal_id'));
            }
            if ($request->filled('usuario_id')) {
                $query->where('usuario_id', $request->input('usuario_id'));
            }

            return $this->SearchIndex($request, $query, 'adocoes', []);
        } catch (\Exception $e) {
            Log::error('Erro ao listar adoções: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['error' => 'Não foi possível carregar as adoções'], 500);
        }
    }

   public function store(Request $request): JsonResponse
{
    $user = $request->user();
    if (!$user) {
        return response()->json(['error' => 'Usuário não autenticado'], 401);
    }

    $validator = Validator::make($request->all(), [
        'animal_id' => 'required|exists:animais,id',
        'qtd_pessoas_casa' => ['required', Rule::in([
            'sozinho',
            'uma_pessoa',
            'duas_pessoas',
            'tres_pessoas',
            'quatro_ou_mais'
        ])],
        'possui_filhos' => 'required|boolean',
        'sobre_rotina' => 'required|array|min:1',
        'sobre_rotina.*' => [Rule::in([
            'home_office',
            'ninguem_fica_em_casa_dia',
            'gente_em_casa_dia',
            'muitas_visitas',
            'eventos_frequentes',
            'ruidos_vizinhanca'
        ])],
        'acesso_rua_janelas' => ['required', Rule::in([
            'janelas_telas_sem_acesso_rua',
            'janelas_sem_telas',
            'janelas_sem_telas_instalarei'
        ])],
        'acesso_rua_portoes_muros' => ['required', Rule::in([
            'impedem_escape',
            'permitem_acesso_rua',
            'serao_adaptados'
        ])],
        'renda_familiar' => ['required', Rule::in(['acima_2_sm', 'abaixo_2_sm', 'outro'])],
        'aceita_termos' => 'required|accepted',
    ], [
        'animal_id.required' => 'O animal é obrigatório.',
        'animal_id.exists' => 'Animal não encontrado.',
        'qtd_pessoas_casa.required' => 'Informe com quantas pessoas você mora.',
        'possui_filhos.required' => 'Informe se possui filhos.',
        'sobre_rotina.required' => 'Selecione ao menos uma opção sobre sua rotina.',
        'acesso_rua_janelas.required' => 'Informe sobre o acesso à rua pelas janelas.',
        'acesso_rua_portoes_muros.required' => 'Informe sobre portões e muros.',
        'renda_familiar.required' => 'Informe a renda familiar.',
        'aceita_termos.required' => 'Você precisa aceitar os termos.',
    ]);

    // Validação extra para impedir duplicidade (inclui registros soft-deleted)
    $validator->after(function ($validator) use ($request, $user) {
        if ($request->filled('animal_id') && $user) {
            $exists = Adocao::withTrashed()
                ->where('usuario_id', $user->id)
                ->where('animal_id', $request->input('animal_id'))
                ->exists();
            if ($exists) {
                $validator->errors()->add('animal_id', 'Você já fez uma solicitação para este animal anteriormente.');
            }
        }
    });

    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
    }

    try {
        $animal = Animal::find($request->animal_id);

        if (!$animal) {
            return response()->json(['error' => 'Animal não encontrado.'], 404);
        }

        if ($animal->situacao === 'adotado') {
            return response()->json([
                'error' => 'Este animal já foi adotado e não pode receber novas solicitações.'
            ], 422);
        }

        if ($animal->usuario && $animal->usuario->id == $user->id) {
            return response()->json([
                'error' => 'Não é permitido adotar um animal que você mesmo anunciou.'
            ], 422);
        }

        return DB::transaction(function () use ($request, $user, $animal) {
            // Revalida dentro da transação para evitar condição de corrida
            $existingAdocao = Adocao::withTrashed()
                ->where('usuario_id', $user->id)
                ->where('animal_id', $animal->id)
                ->first();

            if ($existingAdocao) {
                // Se existe e está deletado, restaura e atualiza; se existe ativo, retorna erro
                if ($existingAdocao->trashed()) {
                    $existingAdocao->restore();
                    $existingAdocao->update([
                        'status' => 'em_aprovacao',
                        'qtd_pessoas_casa' => $request->qtd_pessoas_casa,
                        'possui_filhos' => $request->possui_filhos,
                        'sobre_rotina' => $request->input('sobre_rotina'),
                        'acesso_rua_janelas' => $request->acesso_rua_janelas,
                        'acesso_rua_portoes_muros' => $request->acesso_rua_portoes_muros,
                        'renda_familiar' => $request->renda_familiar,
                        'aceita_termos' => $request->aceita_termos,
                    ]);
                    $existingAdocao->load(['usuario', 'animal.imagens']);
                    return response()->json($existingAdocao, 200);
                } else {
                    return response()->json([
                        'error' => 'Você já fez uma solicitação para este animal anteriormente.'
                    ], 422);
                }
            }

            // Normaliza sobre_rotina para array
            $sobreRotina = $request->input('sobre_rotina', []);
            if (is_string($sobreRotina)) {
                $decoded = json_decode($sobreRotina, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $sobreRotina = $decoded;
                } else {
                    $sobreRotina = array_values(array_filter(array_map('trim', explode(',', $sobreRotina))));
                }
            }
            if (!is_array($sobreRotina)) {
                $sobreRotina = (array) $sobreRotina;
            }

            // Cria a adoção com status 'em_aprovacao'
            $adocao = Adocao::create([
                'usuario_id' => $user->id,
                'animal_id' => $animal->id,
                'status' => 'em_aprovacao',
                'qtd_pessoas_casa' => $request->qtd_pessoas_casa,
                'possui_filhos' => $request->possui_filhos,
                'sobre_rotina' => $sobreRotina,
                'acesso_rua_janelas' => $request->acesso_rua_janelas,
                'acesso_rua_portoes_muros' => $request->acesso_rua_portoes_muros,
                'renda_familiar' => $request->renda_familiar,
                'aceita_termos' => $request->aceita_termos,
            ]);

            // Verifica se já existe um match para este usuário e animal
            $match = MatchAfinidade::where('usuario_id', $user->id)
                ->where('animal_id', $animal->id)
                ->first();

            if ($match) {
                // Se já existe match, atualiza o status para 'em_adocao'
                $match->status = 'em_adocao';
                $match->observacao = 'Match atualizado após solicitação de adoção.';
                $match->save();
            } else {
                // Se não existe match, cria um novo com status 'em_adocao'
                MatchAfinidade::create([
                    'usuario_id' => $user->id,
                    'animal_id' => $animal->id,
                    'status' => 'em_adocao',
                    'observacao' => 'Match criado automaticamente após solicitação de adoção.',
                ]);
            }

            $adocao->load(['usuario', 'animal.imagens']);

            return response()->json($adocao, 201);
        });
    } catch (\Exception $e) {
        Log::error('Erro ao criar adoção: ' . $e->getMessage(), [
            'exception' => $e,
            'payload' => $request->except(['aceita_termos'])
        ]);
        return response()->json([
            'error' => 'Não foi possível criar a solicitação de adoção',
            'message' => $e->getMessage()
        ], 500);
    }
}
    public function show($id): JsonResponse
    {
        try {
            $adocao = Adocao::with(['usuario', 'animal.imagens'])->find($id);

            if (!$adocao) {
                return response()->json(['error' => 'Adoção não encontrada'], 404);
            }

            return response()->json($adocao, 200);
        } catch (\Exception $e) {
            Log::error('Erro ao exibir adoção: ' . $e->getMessage(), ['id' => $id, 'exception' => $e]);
            return response()->json(['error' => 'Não foi possível carregar a adoção'], 500);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        try {
            $adocao = Adocao::find($id);

            if (!$adocao) {
                return response()->json(['error' => 'Adoção não encontrada'], 404);
            }

            $validator = Validator::make($request->all(), [
                'qtd_pessoas_casa' => ['sometimes', 'required', Rule::in([
                    'sozinho',
                    'uma_pessoa',
                    'duas_pessoas',
                    'tres_pessoas',
                    'quatro_ou_mais'
                ])],
                'possui_filhos' => 'sometimes|required|boolean',
                'sobre_rotina' => 'sometimes|required|array|min:1',
                'sobre_rotina.*' => [Rule::in([
                    'home_office',
                    'ninguem_fica_em_casa_dia',
                    'gente_em_casa_dia',
                    'muitas_visitas',
                    'eventos_frequentes',
                    'ruidos_vizinhanca'
                ])],
                'acesso_rua_janelas' => ['sometimes', 'required', Rule::in([
                    'janelas_telas_sem_acesso_rua',
                    'janelas_sem_telas',
                    'janelas_sem_telas_instalarei'
                ])],
                'acesso_rua_portoes_muros' => ['sometimes', 'required', Rule::in([
                    'impedem_escape',
                    'permitem_acesso_rua',
                    'serao_adaptados'
                ])],
                'renda_familiar' => ['sometimes', 'required', Rule::in(['acima_2_sm', 'abaixo_2_sm', 'outro'])],
                'aceita_termos' => 'sometimes|required|accepted',
                'status' => ['sometimes', 'required', Rule::in(['em_aprovacao', 'aprovado', 'negado'])],
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            return DB::transaction(function () use ($request, $adocao) {
                $data = $request->only([
                    'qtd_pessoas_casa',
                    'possui_filhos',
                    'sobre_rotina',
                    'acesso_rua_janelas',
                    'acesso_rua_portoes_muros',
                    'renda_familiar',
                    'aceita_termos',
                    'status',
                ]);

                // Se sobre_rotina foi enviado, garantir que seja array
                if (array_key_exists('sobre_rotina', $data)) {
                    $sobreRotina = $data['sobre_rotina'];
                    if (is_string($sobreRotina)) {
                        $decoded = json_decode($sobreRotina, true);
                        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                            $sobreRotina = $decoded;
                        } else {
                            $sobreRotina = array_values(array_filter(array_map('trim', explode(',', $sobreRotina))));
                        }
                    }
                    if (!is_array($sobreRotina)) {
                        $sobreRotina = (array) $sobreRotina;
                    }
                    $data['sobre_rotina'] = $sobreRotina;
                }

                $statusAnterior = $adocao->status;
                $adocao->update($data);

                // Se o status mudou, atualizar o match e o status do animal
                if (isset($data['status']) && $data['status'] !== $statusAnterior) {
                    $match = MatchAfinidade::where('usuario_id', $adocao->usuario_id)
                        ->where('animal_id', $adocao->animal_id)
                        ->first();

                    $animal = $adocao->animal;

                    if ($data['status'] === 'aprovado') {
                        // Atualiza o match para 'finalizado' quando aprovado
                        if ($match) {
                            $match->status = 'finalizado';
                            $match->observacao = "Adoção aprovada.";
                            $match->save();
                        }

                        if ($animal) {
                            $animal->situacao = 'adotado';
                            $animal->fica_usuario = true;
                            $animal->save();

                            // Cancelar outras adoções abertas para o mesmo animal feitas por outros usuários
                            Adocao::where('animal_id', $animal->id)
                                ->where('id', '!=', $adocao->id)
                                ->whereIn('status', ['em_aprovacao'])
                                ->update(['status' => 'negado']);

                            // Atualizar os matches dos outros usuários para 'finalizado'
                            MatchAfinidade::where('animal_id', $animal->id)
                                ->where('usuario_id', '!=', $adocao->usuario_id)
                                ->whereIn('status', ['em_adocao', 'escolhido'])
                                ->update([
                                    'status' => 'finalizado',
                                    'observacao' => 'Afinidade cancelada automaticamente após adoção aprovada para outro usuário.'
                                ]);
                        }
                    } elseif ($data['status'] === 'negado') {
                        // Atualiza o match para 'rejeitado' quando negado
                        if ($match) {
                            $match->status = 'rejeitado';
                            $match->observacao = "Adoção negada.";
                            $match->save();
                        }

                        // Verifica se existe outra adoção aprovada para o animal
                        $existeAprovada = Adocao::where('animal_id', $animal->id)
                            ->where('status', 'aprovado')
                            ->exists();

                        if (!$existeAprovada && $animal) {
                            $animal->situacao = 'disponivel';
                            $animal->save();
                        }
                    }
                }

                return response()->json($adocao->fresh(['usuario', 'animal.imagens']), 200);
            });
        } catch (\Exception $e) {
            Log::error('Erro ao atualizar adoção: ' . $e->getMessage(), [
                'id' => $adocao->id ?? $id,
                'exception' => $e,
                'payload' => $request->except(['aceita_termos'])
            ]);
            return response()->json([
                'error' => 'Não foi possível atualizar a adoção',
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    public function destroy($id): JsonResponse
    {
        try {
            $adocao = Adocao::find($id);

            if (!$adocao) {
                return response()->json(['error' => 'Adoção não encontrada'], 404);
            }

            $adocao->delete();

            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error('Erro ao deletar adoção: ' . $e->getMessage(), ['id' => $id, 'exception' => $e]);
            return response()->json(['error' => 'Não foi possível excluir a adoção'], 500);
        }
    }
}