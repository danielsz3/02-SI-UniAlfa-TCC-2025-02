<?php

namespace App\Traits;

use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Arr;
use Illuminate\Http\UploadedFile;

trait ManagerGallery
{
    /**
     * Processa a IMAGEM DE CAPA e retorna o path/URL para o update.
     * Este método lê as propriedades definidas no Controller ($campoImagemCapa, $storagePath).
     *
     * @param Request $request O request HTTP.
     * @param Model $model O modelo (Ong, Evento, etc.)
     * @return string|null O valor a ser salvo no banco (path, URL ou null).
     */
    protected function processarCapaParaUpdate(Request $request, Model $model): ?string
    {

        $campoNome = $this->campoImagemCapa ?? 'imagem';
        $storagePath = $this->storagePath ?? 'default';

        $campoAntigo = $model->{$campoNome};

        if ($request->hasFile($campoNome)) {
            $file = $request->file($campoNome);
            $path = $file->store($storagePath, 'public');

            if ($campoAntigo && !Str::startsWith($campoAntigo, ['http://', 'https://'])) {
                Storage::disk('public')->delete($campoAntigo);
            }
            return $path;
        }

        if ($request->has($campoNome)) {
            return $request->input($campoNome);
        }

        return $campoAntigo;
    }

    /**
     * Sincroniza a GALERIA DE IMAGENS (múltiplos).
     * Este método faz todo o trabalho: cria, deleta e atualiza.
     * Lê as propriedades do Controller ($campoGaleria, $storagePath, etc.)
     *
     * @param Request $request O request HTTP.
     * @param Model $model O modelo (Ong, Evento, etc.)
     * @return void
     */
    protected function sincronizarGaleria(Request $request, Model $model): void
    {

        if (!property_exists($this, 'modeloRelacaoGaleria') || !property_exists($this, 'foreignKeyGaleria')) {
            throw new \Exception("Para usar TrataUploadsImagensTrait, defina as propriedades \$modeloRelacaoGaleria e \$foreignKeyGaleria no Controller.");
        }

        $campoNome = $this->campoGaleria ?? 'imagens';
        $storagePath = $this->storagePath ?? 'default';
        $imageModelClass = $this->modeloRelacaoGaleria;
        $foreignKey = $this->foreignKeyGaleria;

        $arquivosNovos = [];
        if ($request->hasFile($campoNome)) {
            $arquivosNovos = Arr::wrap($request->file($campoNome));
        }

        $imagensMantidas = [];
        $imagensInput = $request->input($campoNome, []);

        if (is_array($imagensInput)) {
            foreach ($imagensInput as $item) {
                $url = null;
                if (is_string($item)) {
                    $decoded = json_decode($item, true);
                    if ($decoded && isset($decoded['src'])) $url = $decoded['src'];
                    elseif (filter_var($item, FILTER_VALIDATE_URL)) $url = $item;
                } elseif (is_array($item) && isset($item['src'])) {
                    $url = $item['src'];
                }
                if ($url) $imagensMantidas[] = basename(parse_url($url, PHP_URL_PATH));
            }
        }

        $imagensAtuais = $imageModelClass::where($foreignKey, $model->id)->get();

        foreach ($imagensAtuais as $imagem) {
            $arquivoAtual = basename($imagem->caminho);
            if (!in_array($arquivoAtual, $imagensMantidas)) {
                if (Storage::disk('public')->exists($imagem->caminho)) {
                    Storage::disk('public')->delete($imagem->caminho);
                }
                $imagem->delete();
            }
        }

        foreach ($arquivosNovos as $file) {
            if ($file instanceof UploadedFile && $file->isValid()) {
                $nomeOriginal = $file->getClientOriginalName();
                $path = $file->store($storagePath, 'public');
                [$width, $height] = @getimagesize($file->getRealPath()) ?: [null, null];

                $imageModelClass::create([
                    $foreignKey => $model->id,
                    'caminho' => $path,
                    'nome_original' => $nomeOriginal,
                    'width' => $width,
                    'height' => $height,
                ]);
            }
        }
    }
}
