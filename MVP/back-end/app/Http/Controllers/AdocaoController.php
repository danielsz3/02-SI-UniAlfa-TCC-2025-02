<?php

namespace App\Http\Controllers;

use App\Models\Adocao;
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

    /**
     * Lista de adoções
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Adocao::with(['usuario', 'animal.imagens']);

            // Sem filtro por usuário; comportamento igual às outras controllers
            // Se quiser filtros opcionais:
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

    /**
     * Criar uma nova adoção (formulário completo de uma vez)
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'usuario_id' => 'required|exists:usuarios,id',
            'animal_id' => 'required|exists:animais,id',

            'qtd_pessoas_casa' => ['required', Rule::in([
                'sozinho', 'uma_pessoa', 'duas_pessoas', 'tres_pessoas', 'quatro_ou_mais'
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
            'usuario_id.required' => 'O usuário é obrigatório.',
            'usuario_id.exists' => 'Usuário não encontrado.',
            'animal_id.required' => 'O animal é obrigatório.',
            'animal_id.exists' => 'Animal não encontrado.',

            'qtd_pessoas_casa.required' => 'Informe com quantas pessoas você mora.',
            'qtd_pessoas_casa.in' => 'Opção inválida para quantidade de pessoas.',

            'possui_filhos.required' => 'Informe se possui filhos.',
            'possui_filhos.boolean' => 'Valor inválido para possui filhos.',

            'sobre_rotina.required' => 'Selecione ao menos uma opção sobre sua rotina.',
            'sobre_rotina.array' => 'Rotina deve ser um array.',
            'sobre_rotina.min' => 'Selecione ao menos uma opção sobre sua rotina.',
            'sobre_rotina.*.in' => 'Uma ou mais opções de rotina são inválidas.',

            'acesso_rua_janelas.required' => 'Informe sobre o acesso à rua pelas janelas.',
            'acesso_rua_janelas.in' => 'Opção inválida para janelas.',

            'acesso_rua_portoes_muros.required' => 'Informe sobre portões e muros.',
            'acesso_rua_portoes_muros.in' => 'Opção inválida para portões e muros.',

            'renda_familiar.required' => 'Informe a renda familiar.',
            'renda_familiar.in' => 'Opção inválida para renda familiar.',

            'aceita_termos.required' => 'Você precisa aceitar os termos.',
            'aceita_termos.accepted' => 'Você precisa aceitar os termos para prosseguir.',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            // Unicidade: um mesmo usuário não pode solicitar o mesmo animal mais de uma vez
            $existe = Adocao::where('usuario_id', $request->usuario_id)
                ->where('animal_id', $request->animal_id)
                ->exists();

            if ($existe) {
                return response()->json([
                    'error' => 'Já existe uma solicitação de adoção para este animal por este usuário.'
                ], 422);
            }

            return DB::transaction(function () use ($request) {
                $adocao = Adocao::create([
                    'usuario_id' => $request->usuario_id,
                    'animal_id' => $request->animal_id,
                    'status' => 'em_aprovacao',
                    'qtd_pessoas_casa' => $request->qtd_pessoas_casa,
                    'possui_filhos' => $request->possui_filhos,
                    'sobre_rotina' => $request->sobre_rotina,
                    'acesso_rua_janelas' => $request->acesso_rua_janelas,
                    'acesso_rua_portoes_muros' => $request->acesso_rua_portoes_muros,
                    'renda_familiar' => $request->renda_familiar,
                    'aceita_termos' => $request->aceita_termos,
                ]);

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

    /**
     * Exibir uma adoção específica
     */
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

    /**
     * Atualizar uma adoção
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $adocao = Adocao::find($id);

            if (!$adocao) {
                return response()->json(['error' => 'Adoção não encontrada'], 404);
            }

            $validator = Validator::make($request->all(), [
                'usuario_id' => 'sometimes|required|exists:usuarios,id',
                'animal_id' => 'sometimes|required|exists:animais,id',

                'qtd_pessoas_casa' => ['sometimes', 'required', Rule::in([
                    'sozinho', 'uma_pessoa', 'duas_pessoas', 'tres_pessoas', 'quatro_ou_mais'
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
            ], [
                'usuario_id.required' => 'O usuário é obrigatório.',
                'usuario_id.exists' => 'Usuário não encontrado.',
                'animal_id.required' => 'O animal é obrigatório.',
                'animal_id.exists' => 'Animal não encontrado.',

                'qtd_pessoas_casa.required' => 'Informe com quantas pessoas você mora.',
                'qtd_pessoas_casa.in' => 'Opção inválida para quantidade de pessoas.',

                'possui_filhos.required' => 'Informe se possui filhos.',
                'possui_filhos.boolean' => 'Valor inválido para possui filhos.',

                'sobre_rotina.required' => 'Selecione ao menos uma opção sobre sua rotina.',
                'sobre_rotina.array' => 'Rotina deve ser um array.',
                'sobre_rotina.min' => 'Selecione ao menos uma opção sobre sua rotina.',
                'sobre_rotina.*.in' => 'Uma ou mais opções de rotina são inválidas.',

                'acesso_rua_janelas.required' => 'Informe sobre o acesso à rua pelas janelas.',
                'acesso_rua_janelas.in' => 'Opção inválida para janelas.',

                'acesso_rua_portoes_muros.required' => 'Informe sobre portões e muros.',
                'acesso_rua_portoes_muros.in' => 'Opção inválida para portões e muros.',

                'renda_familiar.required' => 'Informe a renda familiar.',
                'renda_familiar.in' => 'Opção inválida para renda familiar.',

                'aceita_termos.required' => 'Você precisa aceitar os termos.',
                'aceita_termos.accepted' => 'Você precisa aceitar os termos para prosseguir.',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            return DB::transaction(function () use ($request, $adocao) {
                $data = $request->only([
                    'usuario_id',
                    'animal_id',
                    'qtd_pessoas_casa',
                    'possui_filhos',
                    'sobre_rotina',
                    'acesso_rua_janelas',
                    'acesso_rua_portoes_muros',
                    'renda_familiar',
                    'aceita_termos',
                ]);

                // Se usuário_id e animal_id forem alterados, reforça a unicidade
                if (isset($data['usuario_id']) || isset($data['animal_id'])) {
                    $usuarioId = $data['usuario_id'] ?? $adocao->usuario_id;
                    $animalId = $data['animal_id'] ?? $adocao->animal_id;

                    $existe = Adocao::where('usuario_id', $usuarioId)
                        ->where('animal_id', $animalId)
                        ->where('id', '!=', $adocao->id)
                        ->exists();

                    if ($existe) {
                        return response()->json([
                            'error' => 'Já existe uma solicitação de adoção para este animal por este usuário.'
                        ], 422);
                    }
                }

                $adocao->update($data);

                return response()->json($adocao->fresh(['usuario', 'animal.imagens']), 200);
            });
        } catch (\Exception $e) {
            Log::error('Erro ao atualizar adoção: ' . $e->getMessage(), [
                'id' => $id,
                'exception' => $e,
                'payload' => $request->except(['aceita_termos'])
            ]);
            return response()->json([
                'error' => 'Não foi possível atualizar a adoção',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Deletar uma adoção (soft delete)
     */
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

    /**
     * Restaurar uma adoção deletada (rotas protegidas por middleware role:admin)
     */
    public function restore($id): JsonResponse
    {
        try {
            $adocao = Adocao::withTrashed()->find($id);

            if (!$adocao) {
                return response()->json(['error' => 'Adoção não encontrada'], 404);
            }

            if (!$adocao->trashed()) {
                return response()->json(['error' => 'Adoção já está ativa'], 400);
            }

            $adocao->restore();

            return response()->json($adocao->load(['usuario', 'animal.imagens']), 200);
        } catch (\Exception $e) {
            Log::error('Erro ao restaurar adoção: ' . $e->getMessage(), ['id' => $id, 'exception' => $e]);
            return response()->json(['error' => 'Não foi possível restaurar a adoção'], 500);
        }
    }

    /**
     * Aprovar adoção (rotas protegidas por middleware role:admin)
     */
    public function approve($id): JsonResponse
    {
        try {
            $adocao = Adocao::find($id);

            if (!$adocao) {
                return response()->json(['error' => 'Adoção não encontrada'], 404);
            }

            if ($adocao->status === 'aprovado') {
                return response()->json(['error' => 'Adoção já está aprovada.'], 422);
            }

            return DB::transaction(function () use ($adocao) {
                $adocao->status = 'aprovado';
                $adocao->save();

                return response()->json($adocao->fresh(['usuario', 'animal.imagens']), 200);
            });
        } catch (\Exception $e) {
            Log::error('Erro ao aprovar adoção: ' . $e->getMessage(), ['id' => $id, 'exception' => $e]);
            return response()->json([
                'error' => 'Não foi possível aprovar a adoção',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}