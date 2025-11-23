<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Documento;
use Illuminate\Support\Str;

class DocumentoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        
        $documentos = [
            [
                'titulo'        => 'Manual Institucional',
                'categoria'     => 'Institucional',
                'descricao'     => 'Manual geral de normas e procedimentos.',
                'arquivo'       => 'documentos/manual_' . Str::random(8) . '.pdf',
                'tipo'          => 'application/pdf',
                'tamanho'       => 102400, 
                'nome_original' => 'manual.pdf',
            ],
            [
                'titulo'        => 'Planilha Financeira 2025',
                'categoria'     => 'Financeiro',
                'descricao'     => 'Planilha com dados financeiros do período.',
                'arquivo'       => 'documentos/financeiro_' . Str::random(8) . '.xlsx',
                'tipo'          => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'tamanho'       => 204800, 
                'nome_original' => 'financeiro.xlsx',
            ],
            [
                'titulo'        => 'Relatório Anual',
                'categoria'     => 'Relatórios',
                'descricao'     => 'Relatório completo referentes às atividades anuais.',
                'arquivo'       => 'documentos/relatorio_' . Str::random(8) . '.docx',
                'tipo'          => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'tamanho'       => 307200, 
                'nome_original' => 'relatorio.docx',
            ],
            [
                'titulo'        => 'Imagem Exemplo',
                'categoria'     => 'Imagens',
                'descricao'     => 'Imagem de demonstração.',
                'arquivo'       => 'documentos/imagem_' . Str::random(8) . '.jpg',
                'tipo'          => 'image/jpeg',
                'tamanho'       => 512000,
                'nome_original' => 'foto.jpg',
            ],
            [
                'titulo'        => 'Lista de Produtos',
                'categoria'     => 'Listas',
                'descricao'     => 'Lista atualizada de produtos disponíveis.',
                'arquivo'       => 'documentos/produtos_' . Str::random(8) . '.csv',
                'tipo'          => 'text/csv',
                'tamanho'       => 40960, 
                'nome_original' => 'lista_produtos.csv',
            ],
        ];

        foreach ($documentos as $doc) {
            Documento::create($doc);
        }
    }
}
