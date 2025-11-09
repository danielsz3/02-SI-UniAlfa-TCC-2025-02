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
        // Usa as propriedades definidas no Controller, ou usa um padrão
        $campoNome = $this->campoImagemCapa ?? 'imagem';
        $storagePath = $this->storagePath ?? 'default';

        $campoAntigo = $model->{$campoNome};

        // 1. Se um NOVO FICHEIRO foi enviado
        if ($request->hasFile($campoNome)) {
            $file = $request->file($campoNome);
            $path = $file->store($storagePath, 'public');

            // Deleta a imagem antiga, se existir e não for uma URL externa
            if ($campoAntigo && !Str::startsWith($campoAntigo, ['http://', 'https://'])) {
                Storage::disk('public')->delete($campoAntigo);
            }
            return $path; // Retorna o novo path
        }

        // 2. Se uma STRING (URL ou null) foi enviada
        if ($request->has($campoNome)) {
            return $request->input($campoNome); // Retorna a string (URL ou null)
        }

        // 3. Se nada foi enviado sobre este campo, retorna o valor antigo
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
        // Valida se o controller definiu as propriedades obrigatórias
        if (!property_exists($this, 'modeloRelacaoGaleria') || !property_exists($this, 'foreignKeyGaleria')) {
            throw new \Exception("Para usar TrataUploadsImagensTrait, defina as propriedades \$modeloRelacaoGaleria e \$foreignKeyGaleria no Controller.");
        }

        // Usa as propriedades definidas no Controller
        $campoNome = $this->campoGaleria ?? 'imagens';
        $storagePath = $this->storagePath ?? 'default';
        $imageModelClass = $this->modeloRelacaoGaleria;
        $foreignKey = $this->foreignKeyGaleria;

        // 🔹 1. Capturar arquivos novos
        $arquivosNovos = [];
        if ($request->hasFile($campoNome)) {
            $arquivosNovos = Arr::wrap($request->file($campoNome));
        }

        // 🔹 2. Processar imagens mantidas (referências do request)
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

        // 🔹 3. Buscar imagens atuais do banco
        $imagensAtuais = $imageModelClass::where($foreignKey, $model->id)->get();

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
