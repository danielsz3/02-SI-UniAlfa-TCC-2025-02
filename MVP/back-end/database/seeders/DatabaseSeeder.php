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
        // Cria apenas um usuário admin
        Usuario::create([
            'nome' => 'Admin',
            'email' => 'admin@admin.com',
            'password' => Hash::make('12345678'),
            'role' => 'admin', // enum: 'user' | 'admin'
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
            'nome' => 'ONG Exemplo',
            'cnpj' => '00000000000000',
            'razao_social' => 'ONG Exemplo LTDA',
            'descricao' => 'Descrição da ONG Exemplo',
            'imagem' => 'ong_exemplo.jpg',
            'cep' => '12345678',
            'logradouro' => 'Rua Exemplo',
            'numero' => '100',
            'complemento' => 'Sala 1',
            'bairro' => 'Bairro Exemplo',
            'cidade' => 'Cidade Exemplo',
            'uf' => 'EX',
            'banco' => 'Banco Exemplo',
            'agencia' => '1234',
            'numero_conta' => '123456789',
            'tipo_conta' => 'corrente',
            'chave_pix' => '123456789',
        ]);

        $this->call([
            UsuarioSeeder::class,
            AnimalSeeder::class,
            AdocaoSeeder::class,
        ]);
    }
}
