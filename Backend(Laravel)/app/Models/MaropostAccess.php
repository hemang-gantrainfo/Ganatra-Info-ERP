<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MaropostAccess extends Model
{
    protected $table = 'maropost_access';
    protected $fillable = [
        'store_url',
        'api_username',
        'api_password',
        'api_key',
    ];
}
