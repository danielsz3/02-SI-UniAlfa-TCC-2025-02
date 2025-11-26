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
        // Lista de mimetypes abrangente para evitar falsos negativos em CSV/XLS/XLSX e imagens
        $mimetypeRules = implode(',', [
            // PDF
            'application/pdf',
            // Word
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            // Imagens
            'image/jpeg', // cobre .jpg e .jpeg
            'image/png',
            // Excel
            'application/vnd.ms-excel', // xls e às vezes csv
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
            'application/vnd.ms-excel.sheet.macroEnabled.12', // xlsm
            // CSV (variações comuns)
            'text/csv',
            'application/csv',
            'text/plain', // alguns CSV vêm assim
            // Fallback (opcional; remova se quiser ser mais rígido)
            'application/octet-stream',
        ]);

        $validator = Validator::make($request->all(), [
            'titulo'    => 'required|string|max:255',
            'categoria' => 'nullable|string|max:255',
            'descricao' => 'nullable|string|max:1000',
            // Opção A (recomendada): mimetypes abrangente
            'arquivo'   => 'required|file|mimetypes:' . $mimetypeRules . '|max:10240',
            // Opção B (por extensão; alternativa mais simples):
            // 'arquivo'   => 'required|file|mimes:pdf,doc,docx,jpg,jpeg,png,xls,xlsx,csv|max:10240',
        ], [
            'titulo.required' => 'O título é obrigatório.',
            'titulo.max' => 'O título deve ter no máximo 255 caracteres.',

            'categoria.max' => 'A categoria deve ter no máximo 255 caracteres.',
            'descricao.max' => 'A descrição deve ter no máximo 1000 caracteres.',

            'arquivo.required' => 'O arquivo é obrigatório.',
            'arquivo.file' => 'O arquivo deve ser um arquivo válido.',
            'arquivo.mimes' => 'O arquivo deve ser do tipo: pdf, doc, docx, jpg, jpeg, png, xls, xlsx ou csv.',
            'arquivo.mimetypes' => 'O arquivo deve ser do tipo: pdf, doc, docx, jpg, jpeg, png, xls, xlsx ou csv.',
            'arquivo.max' => 'O arquivo deve ter no máximo 10MB.',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $file = $request->file('arquivo');
            $path = $file->store('documentos', 'public');

            $documento = Documento::create([
                'titulo'         => $request->titulo,
                'categoria'      => $request->categoria,
                'descricao'      => $request->descricao,
                'arquivo'        => $path,
                'tipo'           => $file->getClientMimeType(),
                'tamanho'        => $file->getSize(),
                'nome_original'  => $file->getClientOriginalName(),
            ]);

            return response()->json($documento, 201);
        } catch (\Exception $e) {
            Log::error('Erro ao criar documento: ' . $e->getMessage(), [
                'payload' => $request->except('arquivo'),
                'exception' => $e
            ]);

            // Em caso de erro após upload, tenta remover o arquivo órfão
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
                // Opção A (mimetypes)
                'arquivo'   => 'nullable|file|mimetypes:' . $mimetypeRules . '|max:10240',
                // Opção B (mimes por extensão)
                // 'arquivo'   => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png,xls,xlsx,csv|max:10240',
            ], [
                'titulo.required' => 'O título é obrigatório.',
                'titulo.max' => 'O título deve ter no máximo 255 caracteres.',

                'categoria.max' => 'A categoria deve ter no máximo 255 caracteres.',
                'descricao.max' => 'A descrição deve ter no máximo 1000 caracteres.',

                'arquivo.file' => 'O arquivo deve ser um arquivo válido.',
                'arquivo.mimes' => 'O arquivo deve ser do tipo: pdf, doc, docx, jpg, jpeg, png, xls, xlsx ou csv.',
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
                $documento->arquivo = $file->store('documentos', 'public');
                $documento->tipo    = $file->getClientMimeType();
                $documento->tamanho = $file->getSize();
                $documento->nome_original = $file->getClientOriginalName();
            }

            $documento->titulo    = $request->titulo    ?? $documento->titulo;
            $documento->categoria = $request->categoria ?? $documento->categoria;
            $documento->descricao = $request->descricao ?? $documento->descricao;
            $documento->save();

            // Remove arquivo antigo após salvar com sucesso
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
     * Restaurar documento deletado
     */
    public function restore($id): JsonResponse
    {
        try {
            $documento = Documento::withTrashed()->find($id);

            if (!$documento) {
                return response()->json(['error' => 'Documento não encontrado'], 404);
            }

            if (!$documento->trashed()) {
                return response()->json(['error' => 'Documento já está ativo'], 400);
            }

            $documento->restore();

            return response()->json($documento->fresh(), 200);
        } catch (\Exception $e) {
            Log::error('Erro ao restaurar documento: ' . $e->getMessage(), ['id' => $id, 'exception' => $e]);

            return response()->json([
                'error' => 'Não foi possível restaurar o documento',
                'message' => config('app.debug') ? $e->getMessage() : 'Erro interno do servidor'
            ], 500);
        }
    }

    /**
     * Download do arquivo do documento
     *
     * @return \Symfony\Component\HttpFoundation\StreamedResponse|\Illuminate\Http\JsonResponse
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

            // Nome do arquivo para download
            $fileName = $documento->nome_original ??
                (pathinfo($path, PATHINFO_BASENAME) ?: 'documento');

            // Content-Type
            $mime = $documento->tipo ??
                (Storage::disk('public')->mimeType($path) ?: 'application/octet-stream');

            return Storage::disk('public')->download($path, $fileName, [
                'Content-Type' => $mime,
            ]);
        } catch (\Exception $e) {
            Log::error('Erro ao fazer download do documento: ' . $e->getMessage(), ['id' => $id, 'exception' => $e]);

            return response()->json([
                'error' => 'Não foi possível realizar o download',
                'message' => config('app.debug') ? $e->getMessage() : 'Erro interno do servidor'
            ], 500);
        }
    }
}