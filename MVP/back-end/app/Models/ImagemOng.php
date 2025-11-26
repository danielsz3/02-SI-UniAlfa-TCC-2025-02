<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ImagemOng extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'imagens_ongs';

    // Se sua migration não define PK diferente, o padrão 'id' é usado
    protected $primaryKey = 'id';

    protected $fillable = [
        'id_ong',
        'caminho',
        'width',
        'height',
    ];

    /**
     * Relação inversa com ONG
     */
    public function ong()
    {
        return $this->belongsTo(Ong::class, 'id_ong', 'id_ong');
    }
}