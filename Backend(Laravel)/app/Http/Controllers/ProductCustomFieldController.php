<?php

namespace App\Http\Controllers;

use App\Models\ProductCustomField;
use Illuminate\Http\Request;

class ProductCustomFieldController extends Controller
{
    // Save selected fields
    public function store(Request $request)
    {
        $validated = $request->validate([
            'customField' => 'required|string|max:255',
            'fieldDescription' => 'nullable|string',
            'fieldName' => 'required|string|max:255',
            'fieldType' => 'required|string|max:50',
            'options' => 'nullable|string',
            'section' => 'required|string|max:100',
            'selectionType' => 'nullable|string|max:50',
            'showOnDisplayPage' => 'nullable|string|max:50',
            'showOnThumbnail' => 'nullable|string|max:50',
        ]);

        if (
            ProductCustomField::where('customField', $validated['customField'])
            ->orWhere('fieldName', $validated['fieldName'])
            ->exists()
        ) {
            return response()->json([
                'status' => false,
                'message' => 'Custom field or field name already exists'
            ], 409);
        }

        $field = ProductCustomField::create($validated);

        return response()->json([
            'status' => true,
            'message' => 'Custom field created successfully',
            'data' => $field
        ], 201);
    }

    // Get all fields with selected flag
    public function index()
    {
        $miscFields = [];
        for ($i = 1; $i <= 20; $i++) {
            $miscFields[] = "Misc" . str_pad($i, 2, "0", STR_PAD_LEFT);
        }

        // Fetch existing customField values from table
        $existingFields = ProductCustomField::pluck('customField')->toArray();

        // Remove existing misc fields from static list
        $unusedMiscFields = array_filter($miscFields, function ($field) use ($existingFields) {
            return !in_array($field, $existingFields);
        });

        // Re-index array
        $result = array_map(function ($field) {
            return ["field_name" => $field];
        }, array_values($unusedMiscFields));

        return response()->json($result);
    }


    public function update(Request $request, $id)
    {

        $field = ProductCustomField::find($id);

        if (!$field) {
            return response()->json([
                'status' => false,
                'message' => 'Custom field not found'
            ], 404);
        }

        // Validate incoming data
        $validated = $request->validate([
            'customField' => 'required|string|max:255',
            'fieldDescription' => 'nullable|string',
            'fieldName' => 'required|string|max:255',
            'fieldType' => 'nullable|string|max:50',
            'options' => 'nullable|string',
            'section' => 'nullable|string|max:100',
            'selectionType' => 'nullable|string|max:50',
            'showOnDisplayPage' => 'nullable|string|max:50',
            'showOnThumbnail' => 'nullable|string|max:50',
        ]);

        // Check for duplicates excluding the current record
        $exists = ProductCustomField::where(function ($query) use ($validated) {
            $query->where('customField', $validated['customField'])
                ->orWhere('fieldName', $validated['fieldName']);
        })
            ->where('id', '!=', $id)
            ->exists();

        if ($exists) {
            return response()->json([
                'status' => false,
                'message' => 'Custom field or field name already exists'
            ], 409);
        }

        // Update the record
        $field->update($validated);

        return response()->json([
            'status' => true,
            'message' => 'Custom field updated successfully',
            'data' => $field
        ], 200);
    }

    public function showAll($customField = null)
    {
        $records = ProductCustomField::all();

        return response()->json($records);
    }


    public function destroy($id)
    {
        $field = ProductCustomField::find($id);

        if (!$field) {
            return response()->json(['error' => 'Custom field not found'], 404);
        }

        $field->delete(); // This will trigger model event → drop column

        return response()->json([
            'status' => true,
            'message' => 'Custom field deleted and column removed successfully'
        ]);
    }
}
