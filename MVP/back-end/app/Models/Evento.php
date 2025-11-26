<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Evento extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'eventos';

    protected $primaryKey = 'id';


    protected $fillable = [
        'titulo',
        'data_inicio',
        'data_fim',
        'local',
        'descricao',
        'imagem' // caminho da imagem de capa
    ];

    protected $casts = [
        'data_inicio' => 'date',
        'data_fim' => 'date',
    ];

    public function imagens()
    {
        return $this->hasMany(ImagemEvento::class, 'evento_id');
    }
}
