<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\ImagemPost;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class PostController extends Controller
{
    public function index(): JsonResponse
    {
        $posts = Post::with('imagens')->paginate(10);
        return response()->json($posts);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'legenda' => 'nullable|string|max:1000',
            'imagens' => 'nullable|array',
            'imagens.*' => 'image|mimes:jpeg,png,jpg,gif|max:2048',
        ], [
            'imagens.*.image' => 'Cada arquivo deve ser uma imagem válida.',
            'imagens.*.mimes' => 'As imagens devem ser do tipo jpeg, png, jpg ou gif.',
            'imagens.*.max' => 'Cada imagem deve ter no máximo 2MB.',
            'legenda.max' => 'A legenda deve ter no máximo 1000 caracteres.',
        ]);

        // Validação customizada: pelo menos legenda ou imagens deve ser enviado
        $validator->after(function ($validator) use ($request) {
            if (empty($request->legenda) && !$request->hasFile('imagens')) {
                $validator->errors()->add('legenda', 'Você deve enviar uma legenda ou pelo menos uma imagem.');
                $validator->errors()->add('imagens', 'Você deve enviar uma legenda ou pelo menos uma imagem.');
            }
        });

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        return DB::transaction(function () use ($request) {
            $post = Post::create($request->only('legenda'));

            if ($request->hasFile('imagens')) {
                foreach ($request->file('imagens') as $file) {
                    $path = $file->store('posts', 'public');
                    [$width, $height] = getimagesize($file->getRealPath()) ?: [null, null];
                    ImagemPost::create([
                        'post_id' => $post->id,
                        'caminho' => $path,
                        'width' => $width,
                        'height' => $height,
                    ]);
                }
            }

            return response()->json($post->load('imagens'), 201);
        });
    }

    public function show($id): JsonResponse
    {
        $post = Post::with('imagens')->find($id);

        if (!$post) {
            return response()->json(['error' => 'Post não encontrado'], 404);
        }

        return response()->json($post);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $post = Post::find($id);

        if (!$post) {
            return response()->json(['error' => 'Post não encontrado'], 404);
        }

        $validator = Validator::make($request->all(), [
            'legenda' => 'nullable|string|max:1000',
            'imagens' => 'nullable|array',
            'imagens.*' => 'image|mimes:jpeg,png,jpg,gif|max:2048',
        ], [
            'imagens.*.image' => 'Cada arquivo deve ser uma imagem válida.',
            'imagens.*.mimes' => 'As imagens devem ser do tipo jpeg, png, jpg ou gif.',
            'imagens.*.max' => 'Cada imagem deve ter no máximo 2MB.',
            'legenda.max' => 'A legenda deve ter no máximo 1000 caracteres.',
        ]);

        $validator->after(function ($validator) use ($request) {
            if (empty($request->legenda) && !$request->hasFile('imagens')) {
                $validator->errors()->add('legenda', 'Você deve enviar uma legenda ou pelo menos uma imagem.');
                $validator->errors()->add('imagens', 'Você deve enviar uma legenda ou pelo menos uma imagem.');
            }
        });

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        return DB::transaction(function () use ($request, $post) {
            $post->update($request->only('legenda'));

            if ($request->hasFile('imagens')) {
                // Deletar imagens antigas
                foreach ($post->imagens as $imagem) {
                    $oldPath = str_replace('/storage/', '', $imagem->caminho);
                    Storage::disk('public')->delete($oldPath);
                }
                $post->imagens()->delete();

                // Salvar novas imagens
                foreach ($request->file('imagens') as $file) {
                    $path = $file->store('posts', 'public');
                    [$width, $height] = getimagesize($file->getRealPath()) ?: [null, null];
                    ImagemPost::create([
                        'post_id' => $post->id,
                        'caminho' => $path,
                        'width' => $width,
                        'height' => $height,
                    ]);
                }
            }

            return response()->json($post->fresh('imagens'));
        });
    }

    public function destroy($id): JsonResponse
    {
        $post = Post::find($id);

        if (!$post) {
            return response()->json(['error' => 'Post não encontrado'], 404);
        }

        $post->delete();

        return response()->json(null, 204);
    }

    public function restore($id): JsonResponse
    {
        $post = Post::withTrashed()->find($id);

        if (!$post) {
            return response()->json(['error' => 'Post não encontrado'], 404);
        }

        if (!$post->trashed()) {
            return response()->json(['error' => 'Post já está ativo'], 400);
        }

        $post->restore();

        return response()->json($post->fresh('imagens'), 200);
    }
}