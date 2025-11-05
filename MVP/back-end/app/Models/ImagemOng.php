<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ImagemOng extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'imagens_ongs';
    protected $primaryKey = 'id';

    protected $fillable = [
        'ong_id',        
        'caminho',
        'width',
        'height',
        'nome_original'
    ];

    /**
     * Relação inversa com ONG
     */
    public function ong()
    {
        return $this->belongsTo(Ong::class, 'ong_id', 'id');
    }
}