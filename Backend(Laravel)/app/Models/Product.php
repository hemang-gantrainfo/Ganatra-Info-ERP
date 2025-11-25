<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{

    use SoftDeletes;

    protected $fillable = [
        'parent_id',
        'name',
        'subtitle',
        'sku',
        'brand',
        'qty',
        'description',
        'promo_start',
        'promo_end',
        'width',
        'length',
        'height',
        'cubic',
        'rrp',
        'cost_price',
        'store_price',
        'active',
        'approved',
        'variants_options',
        'seo_title',
        'seo_description',
        'category_id',
        'promo_price',
        'maropost_sync',
        'shopify_sync',
        'deleted_at'
    ];

    protected $casts = [
        'promo_start' => 'date',
        'promo_end' => 'date',
        'active' => 'boolean',
        'approved' => 'boolean',
        'maropost_sync' => 'integer',
        'shopify_sync' => 'integer',
        "variants_options" => 'array'
    ];

    public function parent()
    {
        return $this->belongsTo(Product::class, 'parent_id');
    }

    public function variants()
    {
        return $this->hasMany(Product::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Product::class, 'parent_id');
    }

    public function images()
    {
        return $this->hasMany(ProductImage::class, 'product_id');
    }
    public function miscField()
    {
        return $this->hasMany(ProductMiscField::class);
    }

    public function mainImage()
    {
        return $this->hasOne(ProductImage::class)->where('type', 'main');
    }

    public function altImages()
    {
        return $this->hasMany(ProductImage::class)->where('type', 'alt');
    }

    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id', 'id');
    }

    public function brandRelation()
    {
        return $this->belongsTo(Brand::class, 'brand', 'id'); // if brand is a separate table
    }
}
