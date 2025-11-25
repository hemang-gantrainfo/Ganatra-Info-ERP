<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $table = 'categories';

    protected $fillable = ['name', 'parent_cate_id'];


    public function parent()
    {
        return $this->belongsTo(Category::class, 'parent_cate_id');
    }

    public function children()
    {
        return $this->hasMany(Category::class, 'parent_cate_id');
    }
}
