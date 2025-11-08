<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Usuario;
use Illuminate\Support\Facades\Hash;
use Faker\Factory as Faker;

class UsuarioSeeder extends Seeder
{
    public function run()
    {
        $faker = Faker::create();

        for ($i = 0; $i < 10; $i++) {
            Usuario::create([
                'nome' => $faker->name(),
                'email' => $faker->unique()->safeEmail(),
                'password' => Hash::make('password'), // senha padrão para os usuários
                'role' => 'user',
                'cpf' => $faker->numerify('###########'), // 11 dígitos
                'data_nascimento' => $faker->date('Y-m-d', '2005-01-01'), // usuários com no máximo 18 anos
                'telefone' => $faker->numerify('11#########'), // formato telefone com DDD
            ]);
        }
    }
}
