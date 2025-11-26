<?php

namespace App\Http\Controllers;

use App\Models\Endereco;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class EnderecoController extends Controller
{
    /**
     * Lista todos os endereços (suporta paginação via _page e _limit)
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = (int) $request->input('_limit', 25);
            $page    = (int) $request->input('_page', 1);

            $query = Endereco::with('usuario')->orderBy('id', 'desc');

            $paginated = $query->paginate($perPage, ['*'], 'page', $page);

            return response()->json($paginated->items(), 200)
                ->header('X-Total-Count', $paginated->total())
                ->header('Access-Control-Expose-Headers', 'X-Total-Count');
        } catch (\Exception $e) {
            Log::error('Erro ao listar endereços: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['error' => 'Não foi possível carregar os endereços'], 500);
        }
    }

    /**
     * Cadastra um novo endereço
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'cep'         => 'required|string|max:9',
            'logradouro'  => 'required|string|max:255',
            'numero'      => 'nullable|string|max:10',
            'complemento' => 'nullable|string|max:100',
            'bairro'      => 'required|string|max:100',
            'cidade'      => 'required|string|max:100',
            'uf'          => 'required|string|size:2',
            'id_usuario'  => 'required|exists:usuarios,id_usuario',
        ], [
            'cep.required' => 'O CEP é obrigatório.',
            'cep.max' => 'O CEP deve ter no máximo 9 caracteres.',

            'logradouro.required' => 'O logradouro é obrigatório.',
            'logradouro.max' => 'O logradouro deve ter no máximo 255 caracteres.',

            'numero.max' => 'O número deve ter no máximo 10 caracteres.',
            'complemento.max' => 'O complemento deve ter no máximo 100 caracteres.',

            'bairro.required' => 'O bairro é obrigatório.',
            'bairro.max' => 'O bairro deve ter no máximo 100 caracteres.',

            'cidade.required' => 'A cidade é obrigatória.',
            'cidade.max' => 'A cidade deve ter no máximo 100 caracteres.',

            'uf.required' => 'A UF é obrigatória.',
            'uf.size' => 'A UF deve conter exatamente 2 caracteres.',

            'id_usuario.required' => 'O usuário relacionado é obrigatório.',
            'id_usuario.exists' => 'O usuário informado não existe.',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            return DB::transaction(function () use ($validator) {
                $endereco = Endereco::create($validator->validated());
                return response()->json($endereco, 201);
            });
        } catch (\Exception $e) {
            Log::error('Erro ao criar endereço: ' . $e->getMessage(), [
                'payload' => $request->all(),
                'exception' => $e
            ]);
            return response()->json(['error' => 'Não foi possível criar o endereço'], 500);
        }
    }

    /**
     * Exibe um endereço específico
     */
    public function show($id): JsonResponse
    {
        try {
            $endereco = Endereco::with('usuario')->find($id);

            if (!$endereco) {
                return response()->json(['error' => 'Endereço não encontrado'], 404);
            }

            return response()->json($endereco, 200);
        } catch (\Exception $e) {
            Log::error('Erro ao exibir endereço: ' . $e->getMessage(), ['id' => $id, 'exception' => $e]);
            return response()->json(['error' => 'Não foi possível carregar o endereço'], 500);
        }
    }

    /**
     * Atualiza um endereço
     */
    public function update(Request $request, $id): JsonResponse
    {
        $endereco = Endereco::find($id);

        if (!$endereco) {
            return response()->json(['error' => 'Endereço não encontrado'], 404);
        }

        $validator = Validator::make($request->all(), [
            'cep'         => 'sometimes|required|string|max:9',
            'logradouro'  => 'sometimes|required|string|max:255',
            'numero'      => 'nullable|string|max:10',
            'complemento' => 'nullable|string|max:100',
            'bairro'      => 'sometimes|required|string|max:100',
            'cidade'      => 'sometimes|required|string|max:100',
            'uf'          => 'sometimes|required|string|size:2',
            'id_usuario'  => 'sometimes|required|exists:usuarios,id_usuario',
        ], [
            'cep.required' => 'O CEP é obrigatório.',
            'cep.max' => 'O CEP deve ter no máximo 9 caracteres.',

            'logradouro.required' => 'O logradouro é obrigatório.',
            'logradouro.max' => 'O logradouro deve ter no máximo 255 caracteres.',

            'numero.max' => 'O número deve ter no máximo 10 caracteres.',
            'complemento.max' => 'O complemento deve ter no máximo 100 caracteres.',

            'bairro.required' => 'O bairro é obrigatório.',
            'bairro.max' => 'O bairro deve ter no máximo 100 caracteres.',

            'cidade.required' => 'A cidade é obrigatória.',
            'cidade.max' => 'A cidade deve ter no máximo 100 caracteres.',

            'uf.size' => 'A UF deve conter exatamente 2 caracteres.',

            'id_usuario.exists' => 'O usuário informado não existe.',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            return DB::transaction(function () use ($endereco, $validator) {
                $endereco->update($validator->validated());
                return response()->json($endereco->fresh(), 200);
            });
        } catch (\Exception $e) {
            Log::error('Erro ao atualizar endereço: ' . $e->getMessage(), [
                'id' => $id,
                'payload' => $request->all(),
                'exception' => $e
            ]);
            return response()->json(['error' => 'Não foi possível atualizar o endereço'], 500);
        }
    }

    /**
     * Remove um endereço (soft delete)
     */
    public function destroy($id): JsonResponse
    {
        $endereco = Endereco::find($id);

        if (!$endereco) {
            return response()->json(['error' => 'Endereço não encontrado'], 404);
        }

        try {
            $endereco->delete();
            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error('Erro ao deletar endereço: ' . $e->getMessage(), ['id' => $id, 'exception' => $e]);
            return response()->json(['error' => 'Não foi possível deletar o endereço'], 500);
        }
    }

    /**
     * Restaura um endereço soft deleted
     */
    public function restore($id): JsonResponse
    {
        try {
            $endereco = Endereco::withTrashed()->find($id);

            if (!$endereco) {
                return response()->json(['error' => 'Endereço não encontrado'], 404);
            }

            if (!$endereco->trashed()) {
                return response()->json(['error' => 'Este endereço já está ativo'], 400);
            }

            $endereco->restore();

            return response()->json($endereco->fresh(), 200);
        } catch (\Exception $e) {
            Log::error('Erro ao restaurar endereço: ' . $e->getMessage(), ['id' => $id, 'exception' => $e]);
            return response()->json(['error' => 'Não foi possível restaurar o endereço'], 500);
        }
    }
}