<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [

        'order_id',
        'customer_name',
        'customer_email',
        'order_status',
        'shipping_option',
        'delivery_instruction',
        'ship_address',
        'bill_address',
        'sales_channel',
        'grand_total',
        'shipping_total',
        'shipping_discount',
        'order_type',
        'order_payment',
        'date_placed',
        'date_paid',
        'shipping_signature'
    ];

    protected $casts = [
        'ship_address' => 'array',
        'bill_address' => 'array',
        'order_payment' => 'array',
        'date_placed' => 'datetime',
        'date_paid' => 'datetime'
    ];


    public function orderLines()
    {
        return $this->hasMany(OrderLine::class);
    }
}
