<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Faker\Factory as Faker;

class EventoSeeder extends Seeder
{

    public function run(): void
    {
        $faker = Faker::create('pt_BR');

        $tipoImagemOptions = [
            'eventos/eventos-04.jpg',
            'eventos/eventos-03.jpg',
            'eventos/eventos-02.jpg',
            'eventos/eventos-01.jpg'
        ];

        $tipoImagemCapaOptions = [
            'eventos/evento-03.png',
            'eventos/evento-02.jpg',
            'eventos/evento-01.png'
        ];

        for ($i = 0; $i < 10; $i++) {
            $dataInicio = $faker->dateTimeBetween('-1 month', '+2 months');
            $dataFim = (clone $dataInicio)->modify('+' . rand(1, 3) . ' days');

            DB::table('eventos')->insert([
                'titulo' => ucfirst($faker->words(rand(2, 4), true)),
                'data_inicio' => $dataInicio->format('Y-m-d'),
                'data_fim' => $dataFim->format('Y-m-d'),
                'local' => $faker->city() . ', ' . $faker->stateAbbr(),
                'descricao' => $faker->optional()->paragraph(3, true),
                'imagem' => $faker->randomElement($tipoImagemCapaOptions),
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);

            DB::table('imagens_eventos')->insert([
                'evento_id' => $i + 1,
                'caminho' => $faker->randomElement($tipoImagemOptions),
                'deleted_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('imagens_eventos')->insert([
                'evento_id' => $i + 1,
                'caminho' => $faker->randomElement($tipoImagemOptions),
                'deleted_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
