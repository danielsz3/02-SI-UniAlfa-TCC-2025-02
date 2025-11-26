<?php

namespace App\Http\Controllers;

use App\Models\LarTemporario;
use App\Models\Endereco;
use App\Models\ImagemLarTemporario;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use App\Traits\SearchIndex;
use Illuminate\Support\Arr;
use Carbon\Carbon;

class LaresTemporarioController extends Controller
{
    use SearchIndex;

    /*
    |--------------------------------------------------------------------------
    | Listagem
    |--------------------------------------------------------------------------
    */
    public function index(Request $request): JsonResponse
    {
        return $this->SearchIndex(
            $request,
            LarTemporario::with(['endereco', 'imagens']),
            'lares_temporarios',
            ['nome', 'data_nascimento', 'telefone']
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Criação
    |--------------------------------------------------------------------------
    */
    public function store(Request $request): JsonResponse
    {
        // Decodifica o campo 'endereco' (string JSON) para array, pois pode vir via FormData
        if ($request->has('endereco') && is_string($request->input('endereco'))) {
            $request->merge(['endereco' => json_decode($request->input('endereco'), true)]);
        }

        // Normaliza data_nascimento para Y-m-d quando vier como ISO com T/Z
        if ($request->filled('data_nascimento') && is_string($request->input('data_nascimento'))) {
            try {
                $dt = Carbon::parse($request->input('data_nascimento'))->startOfDay();
                $request->merge(['data_nascimento' => $dt->toDateString()]);
            } catch (\Throwable $e) {
                // deixa o validator acusar caso inválida
            }
        }

        $validator = Validator::make($request->all(), [
            'nome'            => 'required|string|min:2|max:150',

            // Idade mínima de 18 anos
            'data_nascimento' => 'required|date|after:1900-01-01|before_or_equal:-18 years',

            'telefone'        => 'required|string|size:11|regex:/^[0-9]+$/',
            'situacao'        => 'required|in:ativo,inativo',
            'experiencia'     => 'nullable|string|max:1000',

            // Endereço
            'endereco.cep'          => 'nullable|string|max:9',
            'endereco.logradouro'   => 'nullable|string|max:255',
            'endereco.numero'       => 'nullable|string|max:10',
            'endereco.complemento'  => 'nullable|string|max:100',
            'endereco.bairro'       => 'nullable|string|max:100',
            'endereco.cidade'       => 'nullable|string|max:100',
            'endereco.uf'           => 'nullable|string|max:2',

            // Imagens (até 10MB cada)
            'imagens.*' => 'file|image|mimes:jpeg,png,jpg,gif|max:10240',
        ], [
            'nome.required' => 'O nome é obrigatório.',
            'nome.min' => 'O nome deve ter no mínimo 2 caracteres.',
            'nome.max' => 'O nome deve ter no máximo 150 caracteres.',

            'data_nascimento.required' => 'A data de nascimento é obrigatória.',
            'data_nascimento.date' => 'A data de nascimento deve ser válida.',
            'data_nascimento.after' => 'A data de nascimento deve ser posterior a 01/01/1900.',
            'data_nascimento.before_or_equal' => 'Você deve ter pelo menos 18 anos.',

            'telefone.required' => 'O telefone é obrigatório.',
            'telefone.size' => 'O telefone deve ter exatamente 11 números.',
            'telefone.regex' => 'O telefone deve conter apenas números.',

            'situacao.required' => 'A situação é obrigatória.',
            'situacao.in' => 'A situação deve ser "ativo" ou "inativo".',

            'experiencia.max' => 'A experiência deve ter no máximo 1000 caracteres.',

            'endereco.cep.max' => 'O CEP deve ter no máximo 9 caracteres.',
            'endereco.logradouro.max' => 'O logradouro deve ter no máximo 255 caracteres.',
            'endereco.numero.max' => 'O número deve ter no máximo 10 caracteres.',
            'endereco.complemento.max' => 'O complemento deve ter no máximo 100 caracteres.',
            'endereco.bairro.max' => 'O bairro deve ter no máximo 100 caracteres.',
            'endereco.cidade.max' => 'A cidade deve ter no máximo 100 caracteres.',
            'endereco.uf.max' => 'A UF deve ter no máximo 2 caracteres.',

            'imagens.*.image' => 'Cada arquivo enviado em imagens deve ser uma imagem válida.',
            'imagens.*.mimes' => 'As imagens devem ser do tipo: jpeg, png, jpg ou gif.',
            'imagens.*.max' => 'Cada imagem deve ter no máximo 10MB.',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            return DB::transaction(function () use ($request) {
                $lar = LarTemporario::create($request->only([
                    'nome',
                    'data_nascimento',
                    'telefone',
                    'situacao',
                    'experiencia'
                ]));

                // Endereço
                if ($request->has('endereco') && is_array($request->endereco) && !empty(array_filter($request->endereco))) {
                    $enderecoData = $request->endereco;
                    $enderecoData['lar_temporario_id'] = $lar->id;
                    Endereco::create($enderecoData);
                }

                $files = Arr::wrap($request->file('imagens', []));

                foreach ($files as $file) {
                    if ($file && $file->isValid()) {
                        $path = $file->store('lares_temporarios', 'public');
                        [$width, $height] = @getimagesize($file->getRealPath()) ?: [null, null];

                        ImagemLarTemporario::create([
                            'id_lar_temporario' => $lar->id,
                            'caminho'        => $path,
                            'width'             => $width,
                            'height'            => $height,
                        ]);
                    }
                }

                return response()->json($lar->load(['endereco', 'imagens']), 201);
            });
        } catch (\Exception $e) {
            Log::error('Erro ao criar lar temporário: ' . $e->getMessage(), [
                'exception' => $e,
                'payload' => $request->except('imagens'),
            ]);
            return response()->json([
                'error' => 'Erro ao criar lar temporário',
                'message' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Detalhes
    |--------------------------------------------------------------------------
    */
    public function show($id): JsonResponse
    {
        $lar = LarTemporario::with(['endereco', 'imagens'])->find($id);

        if (!$lar) {
            return response()->json(['error' => 'Lar temporário não encontrado'], 404);
        }

        return response()->json($lar, 200);
    }

    /*
    |--------------------------------------------------------------------------
    | Atualização
    |--------------------------------------------------------------------------
    */
    public function update(Request $request, $id): JsonResponse
    {
        $lar = LarTemporario::find($id);

        if (!$lar) {
            return response()->json(['error' => 'Lar temporário não encontrado'], 404);
        }

        // Decodifica o campo 'endereco' (string JSON) para array, caso venha por FormData
        if ($request->has('endereco') && is_string($request->input('endereco'))) {
            $request->merge(['endereco' => json_decode($request->input('endereco'), true)]);
        }

        // Normaliza data_nascimento para Y-m-d quando vier como ISO com T/Z
        if ($request->filled('data_nascimento') && is_string($request->input('data_nascimento'))) {
            try {
                $dt = Carbon::parse($request->input('data_nascimento'))->startOfDay();
                $request->merge(['data_nascimento' => $dt->toDateString()]);
            } catch (\Throwable $e) {
                // deixa o validator acusar caso inválida
            }
        }

        // Validação condicional: só aplica file|image se houver arquivos de fato
        $rules = [
            'nome'            => 'sometimes|required|string|min:2|max:150',
            'data_nascimento' => 'sometimes|required|date|after:1900-01-01|before_or_equal:-18 years',
            'telefone'        => 'sometimes|required|string|size:11|regex:/^[0-9]+$/',
            'situacao'        => 'sometimes|required|in:ativo,inativo',
            'experiencia'     => 'nullable|string|max:1000',

            // Endereço
            'endereco.id'           => 'nullable|integer|exists:enderecos,id',
            'endereco.cep'          => 'nullable|string|max:9',
            'endereco.logradouro'   => 'nullable|string|max:255',
            'endereco.numero'       => 'nullable|string|max:10',
            'endereco.complemento'  => 'nullable|string|max:100',
            'endereco.bairro'       => 'nullable|string|max:100',
            'endereco.cidade'       => 'nullable|string|max:100',
            'endereco.uf'           => 'nullable|string|max:2',

            // Imagens - validação condicional
            'imagens' => 'nullable|array',
        ];

        // Só valida como file se houver arquivos enviados
        if ($request->hasFile('imagens')) {
            $rules['imagens.*'] = 'file|image|mimes:jpeg,png,jpg,gif|max:10240';
        }

        $validator = Validator::make($request->all(), $rules, [
            'nome.required' => 'O nome é obrigatório.',
            'nome.min' => 'O nome deve ter no mínimo 2 caracteres.',
            'nome.max' => 'O nome deve ter no máximo 150 caracteres.',

            'data_nascimento.date' => 'A data de nascimento deve ser válida.',
            'data_nascimento.after' => 'A data de nascimento deve ser posterior a 01/01/1900.',
            'data_nascimento.before_or_equal' => 'Você deve ter pelo menos 18 anos.',

            'telefone.size' => 'O telefone deve ter exatamente 11 números.',
            'telefone.regex' => 'O telefone deve conter apenas números.',

            'situacao.in' => 'A situação deve ser "ativo" ou "inativo".',

            'experiencia.max' => 'A experiência deve ter no máximo 1000 caracteres.',

            'endereco.id.exists' => 'O endereço informado não existe.',
            'endereco.cep.max' => 'O CEP deve ter no máximo 9 caracteres.',
            'endereco.logradouro.max' => 'O logradouro deve ter no máximo 255 caracteres.',
            'endereco.numero.max' => 'O número deve ter no máximo 10 caracteres.',
            'endereco.complemento.max' => 'O complemento deve ter no máximo 100 caracteres.',
            'endereco.bairro.max' => 'O bairro deve ter no máximo 100 caracteres.',
            'endereco.cidade.max' => 'A cidade deve ter no máximo 100 caracteres.',
            'endereco.uf.max' => 'A UF deve ter no máximo 2 caracteres.',

            'imagens.*.image' => 'Cada arquivo enviado em imagens deve ser uma imagem válida.',
            'imagens.*.mimes' => 'As imagens devem ser do tipo: jpeg, png, jpg ou gif.',
            'imagens.*.max' => 'Cada imagem deve ter no máximo 10MB.',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            return DB::transaction(function () use ($request, $lar) {
                $lar->update($request->only([
                    'nome',
                    'data_nascimento',
                    'telefone',
                    'situacao',
                    'experiencia'
                ]));

                // Endereço
                if ($request->has('endereco') && is_array($request->endereco) && !empty(array_filter($request->endereco))) {
                    $enderecoData = $request->endereco;

                    if (isset($enderecoData['id'])) {
                        $endereco = Endereco::where('id', $enderecoData['id'])
                            ->where('lar_temporario_id', $lar->id)
                            ->first();
                        if ($endereco) {
                            $endereco->update($enderecoData);
                        } else {
                            // se id informado não pertence a este lar, criamos um novo endereço vinculado
                            $enderecoData['lar_temporario_id'] = $lar->id;
                            Endereco::create($enderecoData);
                        }
                    } else {
                        // remove endereços anteriores e cria novo (mantendo seu comportamento original)
                        Endereco::where('lar_temporario_id', $lar->id)->delete();
                        $enderecoData['lar_temporario_id'] = $lar->id;
                        Endereco::create($enderecoData);
                    }
                }

                // === Tratamento de imagens ===
                if ($request->has('imagens') || $request->hasFile('imagens')) {
                    // 🔹 1. Capturar arquivos novos
                    $arquivosNovos = [];
                    if ($request->hasFile('imagens')) {
                        $arquivosNovos = Arr::wrap($request->file('imagens'));
                    }

                    // 🔹 2. Processar imagens mantidas
                    $imagensMantidas = [];
                    $imagensInput = $request->input('imagens', []);

                    if (is_array($imagensInput)) {
                        foreach ($imagensInput as $item) {
                            // Se for string JSON, decodifica
                            if (is_string($item)) {
                                $decoded = json_decode($item, true);
                                if ($decoded && isset($decoded['src'])) {
                                    $imagensMantidas[] = basename(parse_url($decoded['src'], PHP_URL_PATH));
                                }
                            }
                            // Se já vier como array com 'src'
                            elseif (is_array($item) && isset($item['src'])) {
                                $imagensMantidas[] = basename(parse_url($item['src'], PHP_URL_PATH));
                            }
                        }
                    }

                    // 🔹 3. Buscar imagens atuais do banco
                    $imagensAtuais = ImagemLarTemporario::where('id_lar_temporario', $lar->id)->get();

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

                    // 🔹 5. Salvar novas imagens
                    foreach ($arquivosNovos as $file) {
                        if ($file instanceof \Illuminate\Http\UploadedFile && $file->isValid()) {
                            $path = $file->store('lares_temporarios', 'public');
                            [$width, $height] = @getimagesize($file->getRealPath()) ?: [null, null];

                            ImagemLarTemporario::create([
                                'id_lar_temporario' => $lar->id,
                                'caminho' => $path,
                                'width' => $width,
                                'height' => $height,
                            ]);
                        }
                    }
                }

                return response()->json($lar->fresh(['endereco', 'imagens']), 200);
            });
        } catch (\Exception $e) {
            Log::error('Erro ao atualizar lar temporário: ' . $e->getMessage(), [
                'exception' => $e,
                'payload' => $request->except('imagens'),
            ]);
            return response()->json([
                'error' => 'Erro ao atualizar lar temporário',
                'message' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Exclusão
    |--------------------------------------------------------------------------
    */
    public function destroy($id): JsonResponse
    {
        $lar = LarTemporario::with(['imagens'])->find($id);

        if (!$lar) {
            return response()->json(['error' => 'Lar temporário não encontrado'], 404);
        }

        try {
            // remover arquivos do storage (caso existam)
            foreach ($lar->imagens as $imagem) {
                if ($imagem->caminho) {
                    $oldPath = ltrim(str_replace('/storage/', '', $imagem->caminho), '/');
                    if (Storage::disk('public')->exists($oldPath)) {
                        Storage::disk('public')->delete($oldPath);
                    }
                }
            }

            $lar->delete(); // SoftDelete

            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error('Erro ao deletar lar temporário: ' . $e->getMessage(), [
                'exception' => $e
            ]);
            return response()->json(['error' => 'Erro ao deletar lar temporário'], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Restauração
    |--------------------------------------------------------------------------
    */
    public function restore($id): JsonResponse
    {
        $lar = LarTemporario::withTrashed()->find($id);

        if (!$lar) {
            return response()->json(['error' => 'Lar temporário não encontrado'], 404);
        }

        if (!$lar->trashed()) {
            return response()->json(['error' => 'Lar já está ativo'], 400);
        }

        try {
            $lar->restore();
            return response()->json($lar->load(['endereco', 'imagens']), 200);
        } catch (\Exception $e) {
            Log::error('Erro ao restaurar lar temporário: ' . $e->getMessage(), [
                'exception' => $e
            ]);
            return response()->json(['error' => 'Erro ao restaurar lar temporário'], 500);
        }
    }
}
