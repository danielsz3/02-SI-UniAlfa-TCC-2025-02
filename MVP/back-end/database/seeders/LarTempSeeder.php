<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Faker\Factory as Faker;

class LarTempSeeder extends Seeder
{

    public function run(): void
    {
        $faker = Faker::create('pt_BR');

        $tipoImagemOptions = [
            'lares_temporarios/casa-5.jpg',
            'lares_temporarios/casa-4.jpeg',
            'lares_temporarios/casa-3.jpeg',
            'lares_temporarios/casa-2.jpg',
            'lares_temporarios/casa-1.jpg'
        ];

        for ($i = 0; $i < 10; $i++) {
            DB::table('lares_temporarios')->insert([
                'nome' => $faker->name(),
                'data_nascimento' => $faker->dateTimeBetween('-60 years', '-18 years')->format('Y-m-d'),
                'telefone' => $faker->phoneNumber(),
                'situacao' => $faker->randomElement(['ativo', 'inativo']),
                'experiencia' => $faker->optional()->sentence(10, true),
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);

            DB::table('enderecos')->insert([
                'lar_temporario_id' => $i + 1,
                'logradouro' => $faker->streetName(),
                'cidade' => $faker->city(),
                'uf' => 'BR',
                'cep' => $faker->numerify('########'),
                'bairro' => $faker->secondaryAddress(),
                'complemento' => $faker->secondaryAddress(),
                'numero' => $faker->buildingNumber(),
            ]);

            DB::table('imagens_lar_temporario')->insert([
                'id_lar_temporario' => $i + 1,
                'caminho' => $faker->randomElement($tipoImagemOptions),
                'width' => 0,
                'height' => 0,
                'deleted_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('imagens_lar_temporario')->insert([
                'id_lar_temporario' => $i + 1,
                'caminho' => $faker->randomElement($tipoImagemOptions),
                'deleted_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('imagens_lar_temporario')->insert([
                'id_lar_temporario' => $i + 1,
                'caminho' => $faker->randomElement($tipoImagemOptions),
                'deleted_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
