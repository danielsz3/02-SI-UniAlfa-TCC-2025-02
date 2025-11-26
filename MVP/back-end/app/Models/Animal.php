<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Animal extends Model
{
    use HasFactory,SoftDeletes;

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
    ];

    protected $casts = [
        'data_nascimento' => 'date',
    ];

    public function imagens()
    {
        return $this->hasMany(ImagemAnimal::class, 'animal_id');
    }
}
