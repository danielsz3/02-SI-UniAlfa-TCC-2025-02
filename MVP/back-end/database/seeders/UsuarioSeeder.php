<?php

namespace Database\Seeders;

use App\Models\Endereco;
use Illuminate\Database\Seeder;
use App\Models\Usuario;
use App\Models\PreferenciaUsuario;
use Illuminate\Support\Facades\Hash;
use Faker\Factory as Faker;

class UsuarioSeeder extends Seeder
{
    public function run()
    {

        $faker = Faker::create('pt_BR');

        $tamanhosPet = ['pequeno', 'medio', 'grande'];
        $temposDisponiveis = ['pouco_tempo', 'tempo_moderado', 'muito_tempo'];
        $estilosVida = ['baixa', 'moderada', 'alta'];
        $espacosCasa = ['area_pequena', 'area_media', 'area_externa'];

        for ($i = 0; $i < 15; $i++) {
            $usuario = Usuario::create([
                'nome' => $faker->name(),
                'email' => $faker->unique()->safeEmail(),
                'password' => Hash::make('password'), 
                'role' => 'user',
                'cpf' => $faker->numerify('###########'), 
                'data_nascimento' => $faker->date('Y-m-d', '2005-01-01'), 
                'telefone' => $faker->numerify('11#########'), 
            ]);

            Endereco::create([
                'id_usuario' => $usuario->id,
                'logradouro' => $faker->streetName(),
                'cidade' => $faker->city(),
                'uf' => 'BR',
                'cep' => $faker->numerify('########'),
                'bairro' => $faker->secondaryAddress(),
                'complemento' => $faker->secondaryAddress(),
                'numero' => $faker->buildingNumber(),
            ]);

            PreferenciaUsuario::create([
                'usuario_id' => $usuario->id, 
                'tamanho_pet' => $faker->randomElement($tamanhosPet),
                'tempo_disponivel' => $faker->randomElement($temposDisponiveis),
                'estilo_vida' => $faker->randomElement($estilosVida),
                'espaco_casa' => $faker->randomElement($espacosCasa),
            ]);
        }
    }
}
