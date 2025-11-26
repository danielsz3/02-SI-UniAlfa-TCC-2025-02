<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ImagemLarTemporario extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'imagens_lar_temporario';
    protected $primaryKey = 'id';
  

    protected $fillable = [
        'id_lar_temporario',
        'caminho',
        'width',
        'height',
    ];

    public function larTemporario()
    {
        return $this->belongsTo(LarTemporario::class, 'id_lar_temporario');
    }
}
