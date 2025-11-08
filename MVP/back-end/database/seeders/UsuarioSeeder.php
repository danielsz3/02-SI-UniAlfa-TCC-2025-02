<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Usuario;
use App\Models\PreferenciaUsuario;
use Illuminate\Support\Facades\Hash;
use Faker\Factory as Faker;

class UsuarioSeeder extends Seeder
{
    public function run()
    {
        // Usar 'pt_BR' para dados mais localizados
        $faker = Faker::create('pt_BR');

        // Opções para as preferências
        $tamanhosPet = ['pequeno', 'medio', 'grande'];
        $temposDisponiveis = ['pouco_tempo', 'tempo_moderado', 'muito_tempo'];
        $estilosVida = ['vida_tranquila', 'ritmo_equilibrado', 'sempre_em_acao'];
        $espacosCasa = ['area_pequena', 'area_media', 'area_externa'];

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

            // 2. Cria as preferências para o usuário recém-criado
            PreferenciaUsuario::create([
                'usuario_id' => $usuario->id, // Associa a preferência ao ID do usuário
                'tamanho_pet' => $faker->randomElement($tamanhosPet),
                'tempo_disponivel' => $faker->randomElement($temposDisponiveis),
                'estilo_vida' => $faker->randomElement($estilosVida),
                'espaco_casa' => $faker->randomElement($espacosCasa),
            ]);
        }
    }
}
