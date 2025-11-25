<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BrandController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ClearDatabaseController;
use App\Http\Controllers\EcommerceFieldMappingController;
use App\Http\Controllers\EcommercePlatformController;
use App\Http\Controllers\FieldMappingController;
use App\Http\Controllers\MaropostProductSyncController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProductCustomFieldController;
use App\Http\Controllers\ProductExportController;
use App\Http\Controllers\ProductImportController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\SyncProductMaropostController;
use App\Http\Controllers\SyncProductShopifyController;

Route::post('/admin-register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/check-user', [AuthController::class, 'checkUser']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::get('/user/{id}', [AuthController::class, 'user']);
    Route::put('/user/{id}', [AuthController::class, 'update']);
    Route::delete('/user/{id}', [AuthController::class, 'destroy']);
    Route::post('/logout', [AuthController::class, 'logout']);
});


Route::get('product-fields', [ProductController::class, 'productcolumns']);
Route::apiResource('/field-mappings', FieldMappingController::class);


// settings
Route::get('/settings', [SettingController::class, 'index']);
Route::post('/settings', [SettingController::class, 'store']);
Route::put('/settings/{platform}', [SettingController::class, 'updatePlatform']);

// category api
Route::apiResource('categories', CategoryController::class);

// brand api
Route::apiResource('brands', BrandController::class);


// product api
Route::apiResource('products', ProductController::class);
Route::post('/products/bulk-delete', [ProductController::class, 'bulkProductDelete']);
Route::post('/variants-options', [ProductController::class, 'getVariantValues']);
Route::get('/variant-keys', [ProductController::class, 'getVariantKeys']);



Route::post('/custom-fields', [ProductCustomFieldController::class, 'store']);
Route::get('/custom-fields', [ProductCustomFieldController::class, 'showAll']);
Route::put('/custom-fields/{id}', [ProductCustomFieldController::class, 'update']);
Route::delete('/custom-fields/{id}', [ProductCustomFieldController::class, 'destroy']);
Route::get('/custom-fields/list', [ProductCustomFieldController::class, 'index']);

// product import export
Route::post('/export-products', [ProductExportController::class, 'exportProductsCSV']);
Route::post('/import-products', [ProductImportController::class, 'importCSV']);
Route::get('/productsfieldlist', [ProductExportController::class, 'productsFieldList']);

// Route::post('products/{product}/images', [ProductController::class, 'uploadImages']);
// Route::delete('products/{product}/images/{image}', [ProductController::class, 'deleteImage']);

// order api
Route::get("/order-sync", [OrderController::class, 'syncOrder']);
Route::get("/getorder", [OrderController::class, 'index']);
Route::get("/getorder/{id}", [OrderController::class, 'show']);



// product sync api 
Route::post('/syncproduct', [SyncProductMaropostController::class, 'syncProductsToMaropost']);
Route::post('/syncproductshopify', [SyncProductShopifyController::class, 'syncProductsToShopify']);
Route::post('/clear', [ClearDatabaseController::class, 'clearData']);
