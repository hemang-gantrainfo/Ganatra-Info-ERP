import { useRef, useState, useEffect } from "react";
import { X, Filter, Menu, RotateCcw, FilterX } from "lucide-react";

const orderStatuses = [
    { value: "New", label: "New" },
    { value: "Pick", label: "Pick" },
    { value: "Pack", label: "Pack" },
    { value: "Ship", label: "Ship" },
    { value: "Delivered", label: "Delivered" },
];

const INITIAL_FILTERS = {
    order_id: "",
    customer_name: "",
    customer_email: "",
    status: "",
    date_placed: "",
    start_date: "",
    end_date: "",
};

const FilterField = ({ label, children, className = "" }: any) => (
    <div className={`flex-1 min-w-full sm:min-w-[100px] ${className}`}>
        <label className="block text-sm font-semibold mb-1 text-gray-700">
            {label}
        </label>
        {children}
    </div>
);

const OrderFilter = ({ onApplyFilters }: any) => {
    const datePlacedRef: any = useRef<HTMLInputElement>(null);
    const startDateRef: any = useRef<HTMLInputElement>(null);
    const endDateRef: any = useRef<HTMLInputElement>(null);
    const [filters, setFilters] = useState(INITIAL_FILTERS);
    const [applyLoading, setApplyLoading] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const allEmpty = Object.values(filters).every((v) => v === "");

    useEffect(() => {
        const timer = setTimeout(() => {
            handleApply();
        }, 500);

        return () => clearTimeout(timer);
    }, [filters]);

    const handleOpenCalendar = (ref: React.RefObject<HTMLInputElement>, e: React.MouseEvent) => {
        e.stopPropagation();
        if (ref.current) {
            ref.current.showPicker?.();
        }
    };

    const handleApply = async () => {
        setApplyLoading(true);
        try {
            await onApplyFilters(filters);
            setMobileOpen(false);
        } finally {
            setApplyLoading(false);
        }
    };

    const handleClear = () => {
        setFilters(INITIAL_FILTERS);
        onApplyFilters(INITIAL_FILTERS);
        setMobileOpen(false);
    };

    const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters({ ...filters, [field]: e.target.value });
    };

    const handleRemoveFilter = (field: string) => {
        setFilters({ ...filters, [field]: "" });
    };

    const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleApply();
        }
    };

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const desktopFilters = (
        <div className="hidden md:flex flex-row gap-3 w-full mb-6 items-end">
            <FilterField label="Order ID" className="flex-1 min-w-[120px]">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Order ID"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={filters.order_id}
                        onChange={handleChange("order_id")}
                        onKeyUp={handleKeyUp}
                    />
                    {filters.order_id && (
                        <button
                            className="absolute right-2 top-[30px] transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                            onClick={() => handleRemoveFilter("order_id")}
                        >
                            <X size={16} className="text-gray-500" />
                        </button>
                    )}
                </div>
            </FilterField>

            <FilterField label="Customer Name" className="flex-1 min-w-[140px]">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Customer Name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={filters.customer_name}
                        onChange={handleChange("customer_name")}
                        onKeyUp={handleKeyUp}
                    />
                    {filters.customer_name && (
                        <button
                            className="absolute right-2 top-[30px] transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                            onClick={() => handleRemoveFilter("customer_name")}
                        >
                            <X size={16} className="text-gray-500" />
                        </button>
                    )}
                </div>
            </FilterField>

            <FilterField label="Customer Email" className="flex-1 min-w-[160px]">
                <div className="relative">
                    <input
                        type="email"
                        placeholder="Customer Email"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={filters.customer_email}
                        onChange={handleChange("customer_email")}
                        onKeyUp={handleKeyUp}
                    />
                    {filters.customer_email && (
                        <button
                            className="absolute right-2 top-[30px] transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                            onClick={() => handleRemoveFilter("customer_email")}
                        >
                            <X size={16} className="text-gray-500" />
                        </button>
                    )}
                </div>
            </FilterField>

            <FilterField label="Order Status" className="flex-1 min-w-[140px]">
                <div className="relative">
                    <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                        value={filters.status}
                        onChange={handleChange("status")}
                    >
                        <option value="">Select Status</option>
                        {orderStatuses.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </FilterField>

            <FilterField label="Date Placed" className="flex-1 min-w-[150px]">
                <div className="relative">
                    <input
                        type="date"
                        ref={datePlacedRef}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={filters.date_placed}
                        onChange={handleChange("date_placed")}
                        onClick={(e) => handleOpenCalendar(datePlacedRef, e)}
                    />
                    {filters.date_placed && (
                        <button
                            className="absolute right-8 top-[30px] transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                            onClick={() => handleRemoveFilter("date_placed")}
                        >
                            <X size={16} className="text-gray-500" />
                        </button>
                    )}

                </div>
            </FilterField>

            <FilterField label="Start Date" className="flex-1 min-w-[130px]">
                <div className="relative">
                    <input
                        type="date"
                        ref={startDateRef}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={filters.start_date}
                        onChange={handleChange("start_date")}
                        onClick={(e) => handleOpenCalendar(startDateRef, e)}
                    />
                    {filters.start_date && (
                        <button
                            className="absolute right-8 top-[30px] transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                            onClick={() => handleRemoveFilter("start_date")}
                        >
                            <X size={16} className="text-gray-500" />
                        </button>
                    )}

                </div>
            </FilterField>

            <FilterField label="End Date" className="flex-1 min-w-[130px]">
                <div className="relative">
                    <input
                        type="date"
                        ref={endDateRef}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={filters.end_date}
                        onChange={handleChange("end_date")}
                        onClick={(e) => handleOpenCalendar(endDateRef, e)}
                    />
                    {filters.end_date && (
                        <button
                            className="absolute right-8 top-[30px] transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                            onClick={() => handleRemoveFilter("end_date")}
                        >
                            <X size={16} className="text-gray-500" />
                        </button>
                    )}

                </div>
            </FilterField>

            <div className="flex gap-2 items-end">
                <button
                    onClick={handleClear}
                    disabled={allEmpty || applyLoading}
                    className={`p-2 rounded-md border min-w-[80px] flex items-center justify-center ${allEmpty || applyLoading
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                    title="Clear All Filters"
                >
                    <FilterX size={16} className="mr-1" />
                    <span className="whitespace-nowrap">Clear</span>
                </button>
            </div>
        </div>
    );

    const mobileFilters = (
        <>
            <div className="flex md:hidden justify-start mb-4 items-center gap-2">
                <button
                    onClick={handleDrawerToggle}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-700 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                    <Filter size={16} />
                    <span>Filters</span>
                    <Menu size={16} />
                </button>

                {!allEmpty && (
                    <span className="bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">
                        {Object.values(filters).filter(v => v !== "").length}
                    </span>
                )}
            </div>

            {mobileOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute inset-0 bg-black bg-opacity-50" onClick={handleDrawerToggle} />

                    <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-xl overflow-y-auto">
                        <div className="py-[60px] px-6  space-y-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-900">Filters</h3>
                                <button onClick={handleDrawerToggle} className="p-1 hover:bg-gray-100 rounded" >
                                    <X size={20} />
                                </button>
                            </div>

                            <FilterField label="Order ID">
                                <div className="relative">
                                    <input type="text" placeholder="Enter Order ID"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={filters.order_id} onChange={handleChange("order_id")} onKeyUp={handleKeyUp} />
                                    {filters.order_id && (
                                        <button
                                            className="absolute right-2 top-[30px] transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded" onClick={() => handleRemoveFilter("order_id")} >
                                            <X size={16} className="text-gray-500" />
                                        </button>
                                    )}
                                </div>
                            </FilterField>

                            <FilterField label="Customer Name">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Enter Customer Name"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={filters.customer_name}
                                        onChange={handleChange("customer_name")}
                                        onKeyUp={handleKeyUp}
                                    />
                                    {filters.customer_name && (
                                        <button
                                            className="absolute right-2 top-[30px] transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded" onClick={() => handleRemoveFilter("customer_name")} >
                                            <X size={16} className="text-gray-500" />
                                        </button>
                                    )}
                                </div>
                            </FilterField>

                            <FilterField label="Customer Email">
                                <div className="relative">
                                    <input
                                        type="email"
                                        placeholder="Enter Customer Email"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={filters.customer_email}
                                        onChange={handleChange("customer_email")}
                                        onKeyUp={handleKeyUp}
                                    />
                                    {filters.customer_email && (
                                        <button
                                            className="absolute right-2 top-[30px] transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                                            onClick={() => handleRemoveFilter("customer_email")}
                                        >
                                            <X size={16} className="text-gray-500" />
                                        </button>
                                    )}
                                </div>
                            </FilterField>

                            <FilterField label="Order Status">
                                <div className="relative">
                                    <select
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                                        value={filters.status}
                                        onChange={handleChange("status")}
                                    >
                                        <option value="">Select Status</option>
                                        {orderStatuses.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </FilterField>

                            <FilterField label="Date Placed (Specific)">
                                <div className="relative">
                                    <input
                                        type="date"
                                        ref={datePlacedRef}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={filters.date_placed}
                                        onChange={handleChange("date_placed")}
                                        onClick={(e) => handleOpenCalendar(datePlacedRef, e)}
                                    />
                                    {filters.date_placed && (
                                        <button
                                            className="absolute right-8 top-[30px] transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                                            onClick={() => handleRemoveFilter("date_placed")}
                                        >
                                            <X size={16} className="text-gray-500" />
                                        </button>
                                    )}
                                </div>
                            </FilterField>

                            <FilterField label="Start Date">
                                <div className="relative">
                                    <input
                                        type="date"
                                        ref={startDateRef}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={filters.start_date}
                                        onChange={handleChange("start_date")}
                                        onClick={(e) => handleOpenCalendar(startDateRef, e)}
                                    />
                                    {filters.start_date && (
                                        <button
                                            className="absolute right-8 top-[30px] transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                                            onClick={() => handleRemoveFilter("start_date")}
                                        >
                                            <X size={16} className="text-gray-500" />
                                        </button>
                                    )}
                                </div>
                            </FilterField>

                            <FilterField label="End Date">
                                <div className="relative">
                                    <input
                                        type="date"
                                        ref={endDateRef}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={filters.end_date}
                                        onChange={handleChange("end_date")}
                                        onClick={(e) => handleOpenCalendar(endDateRef, e)}
                                    />
                                    {filters.end_date && (
                                        <button
                                            className="absolute right-8 top-[30px] transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                                            onClick={() => handleRemoveFilter("end_date")}
                                        >
                                            <X size={16} className="text-gray-500" />
                                        </button>
                                    )}
                                </div>
                            </FilterField>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={handleClear}
                                    disabled={allEmpty}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md ${allEmpty
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        : "bg-white text-gray-700 hover:bg-gray-50"
                                        }`}
                                >
                                    <RotateCcw size={16} />
                                    Clear All
                                </button>
                                <button
                                    onClick={handleApply}
                                    className="flex-1 bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors"
                                >
                                    Apply Filters
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );

    return (
        <>
            {desktopFilters}
            {mobileFilters}
        </>
    );
};

export default OrderFilter;