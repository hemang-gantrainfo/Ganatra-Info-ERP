<?php

namespace App\Http\Controllers;

use App\Models\FieldMapping;
use App\Models\Setting;
use Illuminate\Http\Request;

class FieldMappingController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {

        $settings = Setting::first();

        $activePlatforms = [];
        if ($settings->maropost_status == 1) {
            $activePlatforms[] = 'maropost';
        }
        if ($settings->shopify_status == 1) {
            $activePlatforms[] = 'shopify';
        }
        // fetch only mappings for active platforms
        $grouped = FieldMapping::whereIn('platform', $activePlatforms)
            ->get(['id', 'platform', 'local_field', 'api_field', 'is_required'])
            ->groupBy('platform')
            ->map(function ($items) {
                return $items->map(function ($item) {
                    return $item->only(['id', 'local_field', 'api_field', 'is_required']);
                })->values();
            });

        // ✅ Add default mappings for Maropost
        // if (in_array('maropost', $activePlatforms)) {
        //     $defaultMaropost = [
        //         ['local_field' => 'sku', 'api_field' => ''],
        //         ['local_field' => 'name', 'api_field' => ''],
        //         ['local_field' => 'qty', 'api_field' => ''],
        //     ];

        //     // If Maropost exists in DB, merge defaults + DB (avoid duplicates)
        //     foreach ($defaultMaropost as $default) {
        //         FieldMapping::firstOrCreate(
        //             [
        //                 'platform' => 'maropost',
        //                 'local_field' => $default['local_field'],
        //             ],
        //             [
        //                 'api_field' => $default['api_field'] ?? null,
        //                 'is_required' => $default['is_required'] ?? 0,
        //             ]
        //         );
        //     }
        // }

        return response()->json($grouped);
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
    public function store(Request $request)
    {

        $validated = $request->validate([
            'platform' => 'required|string|in:maropost,shopify',
            'mappings' => 'required|array',
            'mappings.*.local_field' => 'required|string',
            'mappings.*.api_field' => 'required|string',
            'mappings.*.is_required' => 'required|boolean',
        ]);

        foreach ($validated['mappings'] as $map) {
            FieldMapping::updateOrCreate(
                [
                    'platform' => $validated['platform'],
                    'local_field' => $map['local_field'],
                ],
                [
                    'api_field' => $map['api_field'],
                    'is_required' => $map['is_required'],
                ]
            );
        }

        return response()->json([
            'message' => 'Field mappings saved successfully.',
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, FieldMapping $fieldMapping)
    {
        $validated = $request->validate([
            'local_field' => 'sometimes|string',
            'api_field'   => 'sometimes|string',
            'is_required' => 'sometimes|boolean',
        ]);

        $fieldMapping->update($validated);

        return response()->json([
            'message' => 'Mapping updated successfully',
            'data'    => $fieldMapping->only(['platform', 'local_field', 'api_field', 'is_required']),
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(FieldMapping $fieldMapping)
    {
        $fieldMapping->delete();

        return response()->json([
            'message' => 'Mapping deleted successfully'
        ]);
    }

    public function byPlatform($platform)
    {
        $mappings = FieldMapping::where('platform', $platform)->get(['local_field', 'api_field', 'is_required']);

        return response()->json([
            'platform' => $platform,
            'mappings' => $mappings
        ]);
    }
}
