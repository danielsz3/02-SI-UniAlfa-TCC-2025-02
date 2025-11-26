<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LarTemporario extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'lares_temporarios';
    protected $primaryKey = 'id';

    protected $fillable = [
        'nome',
        'data_nascimento',
        'telefone',
        'situacao',
        'experiencia',
    ];

    protected $casts = [
        'data_nascimento' => 'date',
    ];

    public function endereco()
    {
        return $this->hasOne(Endereco::class, 'lar_temporario_id');
    }

    public function imagens()
    {
        return $this->hasMany(ImagemLarTemporario::class, 'id_lar_temporario', 'id');
    }

    public function getIdadeAttribute(): ?int
    {
        return $this->data_nascimento?->age;
    }
}