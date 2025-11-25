import React from "react";
import { Menu, Trash2, RefreshCw, PlusSquare, ArrowLeft, Upload, Download } from "lucide-react";
import ImportCSV from "./CSV/ImportCSV";
import ExportCSV from "./CSV/ExportCSV";

interface ProductActionsProps {
    totalProducts: number;
    selectedProducts: number[];
    products: any[];
    rowsPerPage: number;
    mobileMenuOpen: boolean;
    handleMobileMenuToggle: () => void;
    handleMobileAction: (fn: () => void) => void;
    handleSyncProducts: () => void;
    setOpenBulkDeleteDialog: React.Dispatch<React.SetStateAction<boolean>>;
    navigate: (url: string) => void;
    fetchInitialData: () => void;
    allSelected: boolean;
    handleSelectAll: (selectAll: boolean) => void;
    isSelectAllMode: boolean;
    manuallyUnselected: number[];
}

const ProductActions: React.FC<ProductActionsProps> = ({
    totalProducts,
    selectedProducts,
    products,
    rowsPerPage,
    mobileMenuOpen,
    handleMobileMenuToggle,
    handleMobileAction,
    handleSyncProducts,
    setOpenBulkDeleteDialog,
    navigate,
    fetchInitialData,
    handleSelectAll,
    manuallyUnselected,
    isSelectAllMode,
}) => {
    const btnBase = "flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium border transition duration-200 rounded-md";

    const getEffectiveSelectedCount = () => {
        if (isSelectAllMode) {
            return totalProducts - manuallyUnselected.length;
        } else {
            return selectedProducts.length;
        }
    };

    const effectiveSelectedCount = getEffectiveSelectedCount();

    return (
        <div className="flex flex-col gap-3 mb-3 w-full">
            <div className="flex justify-between items-center sm:hidden">
                <div className="font-semibold text-gray-800 text-sm w-[120px]">
                    Total Results: {totalProducts}
                </div>
                <button onClick={handleMobileMenuToggle} className="p-2 bg-orange-500 text-white rounded-md" >
                    <Menu size={18} />
                </button>
            </div>

            <div className="hidden sm:flex sm:flex-row sm:items-end sm:justify-between gap-3 w-full">
                <div className="font-semibold text-gray-800 w-[120px] sm:w-auto text-[14px]">
                    Total Results: {totalProducts}
                </div>

                {effectiveSelectedCount > 0 && (
                    <div className="flex items-center gap-2 font-semibold text-gray-800 whitespace-nowrap">
                        <span>Selected Products: {effectiveSelectedCount}</span>

                        {!isSelectAllMode ? (
                            <button className="font-medium text-blue-600 hover:underline cursor-pointer" onClick={() => handleSelectAll(true)} >
                                Select All {totalProducts} Products
                            </button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button
                                    className="font-medium text-red-600 hover:underline cursor-pointer"
                                    onClick={() => handleSelectAll(false)}
                                >
                                    Clear Selection
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-2">
                    {effectiveSelectedCount > 0 && (
                        <button
                            onClick={() => setOpenBulkDeleteDialog(true)}
                            className={`${btnBase} border-red-600 text-red-600 hover:bg-red-600 hover:text-white`}
                        >
                            <Trash2 size={16} />
                            Delete ({effectiveSelectedCount})
                        </button>
                    )}

                    <button disabled={selectedProducts.length === 0} onClick={handleSyncProducts}
                        className={`${btnBase} ${selectedProducts.length === 0 ? "border-gray-300 text-gray-400 cursor-not-allowed opacity-60" : "border-gray-800 text-gray-800 hover:bg-gray-100"}`} >
                        <RefreshCw size={16} />
                        Sync Products
                    </button>

                    <div className="h-10 flex items-center">
                        <ImportCSV onSuccess={fetchInitialData} />
                    </div>

                    {products.length > 0 && (
                        <div className="h-10 flex items-center">
                            <ExportCSV selectedProducts={selectedProducts} limitations={rowsPerPage} />
                        </div>
                    )}

                    <button onClick={() => navigate("/products?add=true")} className={`${btnBase} bg-orange-500 border-orange-500 text-white hover:bg-orange-600`} >
                        <PlusSquare size={16} />
                        Add New Product
                    </button>
                </div>
            </div>

            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 flex justify-start">
                    <div className="bg-white w-72 h-full px-4 py-[60px] shadow-lg flex flex-col">
                        <div className="flex justify-between items-center border-b pb-2 mb-4">
                            <h2 className="font-semibold text-lg">Actions</h2>
                            <button onClick={handleMobileMenuToggle} className="text-gray-600 hover:text-black" >
                                <ArrowLeft size={20} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-3">
                            {selectedProducts.length > 0 && (
                                <button
                                    onClick={() => handleMobileAction(() => setOpenBulkDeleteDialog(true))} className={`${btnBase} border-red-600 text-red-600 hover:bg-red-600 hover:text-white`} >
                                    <Trash2 size={16} />
                                    Delete ({selectedProducts.length})
                                </button>
                            )}

                            <button onClick={() => handleMobileAction(handleSyncProducts)} disabled={selectedProducts.length === 0}
                                className={`${btnBase} ${selectedProducts.length === 0 ? "border-gray-300 text-gray-400 cursor-not-allowed opacity-60" : "border-gray-800 text-gray-800 hover:bg-gray-100"}`} >
                                <RefreshCw size={16} />
                                Sync Products
                            </button>

                            <button onClick={() => handleMobileAction(() => { })} className={`${btnBase} border-gray-800 text-gray-800 hover:bg-gray-100`} >
                                <Upload size={16} />
                                Import CSV
                            </button>

                            {products.length > 0 && (
                                <button onClick={() => handleMobileAction(() => { })} className={`${btnBase} border-gray-800 text-gray-800 hover:bg-gray-100`} >
                                    <Download size={16} />
                                    Export CSV
                                </button>
                            )}

                            <button onClick={() => navigate("/products?add=true")} className={`${btnBase} w-full bg-orange-500 border-orange-500 text-white hover:bg-orange-600`} >
                                <PlusSquare size={16} />
                                Add New Product
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductActions;
