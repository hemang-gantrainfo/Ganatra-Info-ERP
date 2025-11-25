<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class ClearDatabaseController extends Controller
{

    public function clearData()
    {
        $protectedUserId = 1;

        $csvFullPath = public_path('product.csv');

        // Check file exists
        if (!File::exists($csvFullPath)) {
            return response()->json([
                'status' => false,
                'message' => "CSV file not found: {$csvFullPath}"
            ], 404);
        }

        // Disable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        $tables = [
            'products',
            'categories',
            'brands',
            'product_images'
        ];

        foreach ($tables as $table) {
            DB::table($table)->truncate();
        }

        User::where('role', '!=', 'superadmin')->delete();

        // Re-enable FK checks
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        $productImagesPath = public_path('images/products');
        if (File::exists($productImagesPath)) {
            File::deleteDirectory($productImagesPath); // remove everything
            File::makeDirectory($productImagesPath, 0755, true); // recreate
        }

        $symfonyFile = new \Symfony\Component\HttpFoundation\File\UploadedFile(
            $csvFullPath,
            'product.csv',
            'text/csv',
            null,
            true
        );

        $file = \Illuminate\Http\UploadedFile::createFromBase($symfonyFile, true);

        // Prepare request for import controller
        $request = new \Illuminate\Http\Request([
            'read_mode' => 'delete_and_add'
        ]);

        $request->files->set('csv_file', $file);

        // Directly call your import method (NO HTTP request!)
        $importResponse = app(\App\Http\Controllers\ProductImportController::class)
            ->importCSV($request);

        return response()->json([
            'status' => true,
            'message' => 'Data cleared and CSV import completed successfully',
            'csv_used' => $csvFullPath,
            'import_response' => $importResponse
        ]);
    }
}
