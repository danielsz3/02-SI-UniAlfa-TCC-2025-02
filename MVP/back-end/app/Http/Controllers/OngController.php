<?php

namespace App\Http\Controllers;

use App\Models\Ong;
use App\Models\ContatoOng;
use App\Traits\SearchIndex;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class OngController extends Controller
{
    use SearchIndex;

    /**
     * Lista usando SearchIndex trait
     */
    public function index(Request $request): JsonResponse
    {
        try {
            return $this->SearchIndex(
                $request,
                Ong::query(),
                'ongs',
                ['nome', 'descricao']
            );
        } catch (\Exception $e) {
            Log::error('Erro ao listar ongs: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['error' => 'Não foi possível carregar as ONGs'], 500);
        }
    }

    public function indexWithTrashed(): JsonResponse
    {
        $ongs = Ong::withTrashed()->get();

        return response()->json([
            'data'  => $ongs,
            'total' => $ongs->count()
        ], 200);
    }

    /**
     * Store: cria ONG + contatos (aceita imagem como file ou URL)
     */
    public function store(Request $request): JsonResponse
    {
        // aceita contatos como JSON string (ex.: via FormData)
        if ($request->has('contatos') && is_string($request->input('contatos'))) {
            $decoded = json_decode($request->input('contatos'), true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $request->merge(['contatos' => $decoded]);
            }
        }

        // validação
        $rules = [
            'nome' => 'required|string|min:3|max:255',
            'cnpj' => 'nullable|string|size:14|regex:/^[0-9]+$/',
            'razao_social' => 'required|string|min:3|max:255',
            'descricao' => 'nullable|string|max:1000',
            'cep' => 'nullable|string|size:8|regex:/^[0-9]+$/',
            'logradouro' => 'nullable|string|max:255',
            'numero' => 'nullable|string|max:10',
            'complemento' => 'nullable|string|max:100',
            'bairro' => 'nullable|string|max:100',
            'cidade' => 'nullable|string|max:100',
            'uf' => 'required|string|size:2',
            'banco' => 'nullable|string|max:100',
            'agencia' => 'nullable|string|max:10',
            'numero_conta' => 'nullable|string|max:20',
            'tipo_conta' => 'nullable|string|in:corrente,poupança',
            'chave_pix' => 'nullable|string|max:255',

            // contatos como array de objetos
            'contatos' => 'nullable|array',
            'contatos.*.id' => 'sometimes|integer|exists:contatos_ongs,id',
            'contatos.*.tipo' => 'required_with:contatos|in:telefone,email,whatsapp,instagram,facebook,site,outro,redesocial',
            'contatos.*.contato' => 'required_with:contatos|string|max:255',
            'contatos.*.link' => 'nullable|url',
            'contatos.*.descricao' => 'nullable|string|max:255',
        ];

        // imagem: se vier como arquivo via FormData valida como imagem, senão permite URL
        if ($request->hasFile('imagem')) {
            $rules['imagem'] = 'file|image|mimes:jpeg,png,jpg,gif,webp|max:5120';
        } else {
            $rules['imagem'] = 'nullable|url';
        }

        $validator = Validator::make($request->all(), $rules, [
            'contatos.*.tipo.in' => 'Tipo de contato inválido.',
            'contatos.*.contato.required_with' => 'O valor do contato é obrigatório quando contatos for informado.',
            'imagem.image' => 'A imagem deve ser um arquivo de imagem válido.',
            'imagem.mimes' => 'Tipos permitidos: jpeg, png, jpg, gif, webp.',
            'imagem.max' => 'A imagem deve ter no máximo 5MB.',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            return DB::transaction(function () use ($request) {
                $data = $request->only([
                    'nome','cnpj','razao_social','descricao','cep','logradouro','numero','complemento',
                    'bairro','cidade','uf','banco','agencia','numero_conta','tipo_conta','chave_pix'
                ]);

                // imagem: arquivo ou URL
                if ($request->hasFile('imagem')) {
                    $path = $request->file('imagem')->store('ongs', 'public');
                    $data['imagem'] = $path;
                } else {
                    $data['imagem'] = $request->input('imagem') ?? null;
                }

                $ong = Ong::create($data);

                // criar contatos (se houver)
                $contatos = $request->input('contatos', []);
                if (is_array($contatos) && !empty($contatos)) {
                    $toCreate = [];
                    foreach ($contatos as $c) {
                        $toCreate[] = [
                            'tipo' => $c['tipo'] ?? null,
                            'contato' => $c['contato'] ?? null,
                            'link' => $c['link'] ?? null,
                            'descricao' => $c['descricao'] ?? null,
                        ];
                    }
                    if (!empty($toCreate)) {
                        $ong->contatos()->createMany($toCreate);
                    }
                }

                $ong->load('contatos');
                $ongArr = $ong->toArray();
                $ongArr['imagem_url'] = $this->makeImageUrl($ong->imagem);

                return response()->json($ongArr, 201);
            });
        } catch (\Exception $e) {
            Log::error('Erro ao criar ONG: ' . $e->getMessage(), [
                'payload' => $request->all(),
                'exception' => $e,
            ]);
            return response()->json([
                'error' => 'Erro ao criar ONG',
                'message' => config('app.debug') ? $e->getMessage() : 'Erro interno do servidor'
            ], 500);
        }
    }

    /**
     * Exibe uma ONG com contatos
     */
    public function show($id): JsonResponse
    {
        $ong = Ong::with('contatos')->find($id);

        if (!$ong) {
            return response()->json(['error' => 'ONG não encontrada'], 404);
        }

        $ongArr = $ong->toArray();
        $ongArr['imagem_url'] = $this->makeImageUrl($ong->imagem);

        return response()->json($ongArr, 200);
    }

    /**
     * Update: atualiza ONG + sincroniza contatos (objeto)
     */
    public function update(Request $request, $id): JsonResponse
    {
        $ong = Ong::find($id);
        if (!$ong) {
            return response()->json(['error' => 'ONG não encontrada'], 404);
        }

        // aceita contatos como JSON string
        if ($request->has('contatos') && is_string($request->input('contatos'))) {
            $decoded = json_decode($request->input('contatos'), true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $request->merge(['contatos' => $decoded]);
            }
        }

        $rules = [
            'nome' => 'sometimes|required|string|min:3|max:255',
            'cnpj' => 'nullable|string|size:14|regex:/^[0-9]+$/',
            'razao_social' => 'sometimes|required|string|min:3|max:255',
            'descricao' => 'nullable|string|max:1000',
            'cep' => 'nullable|string|size:8|regex:/^[0-9]+$/',
            'logradouro' => 'nullable|string|max:255',
            'numero' => 'nullable|string|max:10',
            'complemento' => 'nullable|string|max:100',
            'bairro' => 'nullable|string|max:100',
            'cidade' => 'nullable|string|max:100',
            'uf' => 'nullable|string|size:2',
            'banco' => 'nullable|string|max:100',
            'agencia' => 'nullable|string|max:10',
            'numero_conta' => 'nullable|string|max:20',
            'tipo_conta' => 'nullable|string|in:corrente,poupança',
            'chave_pix' => 'nullable|string|max:255',

            'contatos' => 'nullable|array',
            'contatos.*.tipo' => 'required_with:contatos|in:telefone,email,whatsapp,instagram,facebook,site,outro,redesocial',
            'contatos.*.contato' => 'required_with:contatos|string|max:255',
            'contatos.*.link' => 'nullable|url',
            'contatos.*.descricao' => 'nullable|string|max:255',
        ];

        // validação de id de contato: deve pertencer à ONG e estar ativo
        $rules['contatos.*.id'] = [
            'sometimes',
            'integer',
            Rule::exists('contatos_ongs', 'id')->where(function ($query) use ($id) {
                $query->where('ong_id', $id)->whereNull('deleted_at');
            }),
        ];

        // imagem: arquivo ou URL no update
        if ($request->hasFile('imagem')) {
            $rules['imagem'] = 'file|image|mimes:jpeg,png,jpg,gif,webp|max:5120';
        } else {
            $rules['imagem'] = 'sometimes|nullable|url';
        }

        $messages = [
            'contatos.*.id.exists' => 'O contato informado não pertence a esta ONG ou foi removido.',
            'imagem.image' => 'A imagem deve ser um arquivo de imagem válido.',
            'imagem.mimes' => 'Tipos permitidos: jpeg, png, jpg, gif, webp.',
            'imagem.max' => 'A imagem deve ter no máximo 5MB.',
        ];

        $validator = Validator::make($request->all(), $rules, $messages);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            return DB::transaction(function () use ($request, $ong) {
                $data = $request->only([
                    'nome','cnpj','razao_social','descricao','cep','logradouro','numero','complemento',
                    'bairro','cidade','uf','banco','agencia','numero_conta','tipo_conta','chave_pix'
                ]);

                // imagem: novo arquivo ou URL
                if ($request->hasFile('imagem')) {
                    $path = $request->file('imagem')->store('ongs', 'public');

                    // remover imagem antiga do disco se for um arquivo local salvo
                    if ($ong->imagem && !Str::startsWith($ong->imagem, ['http://','https://'])) {
                        Storage::disk('public')->delete($ong->imagem);
                    }
                    $data['imagem'] = $path;
                } elseif ($request->has('imagem')) {
                    // aceita atualização por URL (ou null para remover)
                    $data['imagem'] = $request->input('imagem');
                }

                $ong->update($data);

                // sincroniza contatos se enviados
                if ($request->has('contatos')) {
                    $this->syncContacts($ong, $request->input('contatos', []));
                }

                $ong->load('contatos');
                $ongArr = $ong->toArray();
                $ongArr['imagem_url'] = $this->makeImageUrl($ong->imagem);

                return response()->json($ongArr, 200);
            });
        } catch (\Exception $e) {
            Log::error('Erro ao atualizar ONG: ' . $e->getMessage(), [
                'id' => $id,
                'payload' => $request->all(),
                'exception' => $e,
            ]);
            return response()->json(['error' => 'Não foi possível atualizar a ONG'], 500);
        }
    }

    /**
     * Apaga (soft delete) ONG
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
            Log::error('Erro ao deletar ONG: ' . $e->getMessage(), ['id' => $id, 'exception' => $e]);
            return response()->json(['error' => 'Não foi possível excluir a ONG'], 500);
        }
    }

    /**
     * Restaura ONG com soft-deleted
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
            Log::error('Erro ao restaurar ONG: ' . $e->getMessage(), ['id' => $id, 'exception' => $e]);
            return response()->json(['error' => 'Não foi possível restaurar a ONG'], 500);
        }
    }

    /**
     * Sincroniza contatos: cria novos, atualiza os existentes (quando id fornecido)
     * e soft-deleta os que não foram enviados pelo front.
     *
     * @param Ong $ong
     * @param array $contatos
     * @return void
     */
    private function syncContacts(Ong $ong, array $contatos): void
    {
        $existing = $ong->contatos()->get()->keyBy('id');
        $incomingIds = [];

        foreach ($contatos as $c) {
            if (isset($c['id']) && is_numeric($c['id']) && $existing->has((int) $c['id'])) {
                // atualiza
                $contatoModel = $existing->get((int) $c['id']);
                $contatoModel->update([
                    'tipo' => $c['tipo'] ?? $contatoModel->tipo,
                    'contato' => $c['contato'] ?? $contatoModel->contato,
                    'link' => $c['link'] ?? $contatoModel->link,
                    'descricao' => $c['descricao'] ?? $contatoModel->descricao,
                ]);
                $incomingIds[] = (int) $c['id'];
            } else {
                // novo
                $new = $ong->contatos()->create([
                    'tipo' => $c['tipo'] ?? null,
                    'contato' => $c['contato'] ?? null,
                    'link' => $c['link'] ?? null,
                    'descricao' => $c['descricao'] ?? null,
                ]);
                $incomingIds[] = $new->id;
            }
        }

        // soft-delete os contatos existentes que não vieram no payload
        $toDelete = $existing->keys()->diff($incomingIds);
        if ($toDelete->isNotEmpty()) {
            // dispara model events ao deletar
            ContatoOng::whereIn('id', $toDelete->values()->all())->get()->each->delete();
        }
    }

    /**
     * Monta URL pública para imagem (se for URL externa retorna como está;
     * se for caminho local retorna Storage::url; se null retorna null).
     */
    private function makeImageUrl(?string $imagem): ?string
    {
        if (!$imagem) {
            return null;
        }
        if (Str::startsWith($imagem, ['http://', 'https://'])) {
            return $imagem;
        }
        return Storage::url($imagem);
    }
}