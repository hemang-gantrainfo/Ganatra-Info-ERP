<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderLine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class OrderController extends Controller
{

    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 10);

        $query = Order::with('orderLines');

        if ($request->filled('order_id')) {
            $query->where('order_id', 'like', '%' . $request->order_id . '%');
        }

        if ($request->filled('customer_name')) {
            $query->where('customer_name', 'like', '%' . $request->customer_name . '%');
        }

        if ($request->filled('customer_email')) {
            $query->where('customer_email', 'like', '%' . $request->customer_email . '%');
        }

        if ($request->filled('status')) {
            $query->where('order_status', $request->status);
        }

        if ($request->filled('date_placed')) {
            $query->whereDate('date_placed', $request->date_placed);
        } elseif ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('date_placed', [$request->start_date, $request->end_date]);
        }

        $orders = $query->orderBy('id', 'desc')->paginate($perPage);


        $response = [
            "status" => true,
            "message" => "Orders fetched successfully",
            "total" => $orders->total(),
            "per_page" => $orders->perPage(),
            "current_page" => $orders->currentPage(),
            "last_page" => $orders->lastPage(),
            "orders" => $orders->items()
        ];

        return response()->json($response, 200);
    }

    public function show(Request $response, $order_id)
    {

        $order = Order::with('orderLines')->where('order_id', $order_id)->first();
        if (!$order) {
            return response()->json([
                'status' => false,
                'message' => 'Order not found.'
            ], 404);
        }

        return response()->json([
            'status' => true,
            'data' => $order
        ]);
    }

    public function syncOrder()
    {

        $path = public_path('demo_orders.json');

        if (!File::exists($path)) {
            return response()->json([
                'status' => false,
                'message' => 'JSON file not found in public directory'
            ], 404);
        }

        $data = json_decode(File::get($path), true);
        // dd($data['Orders']);

        if (!$data || !isset($data['Orders'])) {
            return response()->json([
                'status' => false,
                'message' => 'Invalid JSON format'
            ], 400);
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        OrderLine::truncate();
        Order::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        DB::beginTransaction();

        try {
            foreach ($data['Orders'] as $orderData) {

                $order = Order::create([
                    'order_id' => $orderData['OrderID'],
                    'customer_name' => $orderData['customer_name'] ?? $orderData['Username'] ?? 'Unknown',
                    'customer_email' => $orderData['customer_email'] ?? $orderData['Email'] ?? 'unknown@example.com',
                    'order_status' => $orderData['OrderStatus'] ?? 'New',
                    'shipping_option' => $orderData['ShippingOption'] ?? null,
                    'delivery_instruction' => $orderData['DeliveryInstruction'] ?? null,
                    'ship_address' => $orderData['ShipAddress'] ?? [],
                    'bill_address' => $orderData['BillAddress'] ?? [],
                    'sales_channel' => $orderData['SalesChannel'] ?? null,
                    'grand_total' => $orderData['GrandTotal'] ?? 0,
                    'shipping_total' => $orderData['ShippingTotal'] ?? 0,
                    'shipping_discount' => $orderData['ShippingDiscount'] ?? 0,
                    'order_type' => $orderData['OrderType'] ?? null,
                    'order_payment' => $orderData['OrderPayment'] ?? [],
                    'date_placed' => $orderData['DatePlaced'] ?? null,
                    'date_paid' => $orderData['DatePaid'] ?? null,
                    'shipping_signature' => $orderData['ShippingSignature'] ?? null,
                ]);


                if (!empty($orderData['OrderLine'])) {
                    foreach ($orderData['OrderLine'] as $line) {
                        $order->orderLines()->create([
                            'product_name' => $line['ProductName'] ?? 'Sample Product',
                            'sku' => $line['sku'] ?? 'no_sku',
                            'quantity' => $line['Quantity'] ?? 1,
                            'percent_discount' => $line['PercentDiscount'] ?? 0,
                            'product_discount' => $line['ProductDiscount'] ?? 0,
                            'cost_price' => $line['CostPrice'] ?? 0,
                            'shipping_tracking' => $line['ShippingTracking'] ?? null,
                        ]);
                    }
                }
            }

            DB::commit();

            return response()->json([
                'status' => true,
                'message' => 'orders synced successfully!'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }
}
