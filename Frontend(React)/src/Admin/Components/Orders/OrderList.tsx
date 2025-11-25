import React, { useEffect, useState } from "react";
import axios from "axios";
import API_URL from "../../../config";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import OrderFilter from "./OrderFilter";
import { closeLoading, showLoading } from "../../../General/Loader";

const OrderList: React.FC = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalOrders, setTotalOrders] = useState(0);
    const [selectedOrders, setSelectedOrders] = useState<number[]>([]);

    const navigate = useNavigate();

    const fetchOrders = async (pageNumber = page, perPage = rowsPerPage) => {
        showLoading(3000);
        try {
            const response: any = await axios.get(
                `${API_URL}/getorder?page=${pageNumber}&per_page=${perPage}`
            );
            setOrders(response.data.orders || []);
            setTotalOrders(response.data.total || 0);
        } catch (error) {
        } finally {
            closeLoading();
        }
    };

    useEffect(() => {
        fetchOrders(page, rowsPerPage);
    }, [page, rowsPerPage]);

    const handleOrderClick = (id: string) => {
        navigate(`/orders/${id}`);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedOrders(orders.map((o) => o.order_id));
        } else {
            setSelectedOrders([]);
        }
    };

    const handleSelectOne = (id: string) => {
        setSelectedOrders((prev: any) =>
            prev.includes(id) ? prev.filter((i: any) => i !== id) : [...prev, id]
        );
    };

    const handleApplyFilters = async (filters: any) => {
        try {
            const params = new URLSearchParams();
            Object.keys(filters).forEach((key) => {
                if (filters[key]) params.append(key, filters[key]);
            });
            const response: any = await axios.get(`${API_URL}/getorder?${params.toString()}`);
            setOrders(response.data.orders || []);
            setTotalOrders(response.data.total || 0);
        } catch (err) {
        }
    };

    return (
        <div className="p-4">
            <OrderFilter onApplyFilters={handleApplyFilters} />

            <div className="relative shadow-md sm:rounded-lg mt-4">
                <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: "calc(100vh - 335px)" }} >
                    <table className="w-full min-w-[700px] text-sm text-left text-gray-500 border-collapse">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th className="p-4 bg-gray-50">
                                    <input type="checkbox" checked={selectedOrders.length === orders.length && orders.length > 0}
                                        onChange={handleSelectAll} className="w-4 h-4 text-blue-600 bg-gray-100 rounded focus:ring-blue-500" />
                                </th>
                                <th className="px-4 py-3 bg-gray-50">Order ID</th>
                                <th className="px-4 py-3 bg-gray-50">Customer</th>
                                <th className="px-4 py-3 bg-gray-50">Email</th>
                                <th className="px-4 py-3 bg-gray-50">Status</th>
                                <th className="px-4 py-3 bg-gray-50">Date Placed</th>
                                <th className="px-4 py-3 bg-gray-50">Total</th>
                            </tr>
                        </thead>

                        <tbody className="min-h-[200px]">
                            { orders.length === 0 ? (
                                <tr style={{ maxHeight: "calc(100vh - 390px)", height: "calc(100vh - 390px)" }}>
                                    <td colSpan={7} className="text-center">
                                        No records found
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.order_id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="p-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedOrders.includes(order.order_id)}
                                                onChange={() => handleSelectOne(order.order_id)}
                                                className="w-4 h-4 text-blue-600 bg-gray-100 rounded focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="px-4 py-3 font-medium text-blue-600 underline cursor-pointer" onClick={() => handleOrderClick(order.order_id)}>
                                            {order.order_id}
                                        </td>
                                        <td className="px-4 py-3">{order.customer_name}</td>
                                        <td className="px-4 py-3 break-words">{order.customer_email}</td>
                                        <td className="px-4 py-3">{order.order_status}</td>
                                        <td className="px-4 py-3">{moment(order.date_placed).format("DD/MM/YYYY")}</td>
                                        <td className="px-4 py-3 font-semibold">${order.grand_total}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>


                <div className="sticky bottom-0 bg-white flex flex-col md:flex-row items-center justify-between p-4 gap-2 md:gap-0 border-t">
                    <span className="text-sm text-gray-500">
                        Showing {(page - 1) * rowsPerPage + 1}-
                        {Math.min(page * rowsPerPage, totalOrders)} of {totalOrders}
                    </span>


                    <div className="inline-flex -space-x-px text-sm overflow-x-auto mt-2 md:mt-0">
                        <div className="flex items-center gap-2 mr-[10px]">
                            <label htmlFor="rowsPerPage" className="text-sm text-gray-500">
                                Rows per page:
                            </label>
                            <select id="rowsPerPage" value={rowsPerPage}
                                onChange={(e) => {
                                    setRowsPerPage(parseInt(e.target.value, 10)); setPage(1);
                                }} className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 
                                focus:ring-blue-500" >
                                {[10, 20, 50, 100].map((num) => (
                                    <option key={num} value={num}>
                                        {num}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button disabled={page === 1} onClick={() => setPage(page - 1)}
                            className="px-3 py-1 border border-gray-300 rounded-l hover:bg-gray-100 disabled:opacity-50" >
                            Previous
                        </button>
                        {Array.from({ length: Math.ceil(totalOrders / rowsPerPage) }, (_, i) => i + 1).map(
                            (p) => (
                                <button key={p} onClick={() => setPage(p)}
                                    className={`px-3 py-1 border border-gray-300 hover:bg-gray-100 ${p === page ? "bg-blue-50 text-blue-600" : ""}`} >
                                    {p}
                                </button>
                            )
                        )}
                        <button disabled={page === Math.ceil(totalOrders / rowsPerPage)} onClick={() => setPage(page + 1)}
                            className="px-3 py-1 border border-gray-300 rounded-r hover:bg-gray-100 disabled:opacity-50" >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>

    );
};

export default OrderList;
