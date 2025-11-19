<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Faker\Factory as Faker;

class TransacaoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create('pt_BR');

        $categoriasReceita = ['Doações', 'Parcerias', 'Venda de produtos', 'Eventos beneficentes', 'Patrocínios'];
        $categoriasDespesa = ['Alimentação', 'Veterinário', 'Transporte', 'Manutenção', 'Medicamentos', 'Campanhas'];
        $formasPagamento = ['pix', 'cartao', 'dinheiro', 'transferencia', 'cheque'];

        $transacoes = [];

        for ($i = 0; $i < 2000; $i++) {
            $tipo = $faker->randomElement(['receita', 'despesa']);

            $transacoes[] = [
                'tipo' => $tipo,
                'valor' => $faker->randomFloat(2, 1000, 10000),
                'data' => $faker->dateTimeBetween('-6 months', 'now'),
                'categoria' => $tipo === 'receita'
                    ? $faker->randomElement($categoriasReceita)
                    : $faker->randomElement($categoriasDespesa),
                'descricao' => ucfirst($faker->sentence(3)),
                'forma_pagamento' => $faker->randomElement($formasPagamento),
                'situacao' => $faker->randomElement(['pendente', 'concluido', 'cancelado']),
                'observacao' => $faker->optional()->sentence(8),
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ];
        }

        DB::table('transacoes')->insert($transacoes);
    }
}
