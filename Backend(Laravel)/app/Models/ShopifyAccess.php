<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShopifyAccess extends Model
{
    protected $table = 'shopify_access';
    protected $fillable = [
        'store_url',
        'access_token',
    ];
}
