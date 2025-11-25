<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProductExportController extends Controller
{
    public function exportProductsCSV(Request $request)
    {

        // Define all available columns
        $allFields = [
            'id',
            'parent_id',
            'category_id',
            'name',
            'subtitle',
            'sku',
            'brand',
            'qty',
            'description',
            'promo_start',
            'promo_end',
            'width',
            'store_price',
            'length',
            'height',
            'cubic',
            'rrp',
            'cost_price',
            'promo_price',
            'active',
            'approved',
            'variants_options',
            'maropost_sync',
            'shopify_sync',
            'seo_title',
            'seo_description',
            // 'created_at',
            // 'updated_at'
        ];

        $fieldAliases = [
            'category' => 'category_id',
            'brand'    => 'brand',
            // add more aliases here if needed
        ];
        // Get request inputs
        $fieldsType = $request->input('fields'); // "all" or "selected"
        $selectedFields = $request->input('selected_fields', []); // e.g. ["sku","name","brand"]
        $productIds = $request->input('pids', []);


        if ($fieldsType === 'all') {
            $fieldsToSelect = $allFields;
        } elseif ($fieldsType === 'selected') {
            $selectedFields = array_map(function ($field) use ($fieldAliases) {
                return $fieldAliases[$field] ?? $field;
            }, $selectedFields);
            // Validate selected fields
            $invalidFields = array_diff($selectedFields, $allFields);

            if (!empty($invalidFields)) {
                return response()->json([
                    'message' => 'Invalid fields requested',
                    'invalid_fields' => array_values($invalidFields)
                ], 400);
            }

            $fieldsToSelect = $selectedFields;
        } else {
            return response()->json([
                'message' => 'Invalid value for "fields". Must be "all" or "selected".'
            ], 400);
        }

        // Build query
        $query = Product::query()->select($fieldsToSelect);


        // Filter by IDs
        if (!empty($productIds)) {
            $query->whereIn('id', $productIds);
        }

        $with = [];
        if (in_array('category_id', $fieldsToSelect)) {
            $with[] = 'category:id,name';
        }
        if (in_array('brand', $fieldsToSelect)) {
            $with[] = 'brandRelation:id,name';
        }
        if (!empty($with)) {
            $query->with($with);
        }

        $products = $query->get()->map(function ($product) use ($fieldsToSelect) {
            $data = $product->only($fieldsToSelect);

            // ✅ Replace category_id with category name
            if (isset($data['category_id'])) {
                $data['category'] = $product->category?->name ?? null;
                unset($data['category_id']);
            }

            // ✅ Replace brand ID with brand name
            if (isset($data['brand'])) {
                $data['brand'] = $product->brandRelation?->name ?? null;
            }

            // Parent sku
            if (!empty($product->parent_id)) {
                $parent = Product::select('sku')->find($product->parent_id);
                $data['parent_sku'] = $parent?->sku ?? null;
            } else {
                $data['parent_sku'] = null;
            }


            // Total qty
            if (empty($product->parent_id)) {
                $data['total_qty'] = $product->variants->sum('qty');
            } else {
                $data['total_qty'] = null;
            }

            return $data;
        });

        return response()->json([
            'message' => 'Product data retrieved successfully',
            'headers_fields' => $fieldsToSelect,
            'count' => $products->count(),
            'product_data' => $products
        ], 200);
    }


    public function productsFieldList()
    {
        $columns = Schema::getColumnListing('products');
        $columns = array_map(function ($column) {
            if ($column === 'category_id') {
                return 'category';
            }
            if ($column === 'brand') {
                return 'brand';
            }
            return $column;
        }, $columns);
        $exclude = ['deleted_at', 'created_at', 'updated_at', 'custom_fields', 'shopify_sync', 'maropost_sync', 'approved', 'parent_id'];
        $filtered = array_values(array_diff($columns, $exclude));
        return response()->json([
            'status' => true,
            'columnslist' => $filtered
        ]);
    }
}
