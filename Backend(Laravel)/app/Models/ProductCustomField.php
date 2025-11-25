<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class ProductCustomField extends Model
{
    protected $table = 'custom_produts_fields'; // table name

    protected $fillable = [
        'customField',
        'fieldDescription',
        'fieldName',
        'fieldType',
        'options',
        'section',
        'selectionType',
        'showOnDisplayPage',
        'showOnThumbnail',
    ];

    protected static function booted()
    {
        // When a new custom field is created
        static::created(function ($field) {
            $column = strtolower($field->customField); // e.g., misc01

            if (!Schema::hasColumn('product_misc_fields', $column)) {
                Schema::table('product_misc_fields', function (Blueprint $table) use ($column) {
                    $table->text($column)->nullable()->after('product_id');
                });
            }
        });

        // When a custom field is deleted
        static::deleted(function ($field) {
            $column = strtolower($field->customField);

            if (Schema::hasColumn('product_misc_fields', $column)) {
                Schema::table('product_misc_fields', function (Blueprint $table) use ($column) {
                    $table->dropColumn($column);
                });
            }
        });
    }
}
