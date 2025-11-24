<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\Usuario;
use App\Models\Integracao;
use App\Models\Ong;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {

        Usuario::create([
            'nome' => 'Admin',
            'email' => 'admin@admin.com',
            'password' => Hash::make('12345678'),
            'role' => 'admin', 
            'cpf' => '00000000000',
            'data_nascimento' => '2000-01-01',
            'telefone' => '11999999999',
        ]);

        Integracao::create([
            'service' => 'instagram',
            'username' => '',
            'access_token' => '',
            'user_id' => '',
            'status' => 'ativo',
        ]);

        Integracao::create([
            'service' => 'whatsapp',
            'username' => '',
            'access_token' => '',
            'user_id' => '',
            'status' => 'inativo',
        ]);

        Ong::create([
            'nome' => 'Pet Affinity',
            'cnpj' => '03199635000158',
            'razao_social' => 'Pet Affinity LTDA',
            'descricao' => 'Uma ONG responsável pela adoção de animais',
            'imagem' => 'ong_exemplo.jpg',
            'cep' => '12345678',
            'logradouro' => 'Rua Exemplo',
            'numero' => '100',
            'complemento' => 'Sala 1',
            'bairro' => 'Centro',
            'cidade' => 'Umuarama',
            'uf' => 'PR',
            'banco' => 'Banco do Brasil',
            'agencia' => '1234',
            'numero_conta' => '123456789',
            'tipo_conta' => 'corrente',
            'chave_pix' => '123456789',
        ]);

        $this->call([
            UsuarioSeeder::class,
            LarTempSeeder::class,
            AnimalSeeder::class,
            AdocaoSeeder::class,
            TransacaoSeeder::class,
            EventoSeeder::class,
            MatchSeeder::class,
            ParceiroSeeder::class,
            DocumentoSeeder::class,
        ]);
    }
}
