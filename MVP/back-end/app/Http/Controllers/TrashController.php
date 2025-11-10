<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class TrashController extends Controller
{
    // Recebe o nome do model via rota, ex: 'users', 'posts'
    protected function getModelClass($modelName)
    {
        // Mapeie os nomes das rotas para os namespaces dos seus models
        $map = [
            'usuarios' => \App\Models\Usuario::class,
            'posts' => \App\Models\Post::class,
            'transacoes' => \App\Models\Transacao::class,
            'parceiros' => \App\Models\Parceiro::class,
            'lares_temporarios' => \App\Models\LarTemporario::class,
            'eventos' => \App\Models\Evento::class,
            'documentos' => \App\Models\Documento::class,
            'animais' => \App\Models\Animal::class,
            'contatos_ong' => \App\Models\ContatoOng::class,
        ];

        return $map[$modelName] ?? null;
    }

    public function index($modelName)
    {
        $modelClass = $this->getModelClass($modelName);
        if (!$modelClass) {
            abort(404, 'Model not found');
        }

        // Pega só os registros soft deleted
        $trashed = $modelClass::onlyTrashed()->get();

        return view('trash.index', compact('trashed', 'modelName'));
    }

    public function restore($modelName, $id)
    {
        $modelClass = $this->getModelClass($modelName);
        if (!$modelClass) {
            abort(404, 'Model not found');
        }

        $item = $modelClass::withTrashed()->findOrFail($id);
        $item->restore();

        return redirect()->route('trash.index', $modelName)
            ->with('success', 'Item restaurado com sucesso!');
    }

    public function forceDelete($modelName, $id)
    {
        $modelClass = $this->getModelClass($modelName);
        if (!$modelClass) {
            abort(404, 'Model not found');
        }

        $item = $modelClass::withTrashed()->findOrFail($id);
        $item->forceDelete();

        return redirect()->route('trash.index', $modelName)
            ->with('success', 'Item deletado permanentemente!');
    }
}