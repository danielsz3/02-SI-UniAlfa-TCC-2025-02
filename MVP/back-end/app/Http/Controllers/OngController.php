<?php

namespace App\Http\Controllers;

use App\Models\Ong;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class OngController extends Controller
{
    /**
     * Lista de ONGs com paginação e filtros
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = $request->input('_limit', 10);
            $page    = $request->input('_page', 1);
            $sort    = $request->input('_sort', 'id_ong');
            $order   = $request->input('_order', 'asc');
            $filter  = json_decode($request->input('filter', '{}'), true);

            $query = Ong::query();

            if (!empty($filter)) {
                foreach ($filter as $field => $value) {
                    if ($value === null || $value === '') continue;

                    if (in_array($field, ['nome_ong', 'descricao', 'cnpj', 'telefone'])) {
                        $query->where($field, 'like', "%{$value}%");
                    } else {
                        $query->where($field, $value);
                    }
                }
            }

            $query->orderBy($sort, $order);

            $ongs = $query->paginate($perPage, ['*'], 'page', $page);

            return response()->json($ongs->items())
                ->header('X-Total-Count', $ongs->total())
                ->header('Access-Control-Expose-Headers', 'X-Total-Count');
        } catch (\Exception $e) {
            return response()->json(['error' => 'Não foi possível carregar as ONGs'], 500);
        }
    }

    /**
     * Listar ONGs incluindo deletadas
     */
    public function indexWithTrashed(): JsonResponse
    {
        $ongs = Ong::withTrashed()->get();

        return response()->json([
            'data'  => $ongs,
            'total' => $ongs->count()
        ], 200);
    }

    /**
     * Criar ONG com relacionamentos
     */
    public function store(Request $request): JsonResponse
    {
        // Decodifica JSON enviado como string para arrays
        if ($request->has('enderecos_ids') && is_string($request->input('enderecos_ids'))) {
            $request->merge(['enderecos_ids' => json_decode($request->input('enderecos_ids'), true)]);
        }

        if ($request->has('contatos') && is_string($request->input('contatos'))) {
            $request->merge(['contatos' => json_decode($request->input('contatos'), true)]);
        }

        $validator = Validator::make($request->all(), [
            'nome_ong'      => 'required|string|min:3|max:255',
            'cnpj'          => 'required|string|size:14|regex:/^[0-9]+$/|unique:ongs,cnpj',
            'descricao'     => 'nullable|string|max:1000',
            'imagem'      => 'nullable|url',
            'url_banner'    => 'nullable|url',
            'telefone'      => 'nullable|string|size:11|regex:/^[0-9]+$/',
            'pix'           => 'nullable|string|max:255',
            'banco'         => 'nullable|string|max:100',
            'agencia'       => 'nullable|string|max:10',
            'numero_conta'  => 'nullable|string|max:20',
            'conta'         => 'nullable|string|max:20',

            // Relacionamentos
            'enderecos_ids' => 'nullable|array',
            'enderecos_ids.*' => 'exists:enderecos,id',

            'contatos' => 'nullable|array',
            'contatos.*.tipo' => 'nullable|in:telefone,email,whatsapp,instagram,facebook,site,outro',
            'contatos.*.contato' => 'nullable|string|max:255',
            'contatos.*.link' => 'nullable|url|max:255',
            'contatos.*.descricao' => 'nullable|string|max:1000',

            'imagens' => 'nullable|array',
            'imagens.*' => 'image|mimes:jpeg,png,jpg,gif|max:10240',
        ], [
            // Mensagens personalizadas para validações
            'nome_ong.required' => 'O nome da ONG é obrigatório.',
            'nome_ong.min' => 'O nome da ONG deve ter no mínimo 3 caracteres.',
            'nome_ong.max' => 'O nome da ONG deve ter no máximo 255 caracteres.',

            'cnpj.required' => 'O CNPJ é obrigatório.',
            'cnpj.size' => 'O CNPJ deve ter exatamente 14 números.',
            'cnpj.regex' => 'O CNPJ deve conter apenas números.',
            'cnpj.unique' => 'Este CNPJ já está em uso.',

            'descricao.max' => 'A descrição deve ter no máximo 1000 caracteres.',

            'imagem.url' => 'A URL do logo deve ser válida.',
            'url_banner.url' => 'A URL do banner deve ser válida.',

            'telefone.size' => 'O telefone deve ter exatamente 11 números.',
            'telefone.regex' => 'O telefone deve conter apenas números.',

            'pix.max' => 'O PIX deve ter no máximo 255 caracteres.',
            'banco.max' => 'O banco deve ter no máximo 100 caracteres.',
            'agencia.max' => 'A agência deve ter no máximo 10 caracteres.',
            'numero_conta.max' => 'O número da conta deve ter no máximo 20 caracteres.',
            'conta.max' => 'A conta deve ter no máximo 20 caracteres.',

            'enderecos_ids.*.exists' => 'Um ou mais endereços selecionados não existem.',

            'contatos.*.tipo.in' => 'O tipo de contato deve ser telefone, email, whatsapp, instagram, facebook, site ou outro.',
            'contatos.*.contato.max' => 'O contato deve ter no máximo 255 caracteres.',
            'contatos.*.link.url' => 'O link do contato deve ser uma URL válida.',
            'contatos.*.link.max' => 'O link do contato deve ter no máximo 255 caracteres.',
            'contatos.*.descricao.max' => 'A descrição do contato deve ter no máximo 1000 caracteres.',

            'imagens.*.image' => 'Cada imagem deve ser um arquivo de imagem.',
            'imagens.*.mimes' => 'As imagens devem ser do tipo jpeg, png, jpg ou gif.',
            'imagens.*.max' => 'Cada imagem deve ter no máximo 10MB.',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            return DB::transaction(function () use ($request) {
                $ong = Ong::create($request->only([
                    'nome_ong', 'cnpj', 'descricao', 'imagem',
                    'url_banner', 'telefone', 'pix', 'banco', 'agencia', 'numero_conta', 'conta'
                ]));

                // Associar endereços via pivot
                if ($request->filled('enderecos_ids')) {
                    $ong->enderecos()->sync($request->input('enderecos_ids'));
                }

                // Criar contatos
                if ($request->filled('contatos')) {
                    foreach ($request->input('contatos') as $contato) {
                        $ong->contatos()->create($contato);
                    }
                }

                // Upload e salvar imagens
                if ($request->hasFile('imagens')) {
                    foreach ($request->file('imagens') as $file) {
                        $path = $file->store('ongs', 'public');
                        [$width, $height] = getimagesize($file->getRealPath()) ?: [null, null];
                        $ong->imagens()->create([
                            'caminho' => $path,
                            'width' => $width,
                            'height' => $height,
                        ]);
                    }
                }

                return response()->json($ong->load(['enderecos', 'contatos', 'imagens']), 201);
            });
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Erro ao criar ONG',
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    /**
     * Exibir ONG com relacionamentos
     */
    public function show($id): JsonResponse
    {
        $ong = Ong::with(['enderecos', 'contatos', 'imagens'])->find($id);

        if (!$ong) {
            return response()->json(['error' => 'ONG não encontrada'], 404);
        }

        return response()->json($ong, 200);
    }

    /**
     * Atualizar ONG com relacionamentos
     */
    public function update(Request $request, $id): JsonResponse
    {
        $ong = Ong::find($id);

        if (!$ong) {
            return response()->json(['error' => 'ONG não encontrada'], 404);
        }

        // Decodifica JSON enviado como string para arrays
        if ($request->has('enderecos_ids') && is_string($request->input('enderecos_ids'))) {
            $request->merge(['enderecos_ids' => json_decode($request->input('enderecos_ids'), true)]);
        }

        if ($request->has('contatos') && is_string($request->input('contatos'))) {
            $request->merge(['contatos' => json_decode($request->input('contatos'), true)]);
        }

        $validator = Validator::make($request->all(), [
            'nome_ong'   => 'sometimes|required|string|min:3|max:255',
            'cnpj'       => [
                'sometimes',
                'required',
                'string',
                'size:14',
                'regex:/^[0-9]+$/',
                Rule::unique('ongs')->ignore($ong->id_ong, 'id_ong')
            ],
            'descricao'  => 'nullable|string|max:1000',
            'imagem'   => 'nullable|url',
            'url_banner' => 'nullable|url',
            'telefone'   => 'nullable|string|size:11|regex:/^[0-9]+$/',
            'pix'        => 'nullable|string|max:255',
            'banco'      => 'nullable|string|max:100',
            'agencia'    => 'nullable|string|max:10',
            'numero_conta' => 'nullable|string|max:20',
            'conta'      => 'nullable|string|max:20',

            // Relacionamentos
            'enderecos_ids' => 'nullable|array',
            'enderecos_ids.*' => 'exists:enderecos,id',

            'contatos' => 'nullable|array',
            'contatos.*.tipo' => 'nullable|in:telefone,email,whatsapp,instagram,facebook,site,outro',
            'contatos.*.contato' => 'nullable|string|max:255',
            'contatos.*.link' => 'nullable|url|max:255',
            'contatos.*.descricao' => 'nullable|string|max:1000',

            'imagens' => 'nullable|array',
            'imagens.*' => 'image|mimes:jpeg,png,jpg,gif|max:10240',
        ], [
            // Mensagens personalizadas para validações
            'nome_ong.required' => 'O nome da ONG é obrigatório.',
            'nome_ong.min' => 'O nome da ONG deve ter no mínimo 3 caracteres.',
            'nome_ong.max' => 'O nome da ONG deve ter no máximo 255 caracteres.',

            'cnpj.required' => 'O CNPJ é obrigatório.',
            'cnpj.size' => 'O CNPJ deve ter exatamente 14 números.',
            'cnpj.regex' => 'O CNPJ deve conter apenas números.',
            'cnpj.unique' => 'Este CNPJ já está em uso.',

            'descricao.max' => 'A descrição deve ter no máximo 1000 caracteres.',

            'imagem.url' => 'A URL do logo deve ser válida.',
            'url_banner.url' => 'A URL do banner deve ser válida.',

            'telefone.size' => 'O telefone deve ter exatamente 11 números.',
            'telefone.regex' => 'O telefone deve conter apenas números.',

            'pix.max' => 'O PIX deve ter no máximo 255 caracteres.',
            'banco.max' => 'O banco deve ter no máximo 100 caracteres.',
            'agencia.max' => 'A agência deve ter no máximo 10 caracteres.',
            'numero_conta.max' => 'O número da conta deve ter no máximo 20 caracteres.',
            'conta.max' => 'A conta deve ter no máximo 20 caracteres.',

            'enderecos_ids.*.exists' => 'Um ou mais endereços selecionados não existem.',

            'contatos.*.tipo.in' => 'O tipo de contato deve ser telefone, email, whatsapp, instagram, facebook, site ou outro.',
            'contatos.*.contato.max' => 'O contato deve ter no máximo 255 caracteres.',
            'contatos.*.link.url' => 'O link do contato deve ser uma URL válida.',
            'contatos.*.link.max' => 'O link do contato deve ter no máximo 255 caracteres.',
            'contatos.*.descricao.max' => 'A descrição do contato deve ter no máximo 1000 caracteres.',

            'imagens.*.image' => 'Cada imagem deve ser um arquivo de imagem.',
            'imagens.*.mimes' => 'As imagens devem ser do tipo jpeg, png, jpg ou gif.',
            'imagens.*.max' => 'Cada imagem deve ter no máximo 10MB.',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            return DB::transaction(function () use ($request, $ong) {
                $ong->update($request->only([
                    'nome_ong', 'cnpj', 'descricao', 'imagem',
                    'url_banner', 'telefone', 'pix', 'banco', 'agencia', 'numero_conta', 'conta'
                ]));

                // Atualizar endereços via pivot
                if ($request->filled('enderecos_ids')) {
                    $ong->enderecos()->sync($request->input('enderecos_ids'));
                }

                // Atualizar contatos: apagar todos e recriar (simplificado)
                $ong->contatos()->delete();
                if ($request->filled('contatos')) {
                    foreach ($request->input('contatos') as $contato) {
                        $ong->contatos()->create($contato);
                    }
                }

                // Substitui todas as imagens se enviadas
                if ($request->hasFile('imagens')) {
                    // Apagar arquivos antigos do storage
                    foreach ($ong->imagens as $imagem) {
                        $oldPath = str_replace('/storage/', '', $imagem->caminho);
                        Storage::disk('public')->delete($oldPath);
                    }
                    // Apagar registros antigos
                    $ong->imagens()->delete();

                    // Salvar novas imagens
                    foreach ($request->file('imagens') as $file) {
                        $path = $file->store('ongs', 'public');
                        [$width, $height] = getimagesize($file->getRealPath()) ?: [null, null];
                        $ong->imagens()->create([
                            'caminho' => $path,
                            'width' => $width,
                            'height' => $height,
                        ]);
                    }
                }

                return response()->json($ong->fresh(['enderecos', 'contatos', 'imagens']), 200);
            });
        } catch (\Exception $e) {
            return response()->json(['error' => 'Não foi possível atualizar a ONG'], 500);
        }
    }

    /**
     * Deletar ONG (soft delete)
     */
    public function destroy($id): JsonResponse
    {
        $ong = Ong::find($id);

        if (!$ong) {
            return response()->json(['error' => 'ONG não encontrada'], 404);
        }

        try {
            $ong->delete();

            return response()->json(null, 204);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Não foi possível excluir a ONG'], 500);
        }
    }

    /**
     * Restaurar ONG (soft delete)
     */
    public function restore($id): JsonResponse
    {
        $ong = Ong::withTrashed()->find($id);

        if (!$ong) {
            return response()->json(['error' => 'ONG não encontrada'], 404);
        }

        if (!$ong->trashed()) {
            return response()->json(['error' => 'ONG já está ativa'], 400);
        }

        try {
            $ong->restore();

            return response()->json($ong, 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Não foi possível restaurar a ONG'], 500);
        }
    }
}
