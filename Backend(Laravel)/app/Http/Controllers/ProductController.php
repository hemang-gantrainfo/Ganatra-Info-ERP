<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use App\Models\FieldMapping;
use App\Models\Product;
use App\Models\ProductCustomField;
use App\Models\ProductImage;
use App\Models\ProductMiscField;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;

class ProductController extends Controller
{
    /**
     * Display a listing of the resource.
     */

    public function index(Request $request)
    {
        $perPage = $request->query('per_page', 10);

        $query = Product::with('images', 'miscField', 'variants')->whereNull('deleted_at');

        if ($request->filled('brand')) {
            $brandInput = $request->input('brand');

            // if numeric, fetch brand name
            // ❌ If brand is an integer, return error
            if (is_numeric($brandInput)) {
                return response()->json([
                    'message' => 'Invalid brand filter: please provide brand name, not ID.'
                ], 400);
            }

            // ✅ Proceed if brand is a valid name
            $brand = Brand::where('name', 'LIKE', '%' . $brandInput . '%')->value('id');

            if ($brand) {
                $query->where('brand', $brand);
            } else {
                // If brand name doesn't exist
                return response()->json([
                    'message' => 'Brand not found.'
                ], 404);
            }
        }

        if ($request->filled('sku')) {
            $query->where('sku', 'LIKE', '%' . $request->sku . '%');
        }

        if ($request->filled('name')) {
            $query->where('name', 'LIKE', '%' . $request->name . '%');
        }

        if ($request->filled('active')) {
            // $query->where('active', $request->active);
            $active = (int) $request->active;
            if ($active !== 2) {
                $query->where('active', $active);
            }
        }

        if ($request->filled('parentsku')) {
            $parentSku = $request->parentsku;

            // Find parent by sku
            $parent = Product::where('sku', 'LIKE', '%' . $parentSku . '%')->first();

            if ($parent) {
                // Get parent + its variants
                $query->where(function ($q) use ($parent, $parentSku) {
                    $q->where('id', $parent->id)
                        ->orWhere('parent_id', $parent->id);
                });
            } else {
                // Maybe parent doesn't exist but variants exist
                $query->where('parent_id', $parentSku);
            }
        }

        if ($request->filled('min_qty') && $request->filled('max_qty')) {
            $min = (float) $request->input('min_qty');
            $max = (float) $request->input('max_qty');

            $query->whereRaw('CAST(COALESCE(qty, 0) AS DECIMAL(10,2)) BETWEEN ? AND ? AND parent_id IS NOT NULL', [$min, $max]);
        } elseif ($request->filled('min_qty')) {
            $min = (float) $request->input('min_qty');
            $query->whereRaw('CAST(COALESCE(qty, 0) AS DECIMAL(10,2)) >= ?', [$min]);
        } elseif ($request->filled('max_qty')) {
            $max = (float) $request->input('max_qty');
            $query->whereRaw('CAST(COALESCE(qty, 0) AS DECIMAL(10,2)) <= ?', [$max]);
        }


        $products = $query->paginate($perPage);

        $data = $products->map(function ($product) {
            $productArray = $product->toArray();
            unset($productArray['misc_field']); // remove the misc_field array
            // --- Merge misc fields ---
            if ($product->miscField->isNotEmpty()) {
                // If you have one miscField per product, use the first one
                $misc = $product->miscField->first();

                foreach ($misc->getAttributes() as $key => $value) {
                    if (!in_array($key, ['id', 'product_id', 'created_at', 'updated_at'])) {
                        $productArray[$key] = $value;
                    }
                }
            }

            // --- Add parent SKU to main product if applicable ---
            if ($product->parent_id) {
                $parent = Product::select('sku')->find($product->parent_id);
                $productArray['parentsku'] = $parent ? $parent->sku : null;
            } else {
                $productArray['parentsku'] = null;
            }

            // --- Add total variant qty ---
            $totalVariantQty = $product->variants->sum('qty');
            $productArray['total_qty'] = $totalVariantQty;

            // Merge variants
            $productArray['variants'] = $product->variants->map(function ($variant) use ($product) {
                $v = $variant->toArray();
                $v['variant_options'] = $variant->variants_options ? json_decode($variant->variants_options, true) : [];
                $v['parentsku'] = $product->sku;
                return $v;
            });

            return $productArray;
        });

        return response()->json([
            'message' => 'Products retrieved successfully',
            'data' => $data,
            'pagination' => [
                'current_page' => $products->currentPage(),
                'last_page'    => $products->lastPage(),
                'per_page'     => $products->perPage(),
                'total'        => $products->total()
            ]
        ], 200);
    }


    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    // public function store(Request $request)
    // {

    //     // dd($request);
    //     // 1. Check which platform is active
    //     $settings = Setting::first();
    //     $platform = null;

    //     if ($settings->maropost_status == 1) {
    //         $platform = 'maropost';
    //     } elseif ($settings->shopify_status == 1) {
    //         $platform = 'shopify';
    //     }

    //     $rules = [];

    //     if ($platform) {
    //         // 2. Get field mappings for that platform
    //         $mappings = FieldMapping::where('platform', $platform)->get();

    //         if ($mappings->isNotEmpty()) {
    //             // 3. Prepare validation rules only for required mapped fields
    //             foreach ($mappings as $map) {
    //                 if (in_array($map->local_field, ['main_image', 'alt_images'])) {
    //                     continue;
    //                 }
    //                 $rules[$map->local_field] = !empty($map->is_required) ? 'required' : 'nullable';
    //             }
    //         }
    //     } else {
    //         // 🚨 No platform selected → enforce default required fields
    //         $rules['name'] = 'required|string|max:255';
    //         $rules['sku']  = 'required|string|max:100';
    //         $rules['qty']  = 'required|numeric|min:0';
    //     }

    //     // Always allow images
    //     $rules['images'] = 'nullable|array';
    //     $rules['images.*.image_path'] = 'nullable|string';

    //     // 4. Validate request
    //     $validator = Validator::make($request->all(), $rules);
    //     if ($validator->fails()) {
    //         return response()->json([
    //             'status' => false,
    //             'message' => 'Validation errors',
    //             'errors' => collect($validator->errors()->messages())
    //                 ->map(fn($msg) => $msg[0]) // flatten first message
    //                 ->toArray()
    //         ], 422);
    //     }

    //     // 5. Build product data
    //     $productData = $request->except('images'); // exclude images directly

    //     // 6. Insert product
    //     $product = Product::create($productData);

    //     // 7. Insert images if present
    //     if ($request->has('images')) {
    //         foreach ($request->images as $img) {
    //             $filePath = null;

    //             if (isset($img['file']) && $img['file'] instanceof \Illuminate\Http\UploadedFile) {
    //                 $fileName = time() . '_' . $img['file']->getClientOriginalName();
    //                 $img['file']->move(public_path('images/products'), $fileName);
    //                 $filePath = 'images/products/' . $fileName;
    //             } elseif (isset($img['image_path'])) {
    //                 $filePath = $img['image_path'];
    //             }

    //             if ($filePath) {
    //                 ProductImage::create([
    //                     'product_id' => $product->id,
    //                     'image_path' => $filePath,
    //                     'type'       => $img['type'] ?? null,
    //                 ]);
    //             }
    //         }
    //     }

    //     // misc fields

    //     $miscFields = collect($request->all())
    //         ->filter(fn($v, $k) => Str::startsWith($k, 'Misc'))
    //         ->toArray();

    //     if (!empty($miscFields)) {
    //         $miscData = ['product_id' => $product->id];
    //         foreach ($miscFields as $key => $value) {
    //             $column = strtolower($key);
    //             $miscData[$column] = $value;
    //         }
    //         DB::table('product_misc_fields')->insert($miscData);

    //         // Append misc fields to product object for response
    //         foreach ($miscFields as $key => $value) {
    //             $product->{$key} = $value;
    //         }
    //     }

    //     // variants

    //     $variants = $request->Variant ?? [];
    //     $variantRecords = [];

    //     foreach ($variants as $variant) {

    //         if (Product::where('sku', $variant['sku'])->exists()) {
    //             return response()->json([
    //                 'status' => false,
    //                 'message' => "Variant SKU '{$variant['sku']}' already exists",
    //             ], 422);
    //         }

    //         $variantData = [
    //             'parent_id'       => $product->id,
    //             'category_id'     => $product->category_id,
    //             'name'            => $variant['name'] ?? null,
    //             'sku'             => $variant['sku'] ?? null,
    //             'qty'             => $variant['qty'] ?? 0,
    //             'cost_price'      => $variant['cost_price'] ?? null,
    //             'description'     => $variant['description'] ?? $product->description,
    //             'variants_options' => isset($variant['option']) ? json_encode($variant['option']) : null,
    //         ];

    //         $child = Product::create($variantData);

    //         if (!empty($variant['images'])) {
    //             foreach ($variant['images'] as $img) {
    //                 $filePath = null;

    //                 if (isset($img['file']) && $img['file'] instanceof \Illuminate\Http\UploadedFile) {
    //                     $fileName = time() . '_' . $img['file']->getClientOriginalName();
    //                     $img['file']->move(public_path('images/products'), $fileName);
    //                     $filePath = 'images/products/' . $fileName;
    //                 } elseif (isset($img['image_path'])) {
    //                     $filePath = $img['image_path'];
    //                 }

    //                 if ($filePath) {
    //                     ProductImage::create([
    //                         'product_id' => $child->id,
    //                         'image_path' => $filePath,
    //                         'type'       => $img['type'] ?? null,
    //                     ]);
    //                 }
    //             }
    //         }

    //         $variantRecords[] = $child;
    //     }

    //     return response()->json([
    //         'status'   => true,
    //         'message'  => 'Product created successfully',
    //         'platform' => $platform ?? 'none',
    //         'product'  => $product->load('images'),
    //         'variants' => collect($variantRecords)->map(function ($v) {
    //             $v->variant_options = json_decode($v->variant_options, true);
    //             return $v;
    //         }),
    //     ], 201);
    // }

    public function store(Request $request)
    {
        // dd($request);
        $settings = Setting::first();
        $platform = null;

        // if (!$settings) {
        //     return response()->json([
        //         'status' => false,
        //         'message' => 'Settings not found. Please configure platform settings first.'
        //     ], 400);
        // }

        if ($settings) {
            if ($settings->maropost_status == 1) {
                $platform = 'maropost';
            } elseif ($settings->shopify_status == 1) {
                $platform = 'shopify';
            }
        } else {
            $platform = null;
        }


        // 1️⃣ Build validation rules based on platform mapping
        $rules = [];

        if ($platform) {
            $mappings = FieldMapping::where('platform', $platform)->get();

            if ($mappings->isNotEmpty()) {
                foreach ($mappings as $map) {
                    if (in_array($map->local_field, ['main_image', 'alt_images'])) {
                        continue;
                    }
                    $rules[$map->local_field] = !empty($map->is_required) ? 'required' : 'nullable';
                }
            }
        } else {
            // Default required fields if no platform mapping
            $rules['name'] = 'required|string|max:255';
            $rules['sku']  = 'required|string|max:100';
            $rules['qty']  = 'required|numeric|min:0';
        }

        // Always allow images
        $rules['images'] = 'nullable|array';
        // $rules['images.*.file'] = 'nullable|file|mimes:jpg,jpeg,png,webp|max:2048';
        $rules['images.*.image_path'] = 'nullable|string';

        // $rules['variant'] = 'nullable|array';
        // $rules['variant.*.images'] = 'nullable|array';
        // $rules['variant.*.images.*.file'] = 'nullable|file|mimes:jpg,jpeg,png,webp|max:2048';

        // $messages = [
        //     'images.*.file.mimes' => 'Only JPG, JPEG, PNG, and WEBP image formats are allowed.',
        //     'variant.*.images.*.file.mimes' => 'Only JPG, JPEG, PNG, and WEBP image formats are allowed for variant images.',
        //     'images.*.file.max' => 'Each image must not exceed 2MB.',
        //     'variant.*.images.*.file.max' => 'Each variant image must not exceed 2MB.',
        // ];

        // 2️⃣ Validate request
        // $validator = Validator::make($request->all(), $rules, $messages);
        $validator = Validator::make($request->all(), $rules);
        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation errors',
                'errors' => collect($validator->errors()->messages())->map(fn($msg) => $msg[0])->toArray()
            ], 422);
        }

        // 3️⃣ Pre-check SKUs (main + variants)
        $mainSku = $request->sku;
        $variantSkus = collect($request->Variant ?? [])->pluck('sku')->filter()->toArray();
        $allSkus = array_merge([$mainSku], $variantSkus);

        $existingSkus = Product::whereIn('sku', $allSkus)->pluck('sku')->toArray();

        if (!empty($existingSkus)) {
            return response()->json([
                'status' => false,
                'message' => 'The following SKUs already exist: ' . implode(', ', $existingSkus),
            ], 422);
        }


        // 4️⃣ Start transaction
        DB::beginTransaction();
        try {
            // Main product
            $productData = $request->except('images', 'Variant');
            $product = Product::create($productData);

            // Main images
            if ($request->has('images')) {
                foreach ($request->images as $img) {
                    $filePath = null;
                    if (isset($img['file']) && $img['file'] instanceof \Illuminate\Http\UploadedFile) {
                        // $fileName = time() . '_' . $img['file']->getClientOriginalName();
                        $uniqueName = Str::uuid() . '_' . $img['file']->getClientOriginalName();
                        $img['file']->move(public_path('images/products'), $uniqueName);
                        $filePath = 'images/products/' . $uniqueName;
                    } elseif (isset($img['image_path'])) {
                        $filePath = $img['image_path'];
                    }
                    if ($filePath) {
                        ProductImage::create([
                            'product_id' => $product->id,
                            'image_path' => $filePath,
                            'type' => $img['type'] ?? null,
                        ]);
                    }
                }
            }

            // Misc fields
            $miscFields = collect($request->all())
                ->filter(fn($v, $k) => Str::startsWith($k, 'Misc'))
                ->toArray();

            if (!empty($miscFields)) {
                $miscData = ['product_id' => $product->id];
                foreach ($miscFields as $key => $value) {
                    $miscData[strtolower($key)] = $value;
                    $product->{$key} = $value;
                }
                DB::table('product_misc_fields')->insert($miscData);
            }

            // Variants
            $variantRecords = [];
            $totalVariantQty = 0;
            foreach ($request->variant ?? [] as $variant) {
                $variantQty = (float)($variant['qty'] ?? 0);
                $totalVariantQty += $variantQty;
                $variantData = [
                    'parent_id'       => $product->id,
                    'category_id'     => $product->category_id,
                    'name'            => $variant['name'] ?? null,
                    'sku'             => $variant['sku'] ?? null,
                    'qty'             => $variantQty,
                    'cost_price'      => $variant['cost_price'] ?? null,
                    'store_price'      => $variant['store_price'] ?? null,
                    'rrp'      => $variant['rrp'] ?? null,
                    'description'     => $variant['description'] ?? $product->description,
                    'variants_options' => isset($variant['option'])
                        ? (is_string($variant['option'])
                            ? $variant['option']   // already JSON
                            : json_encode($variant['option'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE))
                        : null,
                ];

                $child = Product::create($variantData);

                // Variant images
                if (!empty($variant['images'])) {
                    foreach ($variant['images'] as $img) {
                        $filePath = null;
                        if (isset($img['file']) && $img['file'] instanceof \Illuminate\Http\UploadedFile) {
                            $fileName = time() . '_' . $img['file']->getClientOriginalName();
                            $img['file']->move(public_path('images/products'), $fileName);
                            $filePath = 'images/products/' . $fileName;
                        } elseif (isset($img['image_path'])) {
                            $filePath = $img['image_path'];
                        }
                        if ($filePath) {
                            ProductImage::create([
                                'product_id' => $child->id,
                                'image_path' => $filePath,
                                'type' => $img['type'] ?? null,
                            ]);
                        }
                    }
                }

                $variantRecords[] = $child;
            }

            if ($totalVariantQty > 0) {
                $product->qty = $totalVariantQty;
                // $product->save();
            }

            DB::commit();

            return response()->json([
                'status'   => true,
                'message'  => 'Product created successfully with variants',
                'platform' => $platform ?? 'none',
                'product'  => $product->load('images'),
                'variants' => collect($variantRecords)->map(function ($v) {
                    $v->variant_options = json_decode($v->variants_options, true);
                    return $v;
                }),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => false,
                'message' => 'Failed to create product: ' . $e->getMessage()
            ], 500);
        }
    }


    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $product = Product::with(['images', 'variants.images', 'miscField'])->whereNull('deleted_at')->find($id);

        if (!$product) {
            return response()->json([
                'error' => 'Product not found'
            ], 404);
        }

        $productArray = $product->toArray();

        // Format main product images
        $productArray['images'] = $product->images->map(function ($img) {
            return [
                'id' => $img->id,
                'image_path' => url($img->image_path), // full URL
                'type' => $img->type
            ];
        });

        // Merge misc fields
        if ($product->miscField->isNotEmpty()) {
            $misc = $product->miscField->first();
            foreach ($misc->getAttributes() as $key => $value) {
                if (!in_array($key, ['id', 'product_id', 'created_at', 'updated_at'])) {
                    $productArray[$key] = $value;
                }
            }
        }

        // Add variants
        $productArray['variants'] = $product->variants->map(function ($variant) {
            $v = $variant->toArray();

            // Format variant images
            $v['images'] = $variant->images->map(function ($img) {
                return [
                    'id' => $img->id,
                    'image_path' => url($img->image_path),
                    'type' => $img->type
                ];
            });

            // Decode variant options JSON
            $v['variant_options'] = $variant->variants_options ? json_decode($variant->variants_options, true) : [];
            return $v;
        });
        // --- Add total variant qty ---
        $totalVariantQty = $product->variants->sum('qty');
        $productArray['total_qty'] = $totalVariantQty;

        return response()->json([
            'message' => 'Product fetched successfully',
            'product' => $productArray
        ]);
    }


    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id) {}

    /**
     * Update the specified resource in storage.
     */

    // public function update(Request $request, string $id)
    // {
    //     // 1. Find the product
    //     $product = Product::find($id);
    //     if (!$product) {
    //         return response()->json(['error' => 'Product not found'], 404);
    //     }

    //     // 2. Determine active platform
    //     $settings = Setting::first();
    //     $platform = null;

    //     if ($settings->maropost_status == 1) {
    //         $platform = 'maropost';
    //     } elseif ($settings->shopify_status == 1) {
    //         $platform = 'shopify';
    //     }

    //     $rules = [];

    //     if ($platform) {
    //         // 3. Get field mappings
    //         $mappings = FieldMapping::where('platform', $platform)->get();
    //         if ($mappings->isNotEmpty()) {
    //             foreach ($mappings as $map) {
    //                 if ($map->is_required) {
    //                     // Only required if not already filled in DB
    //                     $rules[$map->api_field] = 'sometimes|required';
    //                 } else {
    //                     $rules[$map->api_field] = 'sometimes|nullable';
    //                 }
    //             }
    //         }
    //     } else {
    //         // 🚨 No platform selected → basic required fields
    //         $rules['name'] = 'sometimes|string|max:255';
    //         $rules['sku']  = 'sometimes|string|max:100';
    //         $rules['qty']  = 'sometimes|numeric|min:0';
    //     }

    //     // Always allow images
    //     $rules['images'] = 'nullable|array';
    //     $rules['images.*.file'] = 'nullable|image|mimes:jpg,jpeg,png|max:2048';
    //     $rules['images.*.type'] = 'nullable|string|in:main,alt';

    //     // Deleted images
    //     $rules['deleted_images'] = 'nullable|array';
    //     $rules['deleted_images.*'] = 'integer|exists:product_images,id';

    //     // 4. Validate request
    //     $validator = Validator::make($request->all(), $rules);
    //     if ($validator->fails()) {
    //         return response()->json([
    //             'status' => false,
    //             'message' => 'Validation errors',
    //             'errors' => collect($validator->errors()->messages())
    //                 ->map(fn($msg) => $msg[0]) // flatten
    //                 ->toArray()
    //         ], 422);
    //     }

    //     // 5. Update product fields
    //     if ($platform) {
    //         foreach ($mappings as $map) {
    //             $localField = $map->local_field;

    //             if (in_array($localField, ['image_path', 'type'])) continue;

    //             if ($request->has($map->api_field)) {
    //                 $product->{$localField} = $request->input($map->api_field);
    //             }
    //         }

    //         // Handle extra fields not in mapping
    //         $excluded = $mappings->pluck('api_field')->toArray();
    //         foreach ($request->except(array_merge($excluded, ['images', 'deleted_images'])) as $key => $value) {
    //             if (Schema::hasColumn('products', $key)) {
    //                 $product->{$key} = $value;
    //             }
    //         }
    //     } else {
    //         // No platform active → just update whatever fields exist in DB
    //         foreach ($request->except(['images', 'deleted_images']) as $key => $value) {
    //             if (Schema::hasColumn('products', $key)) {
    //                 $product->{$key} = $value;
    //             }
    //         }
    //     }

    //     $product->save();

    //     // 6. Handle images
    //     if ($request->has('images')) {
    //         foreach ($request->images as $img) {
    //             $id   = $img['id'] ?? null;
    //             $type = $img['type'] ?? 'alt';
    //             $file = $img['file'] ?? null;

    //             if ($type === 'main') {
    //                 // Make all others alt
    //                 ProductImage::where('product_id', $product->id)
    //                     ->where('id', '!=', $id)
    //                     ->update(['type' => 'alt']);
    //             }

    //             if ($id) {
    //                 // Update existing image
    //                 $productImage = ProductImage::where('id', $id)
    //                     ->where('product_id', $product->id)
    //                     ->first();

    //                 if ($productImage) {
    //                     if ($type) $productImage->type = $type;

    //                     if ($file instanceof \Illuminate\Http\UploadedFile) {
    //                         if ($productImage->image_path && file_exists(public_path($productImage->image_path))) {
    //                             unlink(public_path($productImage->image_path));
    //                         }

    //                         $fileName = time() . '_' . $file->getClientOriginalName();
    //                         $file->move(public_path('images/products'), $fileName);
    //                         $productImage->image_path = 'images/products/' . $fileName;
    //                     }

    //                     $productImage->save();
    //                 }
    //             } elseif ($file instanceof \Illuminate\Http\UploadedFile) {
    //                 // Add new image
    //                 if ($type === 'main') {
    //                     $oldMain = ProductImage::where('product_id', $product->id)
    //                         ->where('type', 'main')
    //                         ->first();
    //                     if ($oldMain) {
    //                         if ($oldMain->image_path && file_exists(public_path($oldMain->image_path))) {
    //                             unlink(public_path($oldMain->image_path));
    //                         }
    //                         $oldMain->delete();
    //                     }
    //                 }

    //                 $fileName = time() . '_' . $file->getClientOriginalName();
    //                 $file->move(public_path('images/products'), $fileName);

    //                 ProductImage::create([
    //                     'product_id' => $product->id,
    //                     'image_path' => 'images/products/' . $fileName,
    //                     'type'       => $type,
    //                 ]);
    //             }
    //         }
    //     }

    //     // 7. Handle deleted images
    //     if ($request->has('deleted_images')) {
    //         foreach ($request->deleted_images as $imgId) {
    //             $image = ProductImage::find($imgId);
    //             if ($image) {
    //                 if ($image->image_path && file_exists(public_path($image->image_path))) {
    //                     unlink(public_path($image->image_path));
    //                 }
    //                 $image->delete();
    //             }
    //         }
    //     }



    //     $miscColumns = Schema::getColumnListing('product_misc_fields'); // all misc field columns
    //     // Remove meta columns
    //     $excludedColumns = ['id', 'product_id', 'created_at', 'updated_at'];
    //     $miscColumns = array_diff($miscColumns, $excludedColumns);

    //     $miscData = [];
    //     foreach ($miscColumns as $column) {
    //         if ($request->has($column)) {
    //             $miscData[$column] = $request->input($column);
    //         }
    //     }

    //     // Update or create misc fields if any
    //     if (!empty($miscData)) {
    //         $misc = ProductMiscField::firstOrNew(['product_id' => $product->id]);
    //         foreach ($miscData as $key => $value) {
    //             $misc->{$key} = $value;
    //         }
    //         $misc->save();
    //     }

    //     $misc = ProductMiscField::where('product_id', $product->id)->first();
    //     $productArray = $product->toArray();

    //     if ($misc) {
    //         foreach ($misc->getAttributes() as $key => $value) {
    //             if (!in_array($key, ['id', 'product_id', 'created_at', 'updated_at'])) {
    //                 $productArray[$key] = $value;
    //             }
    //         }
    //     }

    //     return response()->json([
    //         'status' => true,
    //         'message' => 'Product updated successfully',
    //         'platform' => $platform ?? 'none',
    //         'product' => $productArray
    //     ], 200);
    // }

    public function update(Request $request, string $id)
    {
        $product = Product::find($id);
        if (!$product) {
            return response()->json(['status' => false, 'message' => 'Product not found'], 404);
        }

        $settings = Setting::first();
        $platform = null;

        if ($settings) {
            if ($settings->maropost_status == 1) {
                $platform = 'maropost';
            } elseif ($settings->shopify_status == 1) {
                $platform = 'shopify';
            }
        } else {
            $platform = null;
        }

        // 1️⃣ Build validation rules
        $rules = [];
        if ($platform) {
            $mappings = FieldMapping::where('platform', $platform)->get();
            if ($mappings->isNotEmpty()) {
                foreach ($mappings as $map) {
                    // $rules[$map->api_field] = $map->is_required ? 'sometimes|required' : 'sometimes|nullable';
                    $local_field = $map->local_field;
                    if ($request->has($local_field)) {
                        if ($map->is_required) {
                            $rules[$local_field] = 'required';
                        } else {
                            $rules[$local_field] = 'nullable';
                        }
                    }
                }
            }
        } else {
            $rules['name'] = 'sometimes|string|max:255';
            $rules['sku']  = 'sometimes|string|max:100';
            $rules['qty']  = 'sometimes|numeric|min:0';
        }

        $rules['images'] = 'nullable|array';
        $rules['images.*.file'] = 'nullable|image|mimes:jpg,jpeg,png|max:2048';
        $rules['images.*.type'] = 'nullable|string|in:main,alt';
        $rules['deleted_images'] = 'nullable|array';
        $rules['deleted_images.*'] = 'integer|exists:product_images,id';
        $rules['deleted_variants'] = 'nullable|array';
        $rules['deleted_variants.*'] = 'integer|exists:products,id';

        $validator = Validator::make($request->all(), $rules);
        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validation errors',
                'errors' => collect($validator->errors()->messages())->map(fn($msg) => $msg[0])->toArray()
            ], 422);
        }

        DB::beginTransaction();
        try {
            // 2️⃣ Pre-check main SKU uniqueness
            if ($request->has('sku')) {
                $skuExists = Product::where('sku', $request->sku)->where('id', '!=', $product->id)->exists();
                if ($skuExists) {
                    return response()->json([
                        'status' => false,
                        'message' => "Main product SKU '{$request->sku}' already exists",
                    ], 422);
                }
            }

            // 3️⃣ Update main product
            if ($platform && isset($mappings)) {
                foreach ($mappings as $map) {
                    $localField = $map->local_field;
                    if (in_array($localField, ['image_path', 'type'])) continue;
                    if ($request->has($map->api_field)) {
                        $product->{$localField} = $request->input($map->api_field);
                    }
                }
                // Extra fields not in mapping
                $excluded = $mappings->pluck('api_field')->toArray();
                foreach ($request->except(array_merge($excluded, ['images', 'deleted_images', 'Variant', 'deleted_variants'])) as $key => $value) {
                    if (Schema::hasColumn('products', $key)) {
                        $product->{$key} = $value;
                    }
                }
            } else {
                foreach ($request->except(['images', 'deleted_images', 'Variant', 'deleted_variants']) as $key => $value) {
                    if (Schema::hasColumn('products', $key)) {
                        $product->{$key} = $value;
                    }
                }
            }
            $product->save();

            if ($request->has('active')) {
                $activeStatus = (int) $request->input('active');
                if (is_null($product->parent_id)) {
                    // Update main and all its children
                    $product->update(['active' => $activeStatus]);
                    Product::where('parent_id', $product->id)->update(['active' => $activeStatus]);
                } else {
                    $product->update(['active' => $activeStatus]);
                }
            }

            // 4️⃣ Handle main product images
            if ($request->has('images')) {
                foreach ($request->images as $img) {
                    $imgId = $img['id'] ?? null;
                    $type = $img['type'] ?? 'alt';
                    $file = $img['file'] ?? null;

                    if ($type === 'main') {
                        ProductImage::where('product_id', $product->id)->where('id', '!=', $imgId)->update(['type' => 'alt']);
                    }

                    if ($imgId) {
                        $productImage = ProductImage::where('id', $imgId)->where('product_id', $product->id)->first();
                        if ($productImage) {
                            if ($file instanceof \Illuminate\Http\UploadedFile) {
                                if ($productImage->image_path && file_exists(public_path($productImage->image_path))) {
                                    unlink(public_path($productImage->image_path));
                                }
                                $fileName = time() . '_' . $file->getClientOriginalName();
                                $file->move(public_path('images/products'), $fileName);
                                $productImage->image_path = 'images/products/' . $fileName;
                            }
                            $productImage->type = $type;
                            $productImage->save();
                        }
                    } elseif ($file instanceof \Illuminate\Http\UploadedFile) {
                        if ($type === 'main') {
                            $oldMain = ProductImage::where('product_id', $product->id)->where('type', 'main')->first();
                            if ($oldMain) {
                                if ($oldMain->image_path && file_exists(public_path($oldMain->image_path))) unlink(public_path($oldMain->image_path));
                                $oldMain->delete();
                            }
                        }
                        // $fileName = time() . '_' . $file->getClientOriginalName();
                        $fileName = Str::uuid() . '_' . $img['file']->getClientOriginalName();
                        $file->move(public_path('images/products'), $fileName);
                        ProductImage::create([
                            'product_id' => $product->id,
                            'image_path' => 'images/products/' . $fileName,
                            'type' => $type,
                        ]);
                    }
                }
            }

            // 5️⃣ Handle deleted images
            if ($request->has('deleted_images')) {
                foreach ($request->deleted_images as $imgId) {
                    $image = ProductImage::find($imgId);
                    if ($image) {
                        if ($image->image_path && file_exists(public_path($image->image_path))) unlink(public_path($image->image_path));
                        $image->delete();
                    }
                }
            }

            // 6️⃣ Handle misc fields
            $miscColumns = Schema::getColumnListing('product_misc_fields');
            $excludedColumns = ['id', 'product_id', 'created_at', 'updated_at'];
            $miscColumns = array_diff($miscColumns, $excludedColumns);

            $miscData = [];
            foreach ($miscColumns as $column) {
                foreach ($request->all() as $key => $value) {
                    if (strcasecmp($key, $column) === 0) {
                        $miscData[$column] = $value;
                    }
                }
            }

            if (!empty($miscData)) {
                $misc = ProductMiscField::firstOrNew(['product_id' => $product->id]);
                foreach ($miscData as $k => $v) $misc->{$k} = $v;
                $misc->save();
                $misc->refresh();
            }

            // 7️⃣ Handle variants
            $variants = $request->variant ?? [];

            foreach ($variants as $variantData) {
                $variantId = $variantData['id'] ?? null;
                $variantSku = $variantData['sku'] ?? null;

                $variant = null;
                if ($variantId) {
                    $variant = Product::where('id', $variantId)
                        ->where('parent_id', $product->id)
                        ->first();
                }

                if (!$variant && $variantSku) {
                    $variant = Product::where('sku', $variantSku)
                        ->where('parent_id', $product->id)
                        ->first();
                }

                // SKU uniqueness check
                if ($variantSku && Product::where('sku', $variantSku)->where('id', '!=', $variant?->id)->exists()) {
                    DB::rollBack();
                    return response()->json([
                        'status' => false,
                        'message' => "Variant SKU '{$variantSku}' already exists",
                    ], 422);
                }

                // dd($variant);

                // if ($variant) {
                //     $existingOptions = $variant->variants_options ? json_decode($variant->variants_options, true) : [];
                //     // New options from request
                //     $newOptions = $variantData['option'] ?? [];
                //     if (is_string($newOptions)) {
                //         $newOptions = json_decode($newOptions, true) ?: [];
                //     }
                //     $mergedOptions = array_merge($existingOptions, $newOptions);
                //     // Update existing variant
                //     $variant->update([
                //         'name' => $variantData['name'] ?? $variant->name,
                //         'sku' => $variantSku ?? $variant->sku,
                //         'qty' => $variantData['qty'] ?? $variant->qty,
                //         'cost_price' => $variantData['cost_price'] ?? $variant->cost_price,
                //         'description' => $variantData['description'] ?? $variant->description,
                //         'variants_options' => !empty($mergedOptions)
                //             ? json_encode($mergedOptions, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
                //             : null
                //     ]);
                // } else {
                //     // Create new variant

                //     $newOptions = $variantData['option'] ?? [];
                //     if (is_string($newOptions)) {
                //         $newOptions = json_decode($newOptions, true) ?: [];
                //     }
                //     $variant = Product::create([
                //         'parent_id' => $product->id,
                //         'category_id' => $product->category_id,
                //         'name' => $variantData['name'] ?? null,
                //         'sku' => $variantSku,
                //         'qty' => $variantData['qty'] ?? 0,
                //         'cost_price' => $variantData['cost_price'] ?? null,
                //         'description' => $variantData['description'] ?? $product->description,
                //         'variants_options' => !empty($newOptions)
                //             ? json_encode($newOptions, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
                //             : null,
                //     ]);
                // }

                if ($variant) {
                    // Existing variant found
                    $existingOptions = $variant->variants_options ? json_decode($variant->variants_options, true) : [];

                    // New options from request
                    $newOptions = $variantData['option'] ?? [];
                    if (is_string($newOptions)) {
                        $newOptions = json_decode($newOptions, true) ?: [];
                    }

                    // ✅ Replace variant options fully with the new ones
                    // Remove keys not sent by user
                    $updatedOptions = [];
                    foreach ($newOptions as $key => $value) {
                        $updatedOptions[$key] = $value;
                    }

                    // Update variant data
                    $variant->update([
                        'name' => $variantData['name'] ?? $variant->name,
                        'sku' => $variantSku ?? $variant->sku,
                        'qty' => $variantData['qty'] ?? $variant->qty,
                        'cost_price' => $variantData['cost_price'] ?? $variant->cost_price,
                        'store_price' => $variantData['store_price'] ?? $variant->store_price,
                        'rrp' => $variantData['rrp'] ?? $variant->rrp,
                        'description' => $variantData['description'] ?? $variant->description,
                        'variants_options' => !empty($updatedOptions)
                            ? json_encode($updatedOptions, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
                            : null,
                    ]);
                } else {
                    // Create new variant
                    $newOptions = $variantData['option'] ?? [];
                    if (is_string($newOptions)) {
                        $newOptions = json_decode($newOptions, true) ?: [];
                    }

                    $variant = Product::create([
                        'parent_id' => $product->id,
                        'category_id' => $product->category_id,
                        'name' => $variantData['name'] ?? null,
                        'sku' => $variantSku,
                        'qty' => $variantData['qty'] ?? 0,
                        'cost_price' => $variantData['cost_price'] ?? null,
                        'store_price' => $variantData['store_price'] ?? null,
                        'rrp' => $variantData['rrp'] ?? null,
                        'description' => $variantData['description'] ?? $product->description,
                        'variants_options' => !empty($newOptions)
                            ? json_encode($newOptions, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
                            : null,
                    ]);
                }
                $variantId = $variant->id;

                // Variant images
                if (!empty($variantData['images'])) {
                    foreach ($variantData['images'] as $img) {
                        $imgId = $img['id'] ?? null;
                        $type = $img['type'] ?? 'alt';
                        $file = $img['file'] ?? null;

                        if ($imgId) {
                            $variantImage = ProductImage::where('id', $imgId)->where('product_id', $variantId)->first();
                            if ($variantImage) {
                                if ($file instanceof \Illuminate\Http\UploadedFile) {
                                    if ($variantImage->image_path && file_exists(public_path($variantImage->image_path))) unlink(public_path($variantImage->image_path));
                                    // $fileName = time() . '_' . $file->getClientOriginalName();
                                    $fileName = Str::uuid() . '_' . $img['file']->getClientOriginalName();
                                    $file->move(public_path('images/products'), $fileName);
                                    $variantImage->image_path = 'images/products/' . $fileName;
                                }
                                $variantImage->type = $type;
                                $variantImage->save();
                            }
                        } elseif ($file instanceof \Illuminate\Http\UploadedFile) {
                            // $fileName = time() . '_' . $file->getClientOriginalName();
                            $fileName = Str::uuid() . '_' . $img['file']->getClientOriginalName();
                            $file->move(public_path('images/products'), $fileName);
                            ProductImage::create([
                                'product_id' => $variantId,
                                'image_path' => 'images/products/' . $fileName,
                                'type' => $type,
                            ]);
                        }
                    }
                }
            }

            // 8️⃣ Handle deleted variants
            if ($request->has('deleted_variants')) {
                foreach ($request->deleted_variants as $delId) {
                    $variant = Product::where('id', $delId)->where('parent_id', $product->id)->first();
                    if ($variant) {
                        foreach ($variant->images as $img) {
                            if ($img->image_path && file_exists(public_path($img->image_path))) unlink(public_path($img->image_path));
                            $img->delete();
                        }
                        $variant->delete();
                    }
                }
            }

            $totalVariantQty = Product::where('parent_id', $product->id)->sum('qty');
            if ($totalVariantQty > 0) {
                $product->update(['qty' => $totalVariantQty]);
            } else {
                $product->update(['qty' => 0]); // set to zero when no variants remain
            }
            DB::commit();

            $productArray = $product->toArray();

            $misc = ProductMiscField::where('product_id', $product->id)->first();
            if (isset($misc) && $misc->exists) {
                $miscData = $misc->toArray();
                unset($miscData['id'], $miscData['product_id'], $miscData['created_at'], $miscData['updated_at']);
                // Merge misc fields directly into product array
                $productArray = array_merge($productArray, $miscData);
            }

            $productArray['variants'] = $product->variants()->with('images')->get()->map(function ($v) {
                $v->variant_options = json_decode($v->variants_options, true);
                return $v;
            });

            return response()->json([
                'status' => true,
                'message' => 'Product updated successfully',
                'platform' => $platform ?? 'none',
                'product' => $productArray,
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => false,
                'message' => 'Failed to update product: ' . $e->getMessage()
            ], 500);
        }
    }



    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $product = Product::with('images')->find($id);
        if (!$product) return response()->json(['error' => 'Product not found'], 404);

        $isMainProduct = is_null($product->parent_id);

        foreach ($product->images as $image) {
            $imagePath = public_path($image->image_path);
            if (file_exists($imagePath)) {
                unlink($imagePath); // delete file from public/images/products
            }
        }

        $product->images()->delete();
        $product->delete();

        // --- If deleted product was main ---
        if ($isMainProduct) {
            Product::where('parent_id', $id)->update([
                'parent_id' => null
            ]);
        }

        return response()->json(['message' => 'Product and images deleted successfully'], 200);
    }


    public function productcolumns()
    {
        $defaultFields = [
            'maropost' => ['Name', 'Subtitle', 'SKU', 'Brand', 'ParentSKU', 'Description', 'RRP', 'CostPrice', 'Promo Start', 'Promo End', 'ItemHeight', 'ItemLength', 'ItemWidth', 'CubicWeight', 'Categorisation', 'main_image', 'Stock', 'Promo price', 'alt_images'],
            'shopify'  => ['sku', 'title', 'bodyHtml', 'handle', 'vendor', 'product_type', 'handle', 'status', 'tags', 'images', 'image', 'options', 'product_id', 'barcode']
        ];

        $settings = Setting::first();

        if (!$settings) {
            return response()->json([
                'message' => 'Settings not configured.',
                'product_columns' => [],
                'ecommerce_fields' => []
            ]);
        }

        // Get all columns from products table
        $columns = Schema::getColumnListing('products');
        $filteredColumns = array_values(array_diff($columns, ['id', 'created_at', 'updated_at', 'deleted_at']));
        $filteredColumns = array_merge($filteredColumns, ['main_image', ' ']);

        $miscFields = ProductCustomField::pluck('customfield')->toArray();

        $mergedColumns = array_merge($filteredColumns, $miscFields);

        // Decode ecommerce fields JSON from DB (if exists)
        $ecommerceFields = !empty($settings->ecommerce_fields)
            ? json_decode($settings->ecommerce_fields, true)
            : $defaultFields;

        $activeFields = [];

        // Check Maropost
        if ($settings->maropost_status == 1) {
            $activeFields['maropost'] = $ecommerceFields['maropost'] ?? $defaultFields['maropost'];
        }

        //  Check Shopify
        if ($settings->shopify_status == 1) {
            $activeFields['shopify'] = $ecommerceFields['shopify'] ?? $defaultFields['shopify'];
        }


        // If no platforms are active
        if (empty($activeFields)) {
            return response()->json([
                'message' => 'No ecommerce platform is active.',
                'product_columns' => [],
                'ecommerce_fields' => []
            ]);
        }

        return response()->json([
            'message' => 'Active ecommerce fields and product columns fetched successfully.',
            'product_columns' => $mergedColumns,
            'ecommerce_fields' => $activeFields
        ]);
    }

    // bulk deleted

    public function bulkProductDelete(Request $request)
    {

        $bulkDeleted = $request->input('bulk_deleted_product_id');
        $unselectIds = $request->input('unselectproductid', []);

        if ($bulkDeleted === 'all') {
            $query = Product::query();

            if (!empty($unselectIds)) {
                $query->whereNotIn('id', $unselectIds);
            }

            // Get IDs being deleted
            $deletedIds = $query->pluck('id')->toArray();

            // Soft delete them
            $query->delete();

            return response()->json([
                'message'     => 'Products soft deleted successfully (EXCEPT unselected)',
                'deleted_ids' => $deletedIds,
                'skipped_ids' => $unselectIds,
            ]);
        }


        $validated = $request->validate([
            'bulk_deleted_product_id' => 'required|array',
            'bulk_deleted_product_id.*' => 'integer|exists:products,id',
        ]);

        $productIds = $validated['bulk_deleted_product_id'];

        // dd($productIds);

        Product::whereIn('id', $productIds)->delete();

        return response()->json([
            'message' => 'Products soft deleted successfully',
            'deleted_ids' => $productIds,
        ]);
    }


    public function getVariantValues(Request $request)
    {


        $request->validate([
            'option_name' => 'required|string'
        ]);

        $key = $request->input('option_name');

        $products = Product::pluck('variants_options');

        $values = [];

        foreach ($products as $variantJson) {
            $options = json_decode($variantJson, true);
            if (is_array($options) && isset($options[$key])) {
                $values[] = $options[$key];
            }
        }
        $values = array_values(array_unique($values));

        if (empty($values)) {
            return response()->json([
                'status' => false,
                'message' => "No values found for key '{$key}'",
                'data' => []
            ], 404);
        }

        return response()->json([
            'status' => true,
            'message' => 'Values fetched successfully',
            'data' => $values
        ]);
    }

    public function getVariantKeys()
    {
        // Fetch only variant_options column from all products
        $products = Product::pluck('variants_options');

        $allKeys = [];

        foreach ($products as $variantJson) {
            $options = json_decode($variantJson, true);
            if (is_array($options)) {
                $allKeys = array_merge($allKeys, array_keys($options));
            }
        }

        // Remove duplicates and reindex
        $allKeys = array_values(array_unique($allKeys));

        return response()->json([
            'status' => true,
            'message' => 'All keys fetched successfully',
            'data' => $allKeys
        ]);
    }
}
