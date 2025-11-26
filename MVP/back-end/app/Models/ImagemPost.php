<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ImagemPost extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'imagens_posts';

    protected $primaryKey = 'id';


    protected $fillable = ['post_id', 'caminho', 'width', 'height'];

    public function post()
    {
        return $this->belongsTo(Post::class, 'post_id');
    }
}