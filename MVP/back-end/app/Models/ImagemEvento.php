<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ImagemEvento extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'imagens_eventos';

    protected $primaryKey = 'id';

    protected $fillable = [
        'evento_id',
        'caminho',
        'width',
        'height'
    ];

    public function evento()
    {
        return $this->belongsTo(Evento::class, 'evento_id');
    }
}