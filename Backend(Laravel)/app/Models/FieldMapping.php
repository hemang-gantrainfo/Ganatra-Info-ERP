<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FieldMapping extends Model
{
    protected $fillable = ['platform', 'local_field', 'api_field', 'is_required'];

    protected $casts = [
        'is_required' => 'boolean',
    ];
}
