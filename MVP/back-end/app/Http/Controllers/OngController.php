<?php

namespace App\Http\Controllers;

use App\Models\Ong;
use App\Models\ContatoOng;
use App\Models\ImagemOng;
use App\Traits\SearchIndex;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;

class OngController extends Controller
{
    use SearchIndex;

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

    public function store(Request $request): JsonResponse
    {
        // permitir 'contatos' como JSON string
        if ($request->has('contatos') && is_string($request->input('contatos'))) {
            $decoded = json_decode($request->input('contatos'), true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $request->merge(['contatos' => $decoded]);
            }
        }

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

            'contatos' => 'nullable|array',
            'contatos.*.id' => 'sometimes|integer|exists:contatos_ongs,id',
            'contatos.*.tipo' => 'required_with:contatos|in:telefone,email,whatsapp,instagram,facebook,site,outro,redesocial',
            'contatos.*.contato' => 'required_with:contatos|string|max:255',
            'contatos.*.link' => 'nullable|url',
            'contatos.*.descricao' => 'nullable|string|max:255',
        ];

        // imagem de capa no store: pode ser arquivo ou URL
        if ($request->hasFile('imagem')) {
            $rules['imagem'] = 'file|image|mimes:jpeg,png,jpg,gif,webp|max:5120';
        } else {
            $rules['imagem'] = 'nullable|url';
        }

        // validação padrão
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

        // validação unificada para 'imagens' (aceita arquivos ou referências)
        $imgRules = $this->getImagesValidationRules();
        $imgValidator = Validator::make($request->all(), $imgRules);
        if ($imgValidator->fails()) {
            return response()->json(['errors' => $imgValidator->errors()], 422);
        }

        try {
            return DB::transaction(function () use ($request) {
                $data = $request->only([
                    'nome',
                    'cnpj',
                    'razao_social',
                    'descricao',
                    'cep',
                    'logradouro',
                    'numero',
                    'complemento',
                    'bairro',
                    'cidade',
                    'uf',
                    'banco',
                    'agencia',
                    'numero_conta',
                    'tipo_conta',
                    'chave_pix'
                ]);

                if ($request->hasFile('imagem')) {
                    $path = $request->file('imagem')->store('ongs', 'public');
                    $data['imagem'] = $path;
                } else {
                    $data['imagem'] = $request->input('imagem') ?? null;
                }

                $ong = Ong::create($data);

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

                // processar uploads de imagens (apenas arquivos enviados)
                if ($request->hasFile('imagens')) {
                    $files = Arr::wrap($request->file('imagens'));
                    foreach ($files as $file) {
                        if (!$file instanceof \Illuminate\Http\UploadedFile || !$file->isValid()) continue;

                        $path = $file->store("ongs/{$ong->id}", 'public');
                        $originalName = $file->getClientOriginalName();
                        $dimensions = @getimagesize($file->getRealPath());
                        $width = $dimensions[0] ?? null;
                        $height = $dimensions[1] ?? null;

                        ImagemOng::create([
                            'ong_id' => $ong->id,
                            'caminho' => $path,
                            'nome_original' => $originalName,
                            'width' => $width,
                            'height' => $height,
                        ]);
                    }
                }

                $ong->load('contatos', 'imagens');
                $ongArr = $ong->toArray();
                $ongArr['imagem_url'] = $this->makeImageUrl($ong->imagem);
                $ongArr['imagens'] = array_map(function ($i) {
                    return [
                        'id' => $i['id'],
                        'caminho' => $i['caminho'],
                        'nome_original' => $i['nome_original'],
                        'width' => $i['width'],
                        'height' => $i['height'],
                        'url' => $this->makeImageUrl($i['caminho']),
                    ];
                }, $ongArr['imagens'] ?? []);

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

    public function show($id): JsonResponse
    {
        $ong = Ong::with(['contatos', 'imagens'])->find($id);

        if (!$ong) {
            return response()->json(['error' => 'ONG não encontrada'], 404);
        }

        $ongArr = $ong->toArray();
        $ongArr['imagem_url'] = $this->makeImageUrl($ong->imagem);
        $ongArr['imagens'] = array_map(function ($i) {
            return [
                'id' => $i['id'],
                'caminho' => $i['caminho'],
                'nome_original' => $i['nome_original'],
                'width' => $i['width'],
                'height' => $i['height'],
                'url' => $this->makeImageUrl($i['caminho']),
            ];
        }, $ongArr['imagens'] ?? []);

        return response()->json($ongArr, 200);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $ong = Ong::find($id);
        if (!$ong) {
            return response()->json(['error' => 'ONG não encontrada'], 404);
        }

        // permitir 'contatos' como JSON string
        if ($request->has('contatos') && is_string($request->input('contatos'))) {
            $decoded = json_decode($request->input('contatos'), true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $request->merge(['contatos' => $decoded]);
            }
        }

        $rules = [
            'nome' => 'sometimes|required|string|min:3|max:255',
            'cnpj' => ['sometimes','nullable','string','size:14','regex:/^[0-9]+$/', Rule::unique('ongs','cnpj')->ignore($ong->id)],
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

        // imagem de capa no update: arquivo ou URL
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

        // validação unificada para 'imagens' (aceita arquivos ou referências)
        $imgRules = $this->getImagesValidationRules();
        $imgValidator = Validator::make($request->all(), $imgRules);
        if ($imgValidator->fails()) {
            return response()->json(['errors' => $imgValidator->errors()], 422);
        }

        try {
            return DB::transaction(function () use ($request, $ong) {
                // Constrói $data apenas com campos realmente enviados (evita sobrescrever com null)
                $fillable = $ong->getFillable();
                $data = [];
                foreach ($fillable as $field) {
                    if ($request->has($field)) {
                        $data[$field] = $request->input($field);
                    }
                }

                // Processa imagem de capa
                if ($request->hasFile('imagem')) {
                    $path = $request->file('imagem')->store('ongs', 'public');

                    if ($ong->imagem && !Str::startsWith($ong->imagem, ['http://', 'https://'])) {
                        Storage::disk('public')->delete($ong->imagem);
                    }
                    $data['imagem'] = $path;
                } elseif ($request->has('imagem')) {
                    $data['imagem'] = $request->input('imagem');
                }

                if (!empty($data)) {
                    $ong->update($data);
                }

                // Sincroniza contatos (cria/atualiza/delete)
                if ($request->has('contatos')) {
                    $this->syncContacts($ong, $request->input('contatos', []));
                }

                // Tratar imagens da ONG (manter/remover/novas)
                if ($request->has('imagens') || $request->hasFile('imagens')) {
                    // 🔹 1. Capturar arquivos novos
                    $arquivosNovos = [];
                    if ($request->hasFile('imagens')) {
                        $arquivosNovos = Arr::wrap($request->file('imagens'));
                    }

                    // 🔹 2. Processar imagens mantidas (references)
                    $imagensMantidas = [];
                    $imagensInput = $request->input('imagens', []);

                    if (is_array($imagensInput)) {
                        foreach ($imagensInput as $item) {
                            // Se for string JSON, decodifica
                            if (is_string($item)) {
                                $decoded = json_decode($item, true);
                                if ($decoded && isset($decoded['src'])) {
                                    $imagensMantidas[] = basename(parse_url($decoded['src'], PHP_URL_PATH));
                                } elseif (filter_var($item, FILTER_VALIDATE_URL)) {
                                    $imagensMantidas[] = basename(parse_url($item, PHP_URL_PATH));
                                }
                            }
                            // Se já vier como array com 'src'
                            elseif (is_array($item) && isset($item['src'])) {
                                $imagensMantidas[] = basename(parse_url($item['src'], PHP_URL_PATH));
                            }
                        }
                    }

                    // 🔹 3. Buscar imagens atuais do banco
                    $imagensAtuais = ImagemOng::where('ong_id', $ong->id)->get();

                    // 🔹 4. Excluir as removidas
                    foreach ($imagensAtuais as $imagem) {
                        $arquivoAtual = basename($imagem->caminho);

                        if (!in_array($arquivoAtual, $imagensMantidas)) {
                            if (Storage::disk('public')->exists($imagem->caminho)) {
                                Storage::disk('public')->delete($imagem->caminho);
                            }
                            $imagem->delete();
                        }
                    }

                    // 🔹 5. Salvar novas imagens (arquivos enviados)
                    foreach ($arquivosNovos as $file) {
                        if ($file instanceof \Illuminate\Http\UploadedFile && $file->isValid()) {
                            $nomeOriginal = $file->getClientOriginalName();
                            $path = $file->store('ongs', 'public');
                            [$width, $height] = @getimagesize($file->getRealPath()) ?: [null, null];

                            ImagemOng::create([
                                'ong_id' => $ong->id,
                                'caminho' => $path,
                                'nome_original' => $nomeOriginal,
                                'width' => $width,
                                'height' => $height,
                            ]);
                        }
                    }
                }

                $ong->load('contatos', 'imagens');
                $ongArr = $ong->toArray();
                $ongArr['imagem_url'] = $this->makeImageUrl($ong->imagem);
                $ongArr['imagens'] = array_map(function ($i) {
                    return [
                        'id' => $i['id'],
                        'caminho' => $i['caminho'],
                        'nome_original' => $i['nome_original'],
                        'width' => $i['width'],
                        'height' => $i['height'],
                        'url' => $this->makeImageUrl($i['caminho']),
                    ];
                }, $ongArr['imagens'] ?? []);

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

    private function syncContacts(Ong $ong, array $contatos): void
    {
        $existing = $ong->contatos()->get()->keyBy('id');
        $incomingIds = [];

        foreach ($contatos as $c) {
            if (isset($c['id']) && is_numeric($c['id']) && $existing->has((int) $c['id'])) {
                $contatoModel = $existing->get((int) $c['id']);
                $contatoModel->update([
                    'tipo' => $c['tipo'] ?? $contatoModel->tipo,
                    'contato' => $c['contato'] ?? $contatoModel->contato,
                    'link' => $c['link'] ?? $contatoModel->link,
                    'descricao' => $c['descricao'] ?? $contatoModel->descricao,
                ]);
                $incomingIds[] = (int) $c['id'];
            } else {
                $new = $ong->contatos()->create([
                    'tipo' => $c['tipo'] ?? null,
                    'contato' => $c['contato'] ?? null,
                    'link' => $c['link'] ?? null,
                    'descricao' => $c['descricao'] ?? null,
                ]);
                $incomingIds[] = $new->id;
            }
        }

        $toDelete = $existing->keys()->diff($incomingIds);
        if ($toDelete->isNotEmpty()) {
            // dispara model events ao deletar
            ContatoOng::whereIn('id', $toDelete->values()->all())->get()->each->delete();
        }
    }

    public function uploadImages(Request $request, $id): JsonResponse
    {
        $ong = Ong::find($id);
        if (!$ong) {
            return response()->json(['error' => 'ONG não encontrada'], 404);
        }

        // uploadImages endpoint só aceita uploads de arquivos
        $validator = Validator::make($request->all(), [
            'imagens' => 'required|array',
            'imagens.*' => 'file|image|mimes:jpeg,png,jpg,gif,webp|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $created = [];
            foreach (Arr::wrap($request->file('imagens')) as $file) {
                if (!$file->isValid()) continue;
                $path = $file->store("ongs/{$ong->id}", 'public');
                $origName = $file->getClientOriginalName();
                $dimensions = @getimagesize($file->getRealPath());
                $width = $dimensions[0] ?? null;
                $height = $dimensions[1] ?? null;

                $img = ImagemOng::create([
                    'ong_id' => $ong->id,
                    'caminho' => $path,
                    'nome_original' => $origName,
                    'width' => $width,
                    'height' => $height,
                ]);

                $created[] = [
                    'id' => $img->id,
                    'caminho' => $img->caminho,
                    'url' => $this->makeImageUrl($img->caminho),
                ];
            }

            return response()->json(['data' => $created], 201);
        } catch (\Exception $e) {
            Log::error('Erro ao enviar imagens ONG: ' . $e->getMessage(), ['id' => $id, 'exception' => $e]);
            return response()->json(['error' => 'Erro ao enviar imagens'], 500);
        }
    }

    public function deleteImage($id): JsonResponse
    {
        $imagem = ImagemOng::find($id);
        if (!$imagem) {
            return response()->json(['error' => 'Imagem não encontrada'], 404);
        }

        try {
            if ($imagem->caminho && !Str::startsWith($imagem->caminho, ['http://', 'https://'])) {
                Storage::disk('public')->delete($imagem->caminho);
            }
            $imagem->delete();
            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error('Erro ao apagar imagem ONG: ' . $e->getMessage(), ['id' => $id, 'exception' => $e]);
            return response()->json(['error' => 'Não foi possível apagar a imagem'], 500);
        }
    }

    private function makeImageUrl(?string $imagem): ?string
    {
        if (!$imagem) return null;
        if (Str::startsWith($imagem, ['http://', 'https://'])) return $imagem;
        return Storage::url($imagem);
    }

    /**
     * Regras de validação para o campo 'imagens' — aceita:
     * - UploadedFile (novo upload)
     * - string URL direta
     * - string JSON com { "src": "https://..." }
     */
    private function getImagesValidationRules(): array
    {
        return [
            'imagens' => 'sometimes|array',
            'imagens.*' => [
                function ($attribute, $value, $fail) {
                    // Upload válido
                    if ($value instanceof \Illuminate\Http\UploadedFile) {
                        if (!$value->isValid()) {
                            return $fail("$attribute: arquivo inválido.");
                        }
                        $allowed = ['image/jpeg','image/png','image/gif','image/webp','image/jpg'];
                        if (!in_array($value->getMimeType(), $allowed)) {
                            return $fail("$attribute: tipo de imagem não permitido.");
                        }
                        return;
                    }

                    // se for string → pode ser URL ou JSON com src
                    if (is_string($value)) {
                        $decoded = json_decode($value, true);
                        if ($decoded && isset($decoded['src']) && filter_var($decoded['src'], FILTER_VALIDATE_URL)) {
                            return; // JSON com src válido
                        }
                        if (filter_var($value, FILTER_VALIDATE_URL)) {
                            return; // URL direta
                        }

                        return $fail("$attribute deve ser um arquivo (upload) ou uma referência (URL ou JSON com 'src').");
                    }

                    return $fail("$attribute deve ser um arquivo (upload) ou uma referência (URL ou JSON com 'src').");
                }
            ]
        ];
    }
}