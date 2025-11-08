<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Animal extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'animais';

    protected $primaryKey = 'id';

    protected $fillable = [
        'nome',
        'sexo',
        'data_nascimento',
        'castrado',
        'vale_castracao',
        'descricao',
        'tipo_animal',
        'nivel_energia',
        'tamanho',
        'tempo_necessario',
        'ambiente_ideal',
        'situacao',
        'usuario_id',         // Novo campo
        'lar_temporario_id',  // Novo campo
    ];

    protected $casts = [
        'data_nascimento' => 'date',
    ];

    // Relacionamento com Usuario
    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    // Relacionamento com LarTemporario
    public function larTemporario()
    {
        return $this->belongsTo(LarTemporario::class, 'lar_temporario_id');
    }

    // Relacionamento com Imagens
    public function imagens()
    {
        return $this->hasMany(ImagemAnimal::class, 'animal_id');
    }
}