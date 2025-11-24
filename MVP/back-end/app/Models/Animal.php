<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Casts\Attribute;

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
        'usuario_id',
        'lar_temporario_id',
        'fica_usuario',
    ];

    protected $casts = [
        'data_nascimento' => 'date',
    ];

    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    public function larTemporario()
    {
        return $this->belongsTo(LarTemporario::class, 'lar_temporario_id');
    }

    public function imagens()
    {
        return $this->hasMany(ImagemAnimal::class, 'animal_id');
    }

    protected function larTemporarioId(): Attribute
    {
        return Attribute::make(
            set: fn($value) => ($value == 0 || empty($value)) ? null : $value
        );
    }
}
