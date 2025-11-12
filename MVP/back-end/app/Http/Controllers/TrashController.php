<?php

namespace App\Http\Controllers;

use App\Models\Animal;
use App\Models\ContatoOng;
use App\Models\Documento;
use App\Models\Evento;
use App\Models\LarTemporario;
use App\Models\Parceiro;
use App\Models\Post;
use App\Models\Transacao;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Traits\SearchIndex;

class TrashController extends Controller
{
    use SearchIndex;

    protected function getModelClass(string $modelName): ?string
    {
        $map = [
            'usuarios' => Usuario::class,
            'transacoes' => Transacao::class,
            'parceiros' => Parceiro::class,
            'lares_temporarios' => LarTemporario::class,
            'eventos' => Evento::class,
            'documentos' => Documento::class,
            'animais' => Animal::class,
        ];

        return $map[$modelName] ?? null;
    }

    protected function getLikeFields(string $modelName): array
    {
        $map = [
            'usuarios' => ['nome', 'email'],
            'transacoes' => ['descricao', 'valor'],
            'parceiros' => ['nome', 'descricao'],
            'lares_temporarios' => ['nome', 'descricao'],
            'eventos' => ['titulo', 'descricao'],
            'documentos' => ['titulo', 'descricao'],
            'animais' => ['nome', 'descricao'],
        ];

        return $map[$modelName] ?? [];
    }

    /**
     * Listar itens deletados (soft deleted) com filtros, paginação e ordenação
     */
    public function index(Request $request, string $modelName): JsonResponse
    {
        $modelClass = $this->getModelClass($modelName);
        if (!$modelClass) {
            return response()->json(['error' => 'Modelo não encontrado'], 404);
        }

        try {
            $query = $modelClass::onlyTrashed();
            $likeFields = $this->getLikeFields($modelName);

            return $this->SearchIndex($request, $query, $modelName, $likeFields);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Erro ao listar itens deletados', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Restaurar item deletado
     */
    public function restore(string $modelName, int $id): JsonResponse
    {
        $modelClass = $this->getModelClass($modelName);
        if (!$modelClass) {
            return response()->json(['error' => 'Modelo não encontrado'], 404);
        }

        try {
            $item = $modelClass::withTrashed()->find($id);
            if (!$item) {
                return response()->json(['error' => 'Item não encontrado'], 404);
            }
            if (!$item->trashed()) {
                return response()->json(['error' => 'Item já está ativo'], 400);
            }

            $item->restore();

            return response()->json(['message' => 'Item restaurado com sucesso', 'item' => $item], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Erro ao restaurar item', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Deletar item permanentemente
     */
    public function forceDelete(string $modelName, int $id): JsonResponse
    {
        $modelClass = $this->getModelClass($modelName);
        if (!$modelClass) {
            return response()->json(['error' => 'Modelo não encontrado'], 404);
        }

        try {
            $item = $modelClass::withTrashed()->find($id);
            if (!$item) {
                return response()->json(['error' => 'Item não encontrado'], 404);
            }

            $item->forceDelete();

            return response()->json(['message' => 'Item deletado permanentemente'], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Erro ao deletar item permanentemente', 'message' => $e->getMessage()], 500);
        }
    }
}