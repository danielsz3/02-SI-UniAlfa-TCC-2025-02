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
            $table->unsignedBigInteger('id_ong');
            $table->enum('tipo', [
                'telefone','email','whatsapp','instagram','facebook','site','outro'
            ])->nullable();
            $table->string('contato', 255)->nullable(); // número/email/@user
            $table->string('link', 255)->nullable();    // URL (ex: wa.me, instagram.com/...)
            $table->text('descricao')->nullable();
            $table->timestamps();

            $table->foreign('id_ong')
                  ->references('id_ong')->on('ongs')
                  ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contatos_ongs');
    }
};