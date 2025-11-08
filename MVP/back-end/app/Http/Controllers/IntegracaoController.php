<?php

namespace App\Http\Controllers;

use App\Models\Integracao;
use App\Traits\SearchIndex;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class IntegracaoController extends Controller
{
    use SearchIndex;

    public function index(Request $request): JsonResponse
    {
        return $this->SearchIndex(
            $request,
            Integracao::query(),
            'integracoes',
            ['service']
        );
    }

    public function show(string $id)
    {
        $integracao = Integracao::find($id);

        if (!$integracao) {
            return response()->json(['error' => 'Serviço não encontrado'], 404);
        }

        return response()->json($integracao);
    }

    public function update(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'service'      => 'required|string|max:255',
            'username'     => 'required|string|max:255',
            'access_token' => 'required|string',
            'user_id'      => 'required|string|max:255',
            'status'       => 'required|in:ativo,inativo',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $integracao = Integracao::find($id);

            if (! $integracao) {
                return response()->json(['error' => 'Serviço não encontrado'], 404);
            }

            $data = $request->only([
                'service', 'username', 'access_token', 'user_id', 'status'
            ]);

            $integracao->update($data);

            return response()->json($integracao, 200);
        } catch (\Exception $e) {
            Log::error('Erro ao atualizar integração: '.$e->getMessage(), [
                'id' => $id,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json(['error' => 'Não foi possível editar a integração'], 500);
        }
    }
}