<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ImagemAnimal extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'imagens_animais';

    protected $primaryKey = 'id';


    protected $fillable = ['animal_id', 'caminho', 'width', 'height'];

    public function animal()
    {
        return $this->belongsTo(Animal::class, 'animal_id');
    }
}
