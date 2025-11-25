import { CameraIcon, EyeIcon, LinkIcon, PencilIcon, TrashIcon } from "lucide-react";
import React from "react";

interface ProductTableProps {
    products: any[];
    totalProducts: number;
    rowsPerPage: number;
    page: number;
    setPage: (page: number) => void;
    setRowsPerPage: (value: number) => void;
    allSelected: boolean;
    partiallySelected: boolean;
    selectedProducts: number[];
    handleSelectAll: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleSelectProduct: (id: number) => void;
    fetchProductById: (id: number) => void;
    handleViewProduct: (product: any) => void;
    handleDeleteClick: (id: number) => void;
    getCategoryName: (id: number) => string;
    getBrandName: (id: number) => string;
    BASE_URL: string;
    loading?: boolean;
}

const ProductTable: React.FC<ProductTableProps> = ({
    products,
    totalProducts,
    rowsPerPage,
    page,
    setPage,
    setRowsPerPage,
    allSelected,
    selectedProducts,
    handleSelectAll,
    handleSelectProduct,
    fetchProductById,
    handleViewProduct,
    handleDeleteClick,
    getCategoryName,
    getBrandName,
    BASE_URL,
    loading = false,
}) => {
    const totalPages = Math.ceil(totalProducts / rowsPerPage);

    return (
        <div className="bg-white shadow-md rounded-lg overflow-hidden flex flex-col h-[calc(100vh-300px)]">
            <div className="overflow-y-auto flex-1 custom-scrollbar"
                style={{ maxHeight: "calc(100vh - 330px)" }} >
                <table className="w-full text-sm text-left min-w-[900px] border-collapse">
                    <thead className="bg-gray-100 sticky top-0 z-10 text-gray-700 uppercase text-xs">
                        <tr>
                            <th className="p-3 border-b w-10">
                                <input type="checkbox" checked={allSelected} onChange={handleSelectAll} className="w-4 h-4 text-blue-600 border-gray-300 rounded" />
                            </th>
                            <th className="p-3 border-b">Image</th>
                            <th className="p-3 border-b">SKU</th>
                            <th className="p-3 border-b"></th>
                            <th className="p-3 border-b">Parent</th>
                            <th className="p-3 border-b">Name</th>
                            <th className="p-3 border-b">Category</th>
                            <th className="p-3 border-b">Brand</th>
                            <th className="p-3 border-b">RRP</th>
                            <th className="p-3 border-b">Cost Price</th>
                            <th className="p-3 border-b">Qty</th>
                            <th className="p-3 border-b">Active</th>
                            <th className="p-3 border-b">Neto</th>
                            <th className="p-3 border-b">Shopify</th>
                            <th className="p-3 border-b text-right">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={15} className="text-center py-10 text-gray-500">
                                    Loading...
                                </td>
                            </tr>
                        ) : products.length === 0 ? (
                            <tr>
                                <td colSpan={15} className="text-center py-10 text-gray-500">
                                    No products found
                                </td>
                            </tr>
                        ) : (
                            products.map((product) => (
                                <tr key={product.id} className="hover:bg-gray-50 border-b transition" >
                                    <td className="p-3 text-center">
                                        <input type="checkbox" checked={selectedProducts.includes(product.id)} onChange={() => handleSelectProduct(product.id)} className="w-4 h-4 text-blue-600 border-gray-300 rounded" />
                                    </td>

                                    <td className="p-3">
                                        {product.images?.length > 0 ? (
                                            <div className="w-12 h-12 cursor-pointer" onClick={() => fetchProductById(product.id)} >
                                                <img
                                                    src={`${BASE_URL}/${product.images.find((img: any) => img.type === "main")?.image_path}`}
                                                    alt={`prod-${product.id}`}
                                                    className="w-full h-full object-contain rounded"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-12 h-12 border flex items-center justify-center text-gray-400 cursor-pointer" onClick={() => fetchProductById(product.id)} >
                                                <CameraIcon className="w-5 h-5" />
                                            </div>
                                        )}
                                    </td>

                                    <td className="p-3 font-medium text-blue-600 underline cursor-pointer" onClick={() => fetchProductById(product.id)} >
                                        {product.sku}
                                    </td>

                                    <td className="p-3">
                                        {product.parent_id && (
                                            <LinkIcon className="w-4 h-4 text-orange-500 cursor-pointer" onClick={() => fetchProductById(product.parent_id)} />
                                        )}
                                    </td>

                                    <td className="p-3">
                                        {product.parent_id ? (
                                            <span className="underline cursor-pointer text-blue-600" onClick={() => fetchProductById(product.parent_id)} > {product.parentsku} </span>) : ("")}
                                    </td>

                                    <td className="p-3">{product.name}</td>
                                    <td className="p-3">{getCategoryName(product.category_id)}</td>
                                    <td className="p-3">{getBrandName(product.brand)}</td>
                                    <td className="p-3">${product.rrp || "0"}</td>
                                    <td className="p-3">${product.cost_price || "0"}</td>

                                    <td className="p-3 text-center">
                                        {(product.parent_id == null && product.total_qty !== 0 ? product.total_qty : product.qty) || 0}
                                    </td>

                                    <td className="p-3">
                                        <span
                                            className={`px-3 py-1 text-xs font-semibold rounded ${product.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}`} >
                                            {product.active ? "Active" : "Inactive"}
                                        </span>
                                    </td>

                                    <td className="p-3">
                                        <span
                                            className={`px-3 py-1 text-xs font-semibold rounded ${product.maropost_sync === 1 ? "bg-green-100 text-green-800" : "bg-gray-300 text-gray-700"}`} >
                                            {product.maropost_sync === 1 ? "Approved" : "Unapproved"}
                                        </span>
                                    </td>

                                    <td className="p-3">
                                        <span
                                            className={`px-3 py-1 text-xs font-semibold rounded ${product.shopify_sync === 1 ? "bg-green-100 text-green-800" : "bg-gray-300 text-gray-700"}`} >
                                            {product.shopify_sync === 1 ? "Approved" : "Unapproved"}
                                        </span>
                                    </td>

                                    <td className="p-3 text-right space-x-2">
                                        <button title="Edit Product" onClick={() => fetchProductById(product.id)} className="text-gray-700 hover:text-blue-600" >
                                            <PencilIcon className="w-4 h-4 inline" />
                                        </button>
                                        <button title="View Product" onClick={() => handleViewProduct(product)} className="text-gray-700 hover:text-blue-600" >
                                            <EyeIcon className="w-4 h-4 inline" />
                                        </button>
                                        <button title="Delete Product" onClick={() => handleDeleteClick(product.id)} className="text-gray-700 hover:text-red-600" >
                                            <TrashIcon className="w-4 h-4 inline" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="border-t bg-gray-50 p-3 flex justify-between items-center sticky bottom-0">
                <div className="text-sm text-gray-600">
                    Page {page} of {totalPages || 1}
                </div>

                <div className="inline-flex -space-x-px text-sm overflow-x-auto mt-2 md:mt-0">
                    <div className="flex items-center gap-2 mr-[10px]">
                        <label htmlFor="rowsPerPage" className="text-sm text-gray-500">
                            Rows per page:
                        </label>
                        <select value={rowsPerPage}
                            onChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }} className="border rounded-lg px-2 py-1 text-sm" >
                            {[10, 20, 50, 100].map((n) => (
                                <option key={n} value={n}>
                                    {n}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button disabled={page === 1} onClick={() => setPage(page - 1)}
                        className="px-3 py-1 border border-gray-300 rounded-l hover:bg-gray-100 disabled:opacity-50" >
                        Previous
                    </button>
                    {Array.from({ length: Math.ceil(totalProducts / rowsPerPage) }, (_, i) => i + 1).map(
                        (p) => (
                            <button key={p} onClick={() => setPage(p)}
                                className={`px-3 py-1 border border-gray-300 hover:bg-gray-100 ${p === page ? "bg-blue-50 text-blue-600" : ""}`} >
                                {p}
                            </button>
                        )
                    )}
                    <button disabled={page === Math.ceil(totalProducts / rowsPerPage)} onClick={() => setPage(page + 1)}
                        className="px-3 py-1 border border-gray-300 rounded-r hover:bg-gray-100 disabled:opacity-50" >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductTable;
