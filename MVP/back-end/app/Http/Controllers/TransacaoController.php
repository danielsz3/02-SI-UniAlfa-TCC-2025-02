<?php

namespace App\Http\Controllers;

use App\Models\Transacao;
use App\Traits\SearchIndex;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class TransacaoController extends Controller
{
    use SearchIndex;

    public function index(Request $request): JsonResponse
    {
        return $this->SearchIndex(
            $request,
            Transacao::query(),
            'transacoes',
            ['descricao', 'categoria']
        );
    }

    /**
     * Normaliza os campos vindos do front
     * - data: aceita DD/MM/YYYY HH:mm, DD/MM/YYYY HH:mm:ss, ISO e converte para Y-m-d H:i:s
     * - valor: troca vírgula por ponto e converte para float
     * - tipo: já está vindo como 'receita' | 'despesa' no front, mas mapeamos por segurança
     */
    private function normalizePayload(array $input): array
    {
        $data = $input;

        // tipo
        if (!empty($data['tipo'])) {
            if ($data['tipo'] === 'entrada') $data['tipo'] = 'receita';
            if ($data['tipo'] === 'saida')   $data['tipo'] = 'despesa';
        }

        // valor
        if (isset($data['valor'])) {
            if (is_string($data['valor'])) {
                $data['valor'] = str_replace(',', '.', $data['valor']);
            }
            $data['valor'] = (float) $data['valor'];
        }

        // data
        if (!empty($data['data'])) {
            $formats = [
                'd/m/Y H:i',
                'd/m/Y H:i:s',
                'Y-m-d\TH:i',
                'Y-m-d\TH:i:s',
                'Y-m-d H:i',
                'Y-m-d H:i:s',
            ];

            $parsed = null;
            foreach ($formats as $fmt) {
                try {
                    $dt = Carbon::createFromFormat($fmt, $data['data']);
                    if ($dt !== false) {
                        $parsed = $dt;
                        break;
                    }
                } catch (\Throwable $e) {
                    // tenta próximo formato
                }
            }

            if (!$parsed) {
                // última tentativa: parse livre do Carbon
                try {
                    $tmp = Carbon::parse($data['data']);
                    if ($tmp) $parsed = $tmp;
                } catch (\Throwable $e) {
                }
            }

            if ($parsed) {
                $data['data'] = $parsed->format('Y-m-d H:i:s');
            }
        }

        return $data;
    }

    public function store(Request $request): JsonResponse
    {
        $input = $this->normalizePayload($request->all());

        $validator = Validator::make($input, [
            'tipo'            => 'required|in:receita,despesa',
            'valor'           => 'required|numeric|min:0.01',
            'data'            => 'required|date|after:2000-01-01|before_or_equal:today',
            'categoria'       => 'required|string|min:2|max:100',
            'descricao'       => 'required|string|min:3|max:255',
            'forma_pagamento' => 'required|string|max:255',
            'situacao'        => 'required|in:pendente,concluido,cancelado',
            'observacao'      => 'nullable|string|max:1000',
        ], [
            // Tipo
            'tipo.required' => 'O tipo da transação é obrigatório.',
            'tipo.in' => 'O tipo deve ser "receita" ou "despesa".',

            // Valor
            'valor.required' => 'O valor da transação é obrigatório.',
            'valor.numeric' => 'O valor deve ser um número válido.',
            'valor.min' => 'O valor deve ser maior que zero.',

            // Data
            'data.required' => 'A data da transação é obrigatória.',
            'data.date' => 'A data informada não é válida.',
            'data.after' => 'A data deve ser posterior a 01/01/2000.',
            'data.before_or_equal' => 'A data não pode ser futura.',

            // Categoria
            'categoria.required' => 'A categoria é obrigatória.',
            'categoria.string' => 'A categoria deve ser um texto válido.',
            'categoria.min' => 'A categoria deve ter no mínimo 2 caracteres.',
            'categoria.max' => 'A categoria deve ter no máximo 100 caracteres.',

            // Descrição
            'descricao.required' => 'A descrição é obrigatória.',
            'descricao.string' => 'A descrição deve ser um texto válido.',
            'descricao.min' => 'A descrição deve ter no mínimo 3 caracteres.',
            'descricao.max' => 'A descrição deve ter no máximo 255 caracteres.',

            // Forma de Pagamento
            'forma_pagamento.required' => 'A forma de pagamento é obrigatória.',
            'forma_pagamento.string' => 'A forma de pagamento deve ser um texto válido.',
            'forma_pagamento.max' => 'A forma de pagamento deve ter no máximo 255 caracteres.',

            // Situação
            'situacao.required' => 'A situação da transação é obrigatória.',
            'situacao.in' => 'A situação deve ser "pendente", "concluido" ou "cancelado".',

            // Observação
            'observacao.string' => 'A observação deve ser um texto válido.',
            'observacao.max' => 'A observação deve ter no máximo 1000 caracteres.',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $payload = collect($input)->only([
                'tipo',
                'valor',
                'data',
                'categoria',
                'descricao',
                'forma_pagamento',
                'situacao',
                'observacao'
            ])->toArray();

            $transacao = Transacao::create($payload);

            return response()->json($transacao, 201);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Não foi possível criar a transação',
                'message' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function show($id): JsonResponse
    {
        $transacao = Transacao::find($id);
        if (!$transacao) {
            return response()->json(['error' => 'Transação não encontrada'], 404);
        }
        return response()->json($transacao, 200);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $transacao = Transacao::find($id);
        if (!$transacao) {
            return response()->json(['error' => 'Transação não encontrada'], 404);
        }

        $input = $this->normalizePayload($request->all());

        $validator = Validator::make($input, [
            'tipo'            => 'sometimes|required|in:receita,despesa',
            'valor'           => 'sometimes|required|numeric|min:0.01',
            'data'            => 'sometimes|required|date|after:2000-01-01|before_or_equal:today',
            'categoria'       => 'sometimes|required|string|min:2|max:100',
            'descricao'       => 'sometimes|required|string|min:3|max:255',
            'forma_pagamento' => 'sometimes|required|string|max:255',
            'situacao'        => 'sometimes|required|in:pendente,concluido,cancelado',
            'observacao'      => 'nullable|string|max:1000',
        ], [
            // Tipo
            'tipo.required' => 'O tipo da transação é obrigatório.',
            'tipo.in' => 'O tipo deve ser "receita" ou "despesa".',

            // Valor
            'valor.required' => 'O valor da transação é obrigatório.',
            'valor.numeric' => 'O valor deve ser um número válido.',
            'valor.min' => 'O valor deve ser maior que zero.',

            // Data
            'data.required' => 'A data da transação é obrigatória.',
            'data.date' => 'A data informada não é válida.',
            'data.after' => 'A data deve ser posterior a 01/01/2000.',
            'data.before_or_equal' => 'A data não pode ser futura.',

            // Categoria
            'categoria.required' => 'A categoria é obrigatória.',
            'categoria.string' => 'A categoria deve ser um texto válido.',
            'categoria.min' => 'A categoria deve ter no mínimo 2 caracteres.',
            'categoria.max' => 'A categoria deve ter no máximo 100 caracteres.',

            // Descrição
            'descricao.required' => 'A descrição é obrigatória.',
            'descricao.string' => 'A descrição deve ser um texto válido.',
            'descricao.min' => 'A descrição deve ter no mínimo 3 caracteres.',
            'descricao.max' => 'A descrição deve ter no máximo 255 caracteres.',

            // Forma de Pagamento
            'forma_pagamento.required' => 'A forma de pagamento é obrigatória.',
            'forma_pagamento.string' => 'A forma de pagamento deve ser um texto válido.',
            'forma_pagamento.max' => 'A forma de pagamento deve ter no máximo 255 caracteres.',

            // Situação
            'situacao.required' => 'A situação da transação é obrigatória.',
            'situacao.in' => 'A situação deve ser "pendente", "concluido" ou "cancelado".',

            // Observação
            'observacao.string' => 'A observação deve ser um texto válido.',
            'observacao.max' => 'A observação deve ter no máximo 1000 caracteres.',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $transacao->update(collect($input)->only([
                'tipo',
                'valor',
                'data',
                'categoria',
                'descricao',
                'forma_pagamento',
                'situacao',
                'observacao'
            ])->toArray());

            return response()->json($transacao->fresh(), 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Não foi possível atualizar a transação',
                'message' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function destroy($id): JsonResponse
    {
        $transacao = Transacao::find($id);
        if (!$transacao) {
            return response()->json(['error' => 'Transação não encontrada'], 404);
        }

        $transacao->delete();
        return response()->json(null, 204);
    }

}
