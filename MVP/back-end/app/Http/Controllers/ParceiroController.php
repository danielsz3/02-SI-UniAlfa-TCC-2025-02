<?php

namespace App\Http\Controllers;

use App\Models\Parceiro;
use App\Traits\ManagerGallery;
use App\Traits\SearchIndex;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\JsonResponse;

class ParceiroController extends Controller
{
    use SearchIndex;
    use ManagerGallery;

    protected $campoGaleria = 'imagens';
    protected $storagePath = 'parceiros';
    protected $modeloRelacaoGaleria = Parceiro::class;

    public function index(Request $request): JsonResponse
    {
        return $this->SearchIndex(
            $request,
            Parceiro::query(),
            'parceiros',
            ['nome', 'url_site', 'descricao']
        );
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nome'      => 'required|string|max:255',
            'url_site'  => 'nullable|url',
            'descricao' => 'nullable|string|max:500',
            'imagem'    => 'nullable|file|mimes:jpg,jpeg,png,webp|max:4096',
        ], [
            'nome.required' => 'O nome do parceiro é obrigatório.',
            'nome.max'      => 'O nome do parceiro deve ter no máximo 255 caracteres.',
            'url_site.url'  => 'A URL do site deve ser válida.',
            'descricao.max' => 'A descrição deve ter no máximo 500 caracteres.',
            'imagem.mimes'  => 'A logo deve ser uma imagem do tipo jpg, jpeg, png, webp.',
            'imagem.max'    => 'A logo deve ter no máximo 10MB.',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $data = [
                'nome'      => $request->nome,
                'url_site'  => $request->url_site,
                'descricao' => $request->descricao,
            ];

            if ($request->hasFile('imagem')) {
                $path = $request->file('imagem')->store('parceiros', 'public');
                $data['imagem'] = $path;
            }

            $parceiro = Parceiro::create($data);

            return response()->json($parceiro, 201);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Não foi possível criar o parceiro',
                'message' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $parceiro = Parceiro::find($id);

            if (!$parceiro) {
                return response()->json(['error' => 'Parceiro não encontrado'], 404);
            }

            return response()->json($parceiro, 200);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Não foi possível carregar o parceiro',
                'message' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        try {
            $parceiro = Parceiro::find($id);

            if (!$parceiro) {
                return response()->json(['error' => 'Parceiro não encontrado'], 404);
            }

            $validator = Validator::make($request->all(), [
                'nome'      => 'sometimes|required|string|max:255',
                'url_site'  => 'nullable|url',
                'descricao' => 'nullable|string|max:500',
                'imagem'    => 'nullable|file|mimes:jpg,jpeg,png,webp|max:10240',
            ], [
                'nome.required' => 'O nome do parceiro é obrigatório.',
                'nome.max'      => 'O nome do parceiro deve ter no máximo 255 caracteres.',
                'url_site.url'  => 'A URL do site deve ser válida.',
                'descricao.max' => 'A descrição deve ter no máximo 500 caracteres.',
                'imagem.mimes'  => 'A logo deve ser uma imagem do tipo jpg, jpeg, png, webp.',
                'imagem.max'    => 'A logo deve ter no máximo 10MB.',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $parceiro->nome      = $request->nome      ?? $parceiro->nome;
            $parceiro->url_site  = $request->url_site  ?? $parceiro->url_site;
            $parceiro->descricao = $request->descricao ?? $parceiro->descricao;

            $novoPathImagem = $this->processarCapaParaUpdate($request, $parceiro);
            if ($novoPathImagem !== null) {
                $parceiro->imagem = $novoPathImagem;
            }

            $parceiro->save();

            return response()->json($parceiro->fresh(), 200);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Não foi possível atualizar o parceiro',
                'message' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    public function destroy($id): JsonResponse
    {
        try {
            $parceiro = Parceiro::find($id);

            if (!$parceiro) {
                return response()->json(['error' => 'Parceiro não encontrado'], 404);
            }

            if ($parceiro->imagem && Storage::disk('public')->exists($parceiro->imagem)) {
                Storage::disk('public')->delete($parceiro->imagem);
            }

            $parceiro->delete();

            return response()->json(null, 204);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Não foi possível excluir o parceiro',
                'message' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
