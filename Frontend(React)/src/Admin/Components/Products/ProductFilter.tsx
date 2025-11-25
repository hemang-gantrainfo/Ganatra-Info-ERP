import React, { useEffect, useState } from "react";
import axios from "axios";
import { X, SlidersHorizontal, FilterX } from "lucide-react";
import API_URL from "../../../config";

interface FilterBarProps {
  onApplyFilters: (filters: any) => Promise<void> | void;
  page?: number;
  rowsPerPage?: number;
}

const FilterBar: React.FC<FilterBarProps> = ({
  onApplyFilters,
  page = 0,
  rowsPerPage = 10,
}) => {
  const [filters, setFilters] = useState({
    sku: "",
    brand: "",
    name: "",
    parent_sku: "",
    active: "2",
    min_qty: "",
    max_qty: "",
  });

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);

  useEffect(() => {
    handleApply();
  }, [filters.active]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleApply = async () => {
    await onApplyFilters(filters);
  };

  const handleRemoveFilter = async (key: string) => {
    const updated = { ...filters, [key]: "" };
    setFilters(updated);
    await onApplyFilters(updated);
  };

  const handleClearAll = async () => {
    const cleared = {
      sku: "",
      brand: "",
      name: "",
      parent_sku: "",
      active: "2",
      min_qty: "",
      max_qty: "",
    };
    setFilters(cleared);
    setClearLoading(true);
    try {
      const response: any = await axios.get(
        `${API_URL}/products?page=${page + 1}&per_page=${rowsPerPage}`
      );
      await onApplyFilters({
        filters: cleared,
        data: response.data.data,
        pagination: response.data.pagination,
      });
    } finally {
      setClearLoading(false);
    }
  };

  const allEmpty = Object.values(filters).every((v) => v === "");

  const commonInputClasses =
    "w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none";

  const fixedWidth = "w-[200px]";

  const FilterInputs = (
    <>
      {[
        { label: "Product Name", name: "name", placeholder: "Enter Product Name" },
        { label: "SKU", name: "sku", placeholder: "Enter SKU" },
        { label: "Parent SKU", name: "parent_sku", placeholder: "Enter Parent SKU" },
        { label: "Brand", name: "brand", placeholder: "Enter Brand" },
      ].map((f) => (
        <div key={f.name} className={`relative ${fixedWidth} flex-shrink-0`}>
          <label className="text-xs font-semibold text-gray-700">{f.label}</label>
          <input name={f.name} value={(filters as any)[f.name]} autoComplete="off" onChange={handleChange} placeholder={f.placeholder} className={commonInputClasses} />
          {(filters as any)[f.name] && (
            <button onClick={() => handleRemoveFilter(f.name)} className="absolute right-2 top-[32px] text-gray-400 hover:text-gray-600" >
              <X size={16} />
            </button>
          )}
        </div>
      ))}

      <div className={`relative ${fixedWidth} flex-shrink-0`}>
        <label className="text-xs font-semibold text-gray-700">Active</label>
        <select name="active" value={filters.active} onChange={handleChange} className={commonInputClasses} >
          <option value="2">All</option>
          <option value="1">Active</option>
          <option value="0">Inactive</option>
        </select>
      </div>

      {[
        { label: "Min Quantity", name: "min_qty", placeholder: "Min Qty" },
        { label: "Max Quantity", name: "max_qty", placeholder: "Max Qty" },
      ].map((f) => (
        <div key={f.name} className={`relative ${fixedWidth} flex-shrink-0`}>
          <label className="text-xs font-semibold text-gray-700">{f.label}</label>
          <input
            name={f.name}
            type="text"
            value={(filters as any)[f.name]}
            onChange={(e) => {
              const val = e.target.value;
              if (/^\d*\.?\d*$/.test(val)) handleChange(e);
            }}
            placeholder={f.placeholder}
            className={commonInputClasses}
          />
          {(filters as any)[f.name] && (
            <button
              onClick={() => handleRemoveFilter(f.name)}
              className="absolute right-2 top-7 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
      ))}
    </>
  );

  return (
    <>
      <div className="hidden sm:flex items-end gap-3 mb-4 overflow-x-auto pb-2">
        {FilterInputs}
        <div className="flex items-end flex-shrink-0">
          <button onClick={handleClearAll} disabled={allEmpty || clearLoading}
            className={`flex items-center justify-center border border-gray-400 rounded-md px-3 text-sm h-[34px] text-gray-700 hover:bg-gray-100 ${allEmpty || clearLoading ? "opacity-50 cursor-not-allowed" : ""}`} >
            <FilterX size={16} className="mr-1" /> Clear
          </button>
        </div>
      </div>

      <div className="flex sm:hidden justify-between items-center mb-4">
        <h2 className="text-base font-semibold">Filters</h2>
        <button onClick={() => setIsMenuOpen(true)} className="p-2 bg-orange-500 text-white rounded-md" >
          <SlidersHorizontal size={18} />
        </button>
      </div>

      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
          <div className="bg-white w-80 h-full px-4 py-[60px] flex flex-col">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="font-semibold text-lg">Filters</h2>
              <button onClick={() => setIsMenuOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto flex-grow flex flex-col gap-3 pr-2">
              {FilterInputs}
            </div>

            <div className="mt-4 flex justify-between">
              <button onClick={handleClearAll} disabled={allEmpty || clearLoading}
                className={`flex items-center justify-center border border-gray-400 rounded-md px-3 py-1.5 text-sm h-[34px] text-gray-700 hover:bg-gray-100
                 ${allEmpty || clearLoading ? "opacity-50 cursor-not-allowed" : ""}`} >
                <FilterX size={16} className="mr-1" /> Clear
              </button>

              <button onClick={() => { handleApply();
                  setIsMenuOpen(false); }} className="bg-orange-500 text-white px-4 py-2 rounded-md text-sm hover:bg-orange-600" >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FilterBar;