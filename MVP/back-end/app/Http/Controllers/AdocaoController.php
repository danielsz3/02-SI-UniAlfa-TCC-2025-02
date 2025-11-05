<?php

namespace App\Http\Controllers;

use App\Models\Adocao;
use App\Models\Animal;
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

    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
    }

    try {
        // Carregar o animal com o relacionamento 'usuario'
        $animal = Animal::with('usuario')->find($request->animal_id);

        if (!$animal) {
            return response()->json(['error' => 'Animal não encontrado.'], 404);
        }

        // Verificação: bloquear o anunciante/dono de adotar o próprio animal
        if ($animal->usuario && $animal->usuario->id == $user->id) {
            return response()->json([
                'error' => 'Não é permitido adotar um animal que você mesmo anunciou.'
            ], 422);
        }

        $existe = Adocao::where('usuario_id', $user->id)
            ->where('animal_id', $request->animal_id)
            ->exists();

        if ($existe) {
            return response()->json([
                'error' => 'Já existe uma solicitação de adoção para este animal por este usuário.'
            ], 422);
        }

        return DB::transaction(function () use ($request, $user, $animal) {
            // Garantir que sobre_rotina seja array
            $sobreRotina = $request->input('sobre_rotina', []);
            if (is_string($sobreRotina)) {
                $decoded = json_decode($sobreRotina, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $sobreRotina = $decoded;
                } else {
                    // caso venha como "a,b,c" -> transforma em array
                    $sobreRotina = array_values(array_filter(array_map('trim', explode(',', $sobreRotina))));
                }
            }
            if (!is_array($sobreRotina)) {
                $sobreRotina = (array) $sobreRotina;
            }

            $adocao = Adocao::create([
                'usuario_id' => $user->id,
                'animal_id' => $request->animal_id,
                'status' => 'em_aprovacao',
                'qtd_pessoas_casa' => $request->qtd_pessoas_casa,
                'possui_filhos' => $request->possui_filhos,
                'sobre_rotina' => $sobreRotina,
                'acesso_rua_janelas' => $request->acesso_rua_janelas,
                'acesso_rua_portoes_muros' => $request->acesso_rua_portoes_muros,
                'renda_familiar' => $request->renda_familiar,
                'aceita_termos' => $request->aceita_termos,
            ]);

            if ($animal && $animal->situacao === 'disponivel') {
                $animal->situacao = 'em_adocao';
                $animal->save();
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
                $existeAprovada = Adocao::where('animal_id', $adocao->animal_id)
                    ->where('status', 'aprovado')
                    ->where('id', '!=', $adocao->id)
                    ->exists();

                if ($existeAprovada) {
                    return response()->json([
                        'error' => 'Já existe outra adoção aprovada para este animal.'
                    ], 422);
                }

                $adocao->status = 'aprovado';
                $adocao->save();

                Adocao::where('animal_id', $adocao->animal_id)
                    ->where('id', '!=', $adocao->id)
                    ->where('status', '!=', 'negado')
                    ->update(['status' => 'negado']);

                $animal = $adocao->animal;
                if ($animal) {
                    $animal->situacao = 'adotado';
                    $animal->save();
                }

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

    /**
     * Negar uma adoção — marca como 'negado' e, se não houver outra aprovada,
     * libera o animal (situacao = 'disponivel').
     */
    public function deny($id): JsonResponse
    {
        try {
            $adocao = Adocao::find($id);

            if (!$adocao) {
                return response()->json(['error' => 'Adoção não encontrada'], 404);
            }

            if ($adocao->status === 'negado') {
                return response()->json(['error' => 'Adoção já está negada.'], 422);
            }

            return DB::transaction(function () use ($adocao) {
                // marcar como negado
                $adocao->status = 'negado';
                $adocao->save();

                // se não existir outra adoção aprovada para o mesmo animal, liberar o animal
                $existeAprovada = Adocao::where('animal_id', $adocao->animal_id)
                    ->where('status', 'aprovado')
                    ->exists();

                if (!$existeAprovada) {
                    $animal = $adocao->animal;
                    if ($animal) {
                        $animal->situacao = 'disponivel';
                        $animal->save();
                    }
                }

                return response()->json($adocao->fresh(['usuario', 'animal.imagens']), 200);
            });
        } catch (\Exception $e) {
            Log::error('Erro ao negar adoção: ' . $e->getMessage(), ['id' => $id, 'exception' => $e]);
            return response()->json([
                'error' => 'Não foi possível negar a adoção',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}