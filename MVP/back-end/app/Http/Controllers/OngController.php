<?php

namespace App\Http\Controllers;

use App\Models\Ong;
use App\Models\ContatoOng;
use App\Models\ImagemOng;
use App\Traits\SearchIndex;
use App\Traits\ManagerGallery;
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
    use ManagerGallery;

    protected $campoImagemCapa = 'imagem';
    protected $campoGaleria = 'imagens';
    protected $storagePath = 'ongs';
    protected $modeloRelacaoGaleria = ImagemOng::class;
    protected $foreignKeyGaleria = 'ong_id';

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
        return response()->json(['error' => 'Método não implementado'], 501);
    }

    public function show($id): JsonResponse
    {
        $ong = Ong::with(['contatos', 'imagens'])->find($id);

        if (!$ong) {
            return response()->json(['error' => 'ONG não encontrada'], 404);
        }

        return response()->json($ong, 200);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $ong = Ong::find($id);
        if (!$ong) {
            return response()->json(['error' => 'ONG não encontrada'], 404);
        }

        // --- Bloco de Pré-validação ---
        if ($request->has('contatos') && is_array($request->input('contatos'))) {
            $decodedContatos = [];
            foreach ($request->input('contatos') as $contato) {
                if (is_string($contato)) {
                    $decodedItem = json_decode($contato, true);
                    if (json_last_error() === JSON_ERROR_NONE) {
                        $decodedContatos[] = $decodedItem;
                    }
                } elseif (is_array($contato)) {
                    $decodedContatos[] = $contato;
                }
            }
            $request->merge(['contatos' => $decodedContatos]);
        }

        // --- Bloco de Validação ---
        $rules = [
            'nome' => 'sometimes|required|string|min:3|max:255',
            'cnpj' => ['sometimes', 'nullable', 'string', 'size:14', 'regex:/^[0-9]+$/', Rule::unique('ongs', 'cnpj')->ignore($ong->id)],
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

            'contatos.*.tipo' => 'required|in:telefone,email,whatsapp,instagram,facebook,site,outro,redesocial',
            'contatos.*.contato' => 'required|string|max:255',

            'contatos.*.link' => 'nullable|url',
            'contatos.*.descricao' => 'nullable|string|max:255',


        ];

        // Regra do ID (separada)
        $rules['contatos.*.id'] = [
            'sometimes',
            'integer',
            Rule::exists('contatos_ongs', 'id')->where(function ($query) use ($id) {
                $query->where('ong_id', $id)->whereNull('deleted_at');
            }),
        ];

        // Validação da Capa (campo $campoImagemCapa)
        if ($request->hasFile($this->campoImagemCapa)) {
            $rules[$this->campoImagemCapa] = 'file|image|mimes:jpeg,png,jpg,gif,webp|max:10240';
        } else {
            $rules[$this->campoImagemCapa] = 'sometimes|nullable|url';
        }

        $messages = [
            'contatos.*.id.exists' => 'O contato informado não pertence a esta ONG ou foi removido.',
            'imagem.image' => 'A imagem deve ser um arquivo de imagem válido.',
            'imagem.mimes' => 'Tipos permitidos: jpeg, png, jpg, webp.',
            'imagem.max' => 'A imagem deve ter no máximo 10MB.',

        ];

        $validator = Validator::make($request->all(), $rules, $messages);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Validação extra

        $validator = Validator::make($request->all(), $rules, $messages);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Validação extra das imagens (galeria)
        $imgRules = $this->getImagesValidationRules();
        $imgValidator = Validator::make($request->all(), $imgRules, [
            'imagens.array' => 'As imagens devem ser enviadas em um array.',
            'imagens.max' => 'O total de imagens não pode exceder 10.',
            'imagens.*.image' => 'Cada arquivo deve ser uma imagem válida.',
            'imagens.*.mimes' => 'Tipos permitidos: jpeg, jpg, png, webp.',
            'imagens.*.max' => 'Cada imagem deve ter no máximo 10MB.',
        ]);
        if ($imgValidator->fails()) {
            return response()->json(['errors' => $imgValidator->errors()], 422);
        }

        // Limite TOTAL de imagens (existentes + novas)
        $imagensExistentes = $ong->imagens()->count();
        $novasImagens = is_array($request->file($this->campoGaleria))
            ? count($request->file($this->campoGaleria))
            : 0;
        $total = $imagensExistentes + $novasImagens;

        if ($total > 10) {
            return response()->json([
                'errors' => [
                    'imagens' => ['O total de imagens não pode exceder 10.'],
                ],
            ], 422);
        }
        // --- Fim da Validação -
        try {
            return DB::transaction(function () use ($request, $ong) {

                // 1. Constrói $data (sem os campos de imagem)
                $fillable = $ong->getFillable();
                $data = [];
                foreach ($fillable as $field) {
                    if ($request->has($field) && !in_array($field, [$this->campoImagemCapa, $this->campoGaleria])) {
                        $data[$field] = $request->input($field);
                    }
                }

                // 2. 👈 CHAMA O TRAIT para processar a CAPA
                if ($request->has($this->campoImagemCapa) || $request->hasFile($this->campoImagemCapa)) {
                    $data[$this->campoImagemCapa] = $this->processarCapaParaUpdate($request, $ong);
                }

                // 3. Atualiza os dados principais
                if (!empty($data)) {
                    $ong->update($data);
                }

                // 4. Sincroniza contatos (seu método)
                if ($request->has('contatos')) {
                    $this->syncContacts($ong, $request->input('contatos', []));
                }

                // 5. 👈 CHAMA O TRAIT para sincronizar a GALERIA
                if ($request->has($this->campoGaleria) || $request->hasFile($this->campoGaleria)) {
                    $this->sincronizarGaleria($request, $ong);
                }

                $imagensExistentes = $ong->imagens()->count();
                $novasImagens = is_array($request->file('imagens')) ? count($request->file('imagens')) : 0;
                $total = $imagensExistentes + $novasImagens;

                if ($total > 10) {
                    return response()->json([
                        'errors' => [
                            'imagens' => ['O total de imagens não pode exceder 10.'],
                        ],
                    ], 422);
                }

                return response()->json($ong->fresh(['contatos', 'imagens']), 200);
            });
        } catch (\Exception $e) {
            Log::error('Erro ao atualizar ONG: ' . $e->getMessage(), [
                'id' => $id,
                'payload' => $request->except(['imagem', 'imagens']), // Remove dados de ficheiro do log
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

    private function getImagesValidationRules(): array
    {
        // Coloque aqui a sua lógica original para $imgRules
        // Exemplo:
        return [
            'imagens' => 'nullable|array|max:10', // Limite de 10 imagens no total
        ];
    }

    /**
     * Lógica para criar/atualizar/deletar contatos (seu método original)
     */
    private function syncContacts(Ong $ong, array $contatosData): void
    {
        $idsRecebidos = [];
        foreach ($contatosData as $contato) {
            if (isset($contato['id'])) {
                $idsRecebidos[] = $contato['id'];
                // Atualiza ou cria
                ContatoOng::updateOrCreate(
                    ['id' => $contato['id'], 'ong_id' => $ong->id],
                    $contato
                );
            } else {
                // Cria
                $novo = $ong->contatos()->create($contato);
                $idsRecebidos[] = $novo->id;
            }
        }
        // Deleta os que não vieram
        $ong->contatos()->whereNotIn('id', $idsRecebidos)->delete();
    }
}
