<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;
use Carbon\Carbon;

class MatchSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create('pt_BR');

        // Coleta IDs existentes
        $usuarioIds = DB::table('usuarios')->pluck('id')->toArray();
        $animalIds = DB::table('animais')->pluck('id')->toArray();

        // Garante que existam dados
        if (empty($usuarioIds) || empty($animalIds)) {
            $this->command->warn('⚠️ Nenhum usuário ou animal encontrado. Execute os seeders de usuários e animais antes.');
            return;
        }

        $matches = [];

        // Gera matches aleatórios
        for ($i = 0; $i < 80; $i++) {
            $usuarioId = $faker->randomElement($usuarioIds);
            $animalId = $faker->randomElement($animalIds);

            $matches[] = [
                'usuario_id' => $usuarioId,
                'animal_id' => $animalId,
                'status' => $faker->randomElement(['em_adocao', 'escolhido', 'rejeitado']),
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ];
        }

        // Remove duplicatas (usuario_id + animal_id) para respeitar a UNIQUE
        $matches = collect($matches)->unique(fn ($m) => $m['usuario_id'] . '-' . $m['animal_id'])->values()->all();

        DB::table('matches')->insert($matches);
    }
}
