<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('usuarios', function (Blueprint $table) {
            $table->id(); 
            $table->string('nome');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('cpf', 11)->unique();
            $table->date('data_nascimento');
            $table->string('telefone', 11)->nullable();
            $table->enum('role', ['user', 'admin'])->default('user');
            $table->string('imagem')->nullable();
            $table->softDeletes(); 
            $table->timestamps(); 
            $table->rememberToken(); 
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('usuarios');
    }
};