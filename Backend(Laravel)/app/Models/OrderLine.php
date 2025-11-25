<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderLine extends Model
{
    protected $fillable = [
        'order_id',
        'product_name',
        'sku',
        'quantity',
        'percent_discount',
        'product_discount',
        'cost_price',
        'shipping_tracking',
    ];
}
