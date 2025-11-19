<?php

namespace App\Http\Controllers;

use App\Models\Documento;
use App\Traits\SearchIndex;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class DocumentoController extends Controller
{
    use SearchIndex;

    /**
     * Listar documentos
     */
    public function index(Request $request): JsonResponse
    {
        try {
            return $this->SearchIndex(
                $request,
                Documento::query(),
                'documentos',
                ['titulo', 'categoria', 'descricao']
            );
        } catch (\Exception $e) {
            Log::error('Erro ao listar documentos: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['error' => 'Não foi possível carregar os documentos'], 500);
        }
    }

    /**
     * Criar novo documento
     */
    public function store(Request $request): JsonResponse
    {
        $mimetypeRules = implode(',', [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel.sheet.macroEnabled.12',
            'text/csv',
            'application/csv',
            'text/plain',
            'application/octet-stream',
        ]);

        $validator = Validator::make($request->all(), [
            'titulo'    => 'required|string|max:255',
            'categoria' => 'nullable|string|max:255',
            'descricao' => 'nullable|string|max:1000',
            'arquivo'   => 'required|file|mimetypes:' . $mimetypeRules . '|max:10240',
        ], [
            'titulo.required' => 'O título é obrigatório.',
            'titulo.max' => 'O título deve ter no máximo 255 caracteres.',

            'categoria.max' => 'A categoria deve ter no máximo 255 caracteres.',
            'descricao.max' => 'A descrição deve ter no máximo 1000 caracteres.',

            'arquivo.required' => 'O arquivo é obrigatório.',
            'arquivo.file' => 'O arquivo deve ser um arquivo válido.',
            'arquivo.mimetypes' => 'O arquivo deve ser do tipo: pdf, doc, docx, jpg, jpeg, png, xls, xlsx ou csv.',
            'arquivo.max' => 'O arquivo deve ter no máximo 10MB.',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $file = $request->file('arquivo');
            $originalName = $file->getClientOriginalName();
            
            // Gera um nome único mantendo o nome original
            // Exemplo: documento.pdf -> documento_abc123.pdf
            $fileName = pathinfo($originalName, PATHINFO_FILENAME);
            $extension = $file->getClientOriginalExtension();
            $uniqueName = $fileName . '_' . Str::random(10) . '.' . $extension;
            
            // Salva com o nome personalizado
            $path = $file->storeAs('documentos', $uniqueName, 'public');

            $documento = Documento::create([
                'titulo'         => $request->titulo,
                'categoria'      => $request->categoria,
                'descricao'      => $request->descricao,
                'arquivo'        => $path,
                'tipo'           => $file->getClientMimeType(),
                'tamanho'        => $file->getSize(),
                'nome_original'  => $originalName,
            ]);

            return response()->json($documento, 201);
        } catch (\Exception $e) {
            Log::error('Erro ao criar documento: ' . $e->getMessage(), [
                'payload' => $request->except('arquivo'),
                'exception' => $e
            ]);

            if (isset($path) && Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
            }

            return response()->json([
                'error' => 'Não foi possível criar o documento',
                'message' => config('app.debug') ? $e->getMessage() : 'Erro interno do servidor'
            ], 500);
        }
    }

    /**
     * Mostrar documento
     */
    public function show($id): JsonResponse
    {
        try {
            $documento = Documento::find($id);

            if (!$documento) {
                return response()->json(['error' => 'Documento não encontrado'], 404);
            }

            return response()->json($documento, 200);
        } catch (\Exception $e) {
            Log::error('Erro ao exibir documento: ' . $e->getMessage(), ['id' => $id, 'exception' => $e]);
            return response()->json(['error' => 'Não foi possível carregar o documento'], 500);
        }
    }

    /**
     * Atualizar documento
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $documento = Documento::find($id);

            if (!$documento) {
                return response()->json(['error' => 'Documento não encontrado'], 404);
            }

            $mimetypeRules = implode(',', [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'image/jpeg',
                'image/png',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-excel.sheet.macroEnabled.12',
                'text/csv',
                'application/csv',
                'text/plain',
                'application/octet-stream',
            ]);

            $validator = Validator::make($request->all(), [
                'titulo'    => 'sometimes|required|string|max:255',
                'categoria' => 'nullable|string|max:255',
                'descricao' => 'nullable|string|max:1000',
                'arquivo'   => 'nullable|file|mimetypes:' . $mimetypeRules . '|max:10240',
            ], [
                'titulo.required' => 'O título é obrigatório.',
                'titulo.max' => 'O título deve ter no máximo 255 caracteres.',

                'categoria.max' => 'A categoria deve ter no máximo 255 caracteres.',
                'descricao.max' => 'A descrição deve ter no máximo 1000 caracteres.',

                'arquivo.file' => 'O arquivo deve ser um arquivo válido.',
                'arquivo.mimetypes' => 'O arquivo deve ser do tipo: pdf, doc, docx, jpg, jpeg, png, xls, xlsx ou csv.',
                'arquivo.max' => 'O arquivo deve ter no máximo 10MB.',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $oldPath = null;
            if ($request->hasFile('arquivo')) {
                if ($documento->arquivo && Storage::disk('public')->exists($documento->arquivo)) {
                    $oldPath = $documento->arquivo;
                }

                $file = $request->file('arquivo');
                $originalName = $file->getClientOriginalName();
                
                // Gera um nome único mantendo o nome original
                $fileName = pathinfo($originalName, PATHINFO_FILENAME);
                $extension = $file->getClientOriginalExtension();
                $uniqueName = $fileName . '_' . Str::random(10) . '.' . $extension;
                
                // Salva com o nome personalizado
                $documento->arquivo = $file->storeAs('documentos', $uniqueName, 'public');
                $documento->tipo    = $file->getClientMimeType();
                $documento->tamanho = $file->getSize();
                $documento->nome_original = $originalName;
            }

            $documento->titulo    = $request->titulo    ?? $documento->titulo;
            $documento->categoria = $request->categoria ?? $documento->categoria;
            $documento->descricao = $request->descricao ?? $documento->descricao;
            $documento->save();

            if ($oldPath && Storage::disk('public')->exists($oldPath)) {
                Storage::disk('public')->delete($oldPath);
            }

            return response()->json($documento->fresh(), 200);
        } catch (\Exception $e) {
            Log::error('Erro ao atualizar documento: ' . $e->getMessage(), [
                'id' => $id,
                'payload' => $request->except('arquivo'),
                'exception' => $e
            ]);

            return response()->json([
                'error' => 'Não foi possível atualizar o documento',
                'message' => config('app.debug') ? $e->getMessage() : 'Erro interno do servidor'
            ], 500);
        }
    }

    /**
     * Deletar documento
     */
    public function destroy($id): JsonResponse
    {
        try {
            $documento = Documento::find($id);

            if (!$documento) {
                return response()->json(['error' => 'Documento não encontrado'], 404);
            }

            if ($documento->arquivo && Storage::disk('public')->exists($documento->arquivo)) {
                Storage::disk('public')->delete($documento->arquivo);
            }

            $documento->delete();

            return response()->json(null, 204);
        } catch (\Exception $e) {
            Log::error('Erro ao deletar documento: ' . $e->getMessage(), ['id' => $id, 'exception' => $e]);

            return response()->json([
                'error' => 'Não foi possível excluir o documento',
                'message' => config('app.debug') ? $e->getMessage() : 'Erro interno do servidor'
            ], 500);
        }
    }

    /**
 * Download do arquivo do documento
 */
/**
 * Download ou visualização do arquivo do documento
 */
public function download($id): StreamedResponse|JsonResponse
{
    try {
        $documento = Documento::find($id);

        if (!$documento) {
            return response()->json(['error' => 'Documento não encontrado'], 404);
        }

        $path = $documento->arquivo;

        if (!$path || !Storage::disk('public')->exists($path)) {
            return response()->json(['error' => 'Arquivo não encontrado no armazenamento'], 404);
        }

        // Detecta MIME e extensão
        $mime = $documento->tipo ?? Storage::disk('public')->mimeType($path) ?? 'application/octet-stream';
        $extension = pathinfo($documento->nome_original ?? $path, PATHINFO_EXTENSION);

        // Nome seguro para o arquivo
        $safeTitle = preg_replace('/[^A-Za-z0-9_\-]/', '_', Str::ascii($documento->titulo));
        $fileName = $safeTitle . ($extension ? '.' . $extension : '');

        // Determina se é PDF
        $isPdf = stripos($mime, 'pdf') !== false || strcasecmp($extension, 'pdf') === 0;

        // 1) Se storage for local, usar caminho físico (suporta Range requests)
        try {
            $localPath = Storage::disk('public')->path($path);
            if (file_exists($localPath)) {
                if ($isPdf) {
                    return response()->file($localPath, [
                        'Content-Type' => 'application/pdf',
                        'Content-Disposition' => 'inline; filename="' . $fileName . '"',
                        'X-Content-Type-Options' => 'nosniff',
                    ]);
                } else {
                    return response()->download($localPath, $fileName, [
                        'Content-Type' => $mime,
                        'X-Content-Type-Options' => 'nosniff',
                    ]);
                }
            }
        } catch (\Throwable $e) {
        }

        try {
            if (method_exists(Storage::disk('public'), 'temporaryUrl')) {
                $expires = now()->addMinutes(5);
                $disposition = $isPdf ? 'inline; filename="' . $fileName . '"' : 'attachment; filename="' . $fileName . '"';
                $options = [
                    'ResponseContentDisposition' => $disposition,
                    'ResponseContentType' => $mime,
                ];

                $url = Storage::disk('public')->temporaryUrl($path, $expires, $options);
                return redirect()->away($url);
            }
        } catch (\Throwable $e) {
        }

        $stream = Storage::disk('public')->readStream($path);
        if ($stream === false) {
            return response()->json(['error' => 'Não foi possível abrir o arquivo para leitura'], 500);
        }

        $headers = [
            'Content-Type' => $mime,
            'Content-Disposition' => ($isPdf ? 'inline' : 'attachment') . '; filename="' . $fileName . '"',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0',
            'X-Content-Type-Options' => 'nosniff',
        ];

        return response()->stream(function () use ($stream) {
            fpassthru($stream);
            if (is_resource($stream)) {
                fclose($stream);
            }
        }, 200, $headers);
    } catch (\Exception $e) {
        Log::error('Erro ao fazer download/visualizar documento: ' . $e->getMessage(), ['id' => $id, 'exception' => $e]);

        return response()->json([
            'error' => 'Não foi possível realizar a operação',
            'message' => config('app.debug') ? $e->getMessage() : 'Erro interno do servidor'
        ], 500);
    }
}

}