<?php

namespace App\Http\Controllers;

use App\Models\EcommercePlatform;
use App\Models\MaropostAccess;
use App\Models\Setting;
use App\Models\ShopifyAccess;
use Illuminate\Http\Request;

class SettingController extends Controller
{

    public function index()
    {
        return response()->json([
            'settings' => Setting::first(),
            'maropost_access' => MaropostAccess::first(),
            'shopify_access' => ShopifyAccess::first(),
        ]);
    }


    public function store(Request $request)
    {
        $request->validate([
            'maropost_status' => 'nullable|boolean',
            'shopify_status' => 'nullable|boolean',
            'store_url' => 'nullable|string',
            'api_username' => 'nullable|string',
            'api_password' => 'nullable|string',
            'api_key' => 'nullable|string',
            'access_token' => 'nullable|string',
        ]);

        $settings = Setting::first();

        if (!$settings) {
            $settings = Setting::create([
                'maropost_status' => 0,
                'shopify_status' => 0,
            ]);
        }

        // Update statuses individually
        if (isset($request->maropost_status)) {
            $settings->maropost_status = $request->maropost_status;
        }
        if (isset($request->shopify_status)) {
            $settings->shopify_status = $request->shopify_status;
        }
        $settings->save();


        // If Maropost is enabled
        if (!empty($request->maropost_status) && $request->maropost_status == 1) {
            MaropostAccess::updateOrCreate(
                [],
                [
                    'store_url' => $request->store_url ?? MaropostAccess::first()?->store_url,
                    'api_username' => $request->api_username ?? MaropostAccess::first()?->api_username,
                    'api_password' => $request->api_password ?? MaropostAccess::first()?->api_password,
                    'api_key' => $request->api_key ?? MaropostAccess::first()?->api_key,
                ]
            );
        }

        // If Shopify is enabled
        if (!empty($request->shopify_status) && $request->shopify_status == 1) {
            ShopifyAccess::updateOrCreate(
                [],
                [
                    'store_url' => $request->store_url ?? ShopifyAccess::first()?->store_url,
                    'access_token' => $request->access_token ?? ShopifyAccess::first()?->access_token,
                ]
            );
        }

        return response()->json([
            'message' => 'Settings updated successfully',
            'settings' => $settings,
            'maropost_access' => MaropostAccess::first(),
            'shopify_access' => ShopifyAccess::first(),
        ]);
    }


    public function updatePlatform(Request $request, $platform)
    {
        $request->validate([
            'store_url' => 'nullable|string',
            'api_username' => 'nullable|string',
            'api_password' => 'nullable|string',
            'api_key' => 'nullable|string',
            'access_token' => 'nullable|string',
            'status' => 'nullable|boolean',
        ]);

        $settings = Setting::first();
        if (!$settings) {
            $settings = Setting::create([
                'maropost_status' => 0,
                'shopify_status' => 0,
            ]);
        }

        if ($platform === 'maropost') {
            if (isset($request->status)) {
                $settings->maropost_status = $request->status;
                $settings->save();
            }

            $maropost = MaropostAccess::first();

            $updateData = array_filter([
                'store_url' => $request->store_url,
                'api_username' => $request->api_username,
                'api_password' => $request->api_password,
                'api_key' => $request->api_key,
            ], fn($value) => !is_null($value)); // only non-null values

            if ($maropost) {
                $maropost->update($updateData);
            } else {
                MaropostAccess::create($updateData);
            }

            return response()->json([
                'message' => 'Maropost credentials updated',
                'maropost_access' => MaropostAccess::first(),
                'settings' => $settings,
            ]);
        }

        if ($platform === 'shopify') {
            if (isset($request->status)) {
                $settings->shopify_status = $request->status;
                $settings->save();
            }

            $shopify = ShopifyAccess::first();

            $updateData = array_filter([
                'store_url' => $request->store_url,
                'access_token' => $request->access_token,
            ], fn($value) => !is_null($value));

            if ($shopify) {
                $shopify->update($updateData);
            } else {
                ShopifyAccess::create($updateData);
            }

            return response()->json([
                'message' => 'Shopify credentials updated',
                'shopify_access' => ShopifyAccess::first(),
                'settings' => $settings,
            ]);
        }

        return response()->json(['message' => 'Invalid platform'], 400);
    }
}
