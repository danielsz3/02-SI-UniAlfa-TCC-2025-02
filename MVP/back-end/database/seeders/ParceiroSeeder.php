<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Parceiro;
use Illuminate\Support\Str;

class ParceiroSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $itens = [
            [
                'nome'      => 'TechSoluções',
                'url_site'  => 'https://techsolucoes.com',
                'descricao' => 'Empresa de tecnologia especializada em sistemas corporativos.',
                'imagem'    => 'parceiros/' . Str::random(10) . '.png',
            ],
            [
                'nome'      => 'Pet&Vida',
                'url_site'  => 'https://petevida.com',
                'descricao' => 'Parceiro responsável pelo fornecimento de produtos veterinários.',
                'imagem'    => 'parceiros/' . Str::random(10) . '.jpg',
            ],
            [
                'nome'      => 'WebMaster Agency',
                'url_site'  => 'https://webmasteragency.com',
                'descricao' => 'Agência de desenvolvimento e marketing digital.',
                'imagem'    => 'parceiros/' . Str::random(10) . '.png',
            ],
            [
                'nome'      => 'Farmácia PopularVet',
                'url_site'  => null,
                'descricao' => 'Farmácia parceira no fornecimento de medicamentos e descontos.',
                'imagem'    => 'parceiros/' . Str::random(10) . '.webp',
            ],
            [
                'nome'      => 'SOS Animal Transportes',
                'url_site'  => 'https://sosanimal.com',
                'descricao' => 'Serviço de transporte seguro para animais resgatados.',
                'imagem'    => 'parceiros/' . Str::random(10) . '.jpeg',
            ],
            [
                'nome'      => 'MundoPet Supplies',
                'url_site'  => 'https://mundopet.com',
                'descricao' => 'Distribuidora de alimentos e acessórios pets.',
                'imagem'    => 'parceiros/' . Str::random(10) . '.jpg',
            ],
        ];

        foreach ($itens as $item) {
            Parceiro::create($item);
        }
    }
}
