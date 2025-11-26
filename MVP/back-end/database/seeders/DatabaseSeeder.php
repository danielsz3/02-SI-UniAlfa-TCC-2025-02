<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\Usuario;
use App\Models\Integracao;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Cria apenas um usuário admin
        Usuario::create([
            'nome' => 'Admin',
            'email' => 'admin@admin.com',
            'password' => Hash::make('senha4@A'),
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
    }
}
