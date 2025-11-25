<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;



class ProductImportController extends Controller
{

    public function importCSV(Request $request)

    {
        set_time_limit(0);
        ini_set('max_execution_time', 0);
        ini_set('memory_limit', '1024M');
        try {

            $validator = Validator::make($request->all(), [
                'read_mode' => 'required|in:add_only,update_only,delete_and_add',
                'csv_file' => 'required|file|max:1024|mimetypes:text/plain,text/csv,text/x-csv,application/csv,application/vnd.ms-excel',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Invalid request',
                    'errors' => $validator->errors()
                ], 422);
            }

            $file = $request->file('csv_file');
            $mode = $request->input('read_mode');

            $header = null;
            $data = [];
            $skippedRows = [];

            // ----------------------------
            // 1️⃣ Read CSV safely
            // ----------------------------
            if (($handle = fopen($file->getRealPath(), 'r')) !== false) {
                $rowIndex = 0;
                while (($row = fgetcsv($handle, 1000, ',', '"')) !== false) {
                    $rowIndex++;

                    if (!$row || count(array_filter($row)) === 0) continue;

                    if (!$header) {
                        $header = array_map('trim', $row);
                        continue;
                    }

                    if (count($row) !== count($header)) {
                        $skippedRows[] = $rowIndex;
                        continue;
                    }

                    $data[] = array_combine($header, $row);
                }
                fclose($handle);
            }

            if (empty($data)) {
                return response()->json([
                    'message' => 'No valid rows found in CSV',
                    'skipped_rows' => $skippedRows
                ], 422);
            }

            $tableColumns = Schema::getColumnListing('products');
            $added = $updated = [];
            $csvSkus = [];
            $skippedRowsDueToMissingSku = [];

            // $data = array_slice($data, 0, 25);

            // ----------------------------
            // 2️⃣ Handle truncate mode
            // ----------------------------
            if ($mode === 'delete_and_add') {
                DB::statement('SET FOREIGN_KEY_CHECKS=0');
                if (Schema::hasTable('product_images')) DB::table('product_images')->truncate();
                if (Schema::hasTable('product_variants')) DB::table('product_variants')->truncate();
                DB::table('products')->truncate();
                DB::statement('SET FOREIGN_KEY_CHECKS=1');
            }

            // dd($data);

            // ----------------------------
            // 3️⃣ Process each row
            // ----------------------------
            foreach ($data as  $index => $row) {
                foreach ($row as $key => $value) {
                    $row[$key] = $value === '' ? null : trim($value);
                }

                // ✅ Skip validation for update_only mode
                if ($mode !== 'update_only') {
                    // Parent or variant?
                    $isVariant = !empty($row['parent_sku']);

                    // Basic rules
                    $rules = [
                        'sku'  => 'required|string',
                        'name' => 'required|string',
                    ];

                    if ($isVariant) {
                        // Variant products require cost_price and qty
                        $rules['cost_price'] = 'required|numeric';
                        $rules['qty'] = 'required|numeric';
                    }

                    // Validate row
                    $validator = Validator::make($row, $rules);

                    if ($validator->fails()) {
                        $skippedRowsDueToMissingSku[] = [
                            'row' => $index + 2, // CSV row (1-based + header)
                            'missing_fields' => $validator->errors()->keys()
                        ];
                        continue;
                    }
                }

                if (empty($row['sku'])) {
                    $skippedRowsDueToMissingSku[] = [
                        'row' => $index + 2,
                        'missing_fields' => ['sku']
                    ];
                    continue;
                }

                $csvSkus[] = $row['sku'];

                if (isset($row['active'])) {
                    $val = strtolower(trim($row['active']));
                    if (in_array($val, ['true', '1', 'yes', 'y'], true)) {
                        $row['active'] = 1;
                    } elseif (in_array($val, ['false', '0', 'no', 'n'], true)) {
                        $row['active'] = 0;
                    } else {
                        $row['active'] = null; // optional fallback
                    }
                }

                // if (empty($row['sku'])) {
                //     $skippedRowsDueToMissingSku[] = $index + 2; // +2 (header + 1-based index)
                //     continue;
                // }
                // $csvSkus[] = $row['sku'];

                // Handle category
                if (isset($row['category']) && $row['category']) {
                    $category = Category::firstOrCreate(['name' => $row['category']], ['parent_id' => null]);
                    $row['category_id'] = $category->id;
                    unset($row['category']);
                }

                // Handle brand
                if (isset($row['brand']) && $row['brand']) {
                    $brand = Brand::firstOrCreate(['name' => $row['brand']]);
                    $row['brand'] = $brand->id;
                }



                // handle new variant system

                $variantOptions = [];
                foreach ($row as $key => $value) {
                    if (preg_match('/^option\d+_name$/', $key) && !empty($value)) {
                        $num = filter_var($key, FILTER_SANITIZE_NUMBER_INT);
                        $nameKey = "option{$num}_name";
                        $valueKey = "option{$num}_value";

                        if (!empty($row[$valueKey])) {
                            $variantOptions[trim($row[$nameKey])] = trim($row[$valueKey]);
                        }
                    }
                }
                $row['variants_options'] = !empty($variantOptions) ? json_encode($variantOptions) : null;

                // Remove all option columns from row
                foreach (array_keys($row) as $key) {
                    if (preg_match('/^option\d+_(name|value)$/', $key)) {
                        unset($row[$key]);
                    }
                }

                // Handle parent
                $parentId = null;
                if (!empty($row['parent_sku'])) {
                    $parent = Product::where('sku', $row['parent_sku'])->first();
                    if ($parent) $parentId = $parent->id;
                }
                $row['parent_id'] = $parentId;
                unset($row['parent_sku']);

                // Filter only DB columns
                $filteredData = array_intersect_key($row, array_flip($tableColumns));


                if ($mode === 'add_only') {


                    // ✅ Only add new products, skip if exists
                    $existing = Product::withTrashed()->where('sku', $row['sku'])->first();

                    if ($existing) {
                        // Skip updating existing product
                        continue;
                    }

                    $product = Product::create($filteredData);
                    $added[] = $row['sku'];
                } elseif ($mode === 'update_only') {

                    $product = Product::withTrashed()->where('sku', $row['sku'])->first();

                    if (!$product) {
                        // Skip new insert
                        continue;
                    }

                    $updateFields = array_filter($filteredData, function ($value) {
                        return !is_null($value); // ignore nulls
                    });

                    $product->update($updateFields);
                    $updated[] = $row['sku'];
                } elseif ($mode === 'delete_and_add') {
                    Product::withTrashed()->where('sku', $row['sku'])->forceDelete();

                    $product = Product::updateOrCreate(
                        ['sku' => $row['sku']],
                        $filteredData
                    );
                    $added[] = $row['sku'];
                }

                // ==============================
                // Handle IMAGES (main & alt)
                // ==============================
                if (!empty($row['main_image'])) {
                    $mainPath = $this->downloadImage($row['main_image'], $product->sku, 'main');
                    if ($mainPath) {
                        DB::table('product_images')->updateOrInsert(
                            ['product_id' => $product->id, 'type' => 'main'],
                            ['image_path' => $mainPath]
                        );
                    }
                }

                if (!empty($row['alt_images'])) {
                    $altImages = explode('|', $row['alt_images']);
                    foreach ($altImages as $imgURL) {
                        $altPath = $this->downloadImage(trim($imgURL), $product->sku, 'alt');
                        if ($altPath) {
                            DB::table('product_images')->insert([
                                'product_id' => $product->id,
                                'image_path' => $altPath,
                                'type' => 'alt',
                                'created_at' => now(),
                                'updated_at' => now()
                            ]);
                        }
                    }
                }

                // $added[] = $row['sku'];
            }

            return response()->json([
                'message' => 'CSV imported successfully',
                'mode' => $mode,
                'added' => $added,
                'updated' => $updated,
                'skipped_rows_due_to_column_mismatch' => $skippedRows,
                'skipped_rows_due_to_missing_sku' => $skippedRowsDueToMissingSku,
                'product_added' => count($added),
                'product_updated' => count($updated),
            ]);
        } catch (\Throwable $e) {
            // 🔥 Catch any server error (DB, IO, code error)
            return response()->json([
                'status' => false,
                'message' => 'Server error occurred during import',
                'error' => $e->getMessage(),   // optional, remove in production if sensitive
                'trace' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }

    // ----------------------------
    // Helper: Download image safely
    // ----------------------------
    private function downloadImage($url, $sku, $type = 'main')
    {
        try {
            if (empty($url)) return null;

            // local image

            $parsed = parse_url($url);

            if (
                isset($parsed['host']) &&
                in_array($parsed['host'], ['127.0.0.1', 'localhost'])
            ) {
                // Convert "/testing_images/file.png"
                $localRelativePath = $parsed['path'];

                // Decode %20 → space
                $localRelativePath = urldecode($localRelativePath);

                // Build real absolute filesystem path
                $localPath = public_path(ltrim($localRelativePath, '/'));

                if (file_exists($localPath)) {

                    $ext = pathinfo($localPath, PATHINFO_EXTENSION);

                    $folder = public_path("images/products/{$sku}");
                    if (!is_dir($folder)) mkdir($folder, 0755, true);

                    $filename = "{$type}_" . time() . '.' . strtolower($ext);
                    $target = "{$folder}/{$filename}";

                    copy($localPath, $target);

                    return "images/products/{$sku}/{$filename}";
                }
            }

            // remote images

            $headers = @get_headers($url, 1);
            if (!$headers || strpos($headers[0], '200') === false) return null;

            $info = pathinfo(parse_url($url, PHP_URL_PATH));
            $ext = strtolower($info['extension'] ?? '');

            if (!in_array($ext, ['jpg', 'jpeg', 'png'])) return null;

            $folder = public_path("images/products/{$sku}");
            if (!is_dir($folder)) mkdir($folder, 0755, true);

            $filename = "{$type}_" . time() . '.' . $ext;
            $filePath = "{$folder}/{$filename}";

            $imageContent = @file_get_contents($url);
            if (!$imageContent) return null;

            file_put_contents($filePath, $imageContent);

            return "images/products/{$sku}/{$filename}";
        } catch (\Exception $e) {
            return null;
        }
    }
}
