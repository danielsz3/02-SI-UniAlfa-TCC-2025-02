<?php

namespace Database\Seeders;

use App\Models\LarTemporario;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;

class AnimalSeeder extends Seeder
{
    public function run()
    {
        $faker = Faker::create();

        $sexoOptions = ['macho', 'femea'];
        $situacaoOptions = ['disponivel', 'adotado', 'em_adocao', 'em_aprovacao'];
        $tipoAnimalOptions = ['cao', 'gato', 'outro'];
        $nivelEnergiaOptions = ['baixa', 'moderada', 'alta'];
        $tamanhoOptions = ['pequeno', 'medio', 'grande'];
        $tempoNecessarioOptions = ['pouco_tempo', 'tempo_moderado', 'muito_tempo'];
        $ambienteIdealOptions = ['area_pequena', 'area_media', 'area_externa'];

        $tipoImagemOptions = ['animais/animal-01.jpg', 'animais/animal-02.jpg'];

        for ($i = 0; $i < 500; $i++) {
            DB::table('animais')->insert([
                'nome' => $faker->firstName(),
                'sexo' => $faker->randomElement($sexoOptions),
                'data_nascimento' => $faker->date('Y-m-d', '2018-12-31'),
                'castrado' => $faker->boolean(70) ? 1 : 0,
                'vale_castracao' => $faker->boolean(50) ? 1 : 0,
                'descricao' => $faker->paragraph(),
                'situacao' => $faker->randomElement($situacaoOptions),
                'tipo_animal' => $faker->randomElement($tipoAnimalOptions),
                'nivel_energia' => $faker->randomElement($nivelEnergiaOptions),
                'tamanho' => $faker->randomElement($tamanhoOptions),
                'tempo_necessario' => $faker->randomElement($tempoNecessarioOptions),
                'ambiente_ideal' => $faker->randomElement($ambienteIdealOptions),
                'usuario_id' => $faker->numberBetween(1, 10),
                'deleted_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
                "lar_temporario_id" =>  $i % 2 == 0 ? LarTemporario::all()->random()->id : null,
                "fica_usuario" => $i % 2 == 0 ? 0 : 1
            ]);

            DB::table('imagens_animais')->insert([
                'animal_id' => $i + 1,
                'caminho' => $faker->randomElement($tipoImagemOptions),
                'deleted_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('imagens_animais')->insert([
                'animal_id' => $i + 1,
                'caminho' => $faker->randomElement($tipoImagemOptions),
                'deleted_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('imagens_animais')->insert([
                'animal_id' => $i + 1,
                'caminho' => $faker->randomElement($tipoImagemOptions),
                'deleted_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
