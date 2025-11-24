<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contatos_ongs', function (Blueprint $table) {
            $table->id();
            $table->enum('tipo', ['telefone', 'email', 'whatsapp', 'instagram', 'facebook', 'site', 'outro'])->nullable();
            $table->string('contato')->nullable();
            $table->string('link')->nullable();
            $table->text('descricao')->nullable();
            $table->foreignId('ong_id')->constrained('ongs')->cascadeOnDelete();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contatos_ongs');
    }
};