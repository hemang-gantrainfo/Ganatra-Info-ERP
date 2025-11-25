import React, { useState } from "react";
import API_URL from "../../../../config";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import { ArrowUpTrayIcon } from "@heroicons/react/24/solid";


interface ExportCSVProps {
  selectedProducts: number[];
  limitations: any;
}

const ExportCSV: React.FC<ExportCSVProps> = ({ selectedProducts, limitations }) => {
  const [open, setOpen] = useState(false);
  const [selection, setSelection] = useState<"all" | "selected">("all");
  const [allFields, setAllFields] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [screen, setScreen] = useState<0 | 1>(0);
  const excludedFields = [
    "approved",
    "promo_start",
    "promo_end",
    "maropost_sync",
    "shopify_sync",
    "promo_price",
    "custom_fields",
  ];
  const mandatoryFields = ["id", "name", "sku", "qty", "cost_price"];
  const flattenObject = (obj: Record<string, any>, parentKey = "", res: Record<string, any> = {}) => {
    for (const key in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
      const newKey = parentKey ? `${parentKey}.${key}` : key;
      const value = obj[key];
      if (value && typeof value === "object" && !Array.isArray(value)) {
        flattenObject(value, newKey, res);
      } else {
        res[newKey] = value;
      }
    }
    return res;
  };

  const handleOpen = async () => {
    setOpen(true);
    setScreen(0);
    setSelectedFields(mandatoryFields);

    try {
      const response = await fetch(`${API_URL}/productsfieldlist`);
      if (!response.ok) throw new Error(`Failed to fetch. Status: ${response.status}`);
      const data = await response.json();

      const filteredFields = (data.columnslist || []).filter(
        (f: any) => !excludedFields.includes(f)
      );
      setAllFields(filteredFields);
    } catch (err) {
    }
  };

  const handleClose = () => {
    setOpen(false);
    setScreen(0);
    setSelection("all");
    setSelectedFields([]);
  };

  const handleCheckboxChange = (field: string) => {
    if (mandatoryFields.includes(field)) return;
    setSelectedFields((prev) =>
      prev.includes(field)
        ? prev.filter((f) => f !== field)
        : [...prev, field]
    );
  };

  const handleNext = () => {
    if (selection === "all") {
      handleSubmit();
    } else {
      if (screen === 1) {
        if (!selectedFields.length) {
          toast.info("Please select at least one field to export.", { autoClose: 3000 });
          return;
        }
        handleSubmit();
      } else {
        setScreen(1);
      }
    }
  };

  const handleSubmit = async () => {
    const filteredSelectedFields = selectedFields.filter(
      (f) => !excludedFields.includes(f)
    );
    const fieldsToSend = Array.from(new Set([...mandatoryFields, ...filteredSelectedFields]));
    const payload =
      selection === "all"
        ? { fields: "all", pids: selectedProducts || undefined }
        : {
          fields: "selected",
          selected_fields: fieldsToSend,
          pids: selectedProducts || undefined,
        };

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/export-products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const dataToExport = await response.json();

      if (!response.ok) {
        toast.error(
          dataToExport.message || `Failed to export. Status: ${response.status}`,
          { autoClose: 3000 }
        );
        return;
      }

      const products = (dataToExport.product_data || []).map((p: any) => {
        const numericFields = ["qty", "promo_price", "cost_price", "width", "store_price", "length", "height", "rrp", "cubic",];

        const updated = { ...p };

        if (updated.parent_id == null || updated.parent_id === "") {
          const totalQty = Number(updated.total_qty) || 0;
          const qty = Number(updated.qty) || 0;
          updated.qty = totalQty !== 0 ? totalQty : qty;
        }

        numericFields.forEach((field) => {
          const val = updated[field];
          if (val === null || val === "" || val === undefined) {
            updated[field] = 0;
          } else if (!isNaN(Number(val))) {
            updated[field] = Number(val);
          }
        });

        return updated;
      });

      if (!products.length) {
        toast.info("No products to export for selected rows/fields.", { autoClose: 3000 });
        return;
      }

      let maxOptionsCount = 0;
      const expandedProducts = products.map((p: any) => {
        let expanded = { ...p };

        if (p.variants_options) {
          try {
            const parsed =
              typeof p.variants_options === "string"
                ? JSON.parse(p.variants_options)
                : p.variants_options;

            let variantEntries: [string, any][] = [];

            if (Array.isArray(parsed)) {
              variantEntries = parsed.map((v: any) => [v.name, v.value]);
            } else if (typeof parsed === "object" && parsed !== null) {
              variantEntries = Object.entries(parsed);
            }

            maxOptionsCount = Math.max(maxOptionsCount, variantEntries.length);
            variantEntries.forEach(([key, value], idx) => {
              expanded[`option${idx + 1}_name`] = key;
              expanded[`option${idx + 1}_value`] = value;
            });
          } catch (e) {
          }
        }

        delete expanded.variants_options;
        return flattenObject(expanded);
      });

      const allProducts = expandedProducts;

      const optionHeaders: string[] = [];
      for (let i = 1; i <= maxOptionsCount; i++) {
        optionHeaders.push(`option${i}_name`, `option${i}_value`);
      }

      const headers = selection === "all" ? [...Object.keys(allProducts[0]).filter((h) => !excludedFields.includes(h)), ...optionHeaders,] :
        [...fieldsToSend.filter((h) => !excludedFields.includes(h) && h !== "variants_options"), ...(fieldsToSend.includes("variants_options") ? optionHeaders : []),];
      const rows = allProducts.map((row: any) =>
        headers
          .map((field) => {
            const val = row[field];
            if (val == null) return "";
            return typeof val === "string"
              ? `"${val.replace(/"/g, '""')}"`
              : val;
          })
          .join(",")
      );

      const csvContent = `${headers.join(",")}\n${rows.join("\n")}`;
      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", `products_${selection}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setOpen(false);
      setScreen(0);
      setSelectedFields([]);
      setSelection("all");
    } catch (err: any) {
      toast.error(err.message || "Failed to export CSV.", { autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const formatLabel = (field: string) =>
    field.replace(/_/g, " ").toUpperCase();

  return (
    <>
      <button onClick={handleOpen} className="flex items-center gap-2 border border-gray-800 text-gray-800 px-3 py-1.5 rounded-md hover:bg-gray-100 transition text-sm " >
        <ArrowUpTrayIcon className="w-4 h-4" />
        Export CSV
      </button>


      {open && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-[95%] sm:w-full sm:max-w-2xl p-8 relative animate-fadeIn">
            <button onClick={handleClose} className="absolute top-4 right-4 text-gray-600 hover:text-gray-900" >
              <XMarkIcon className="w-4 h-4" />
            </button>

            <h2 className="text-2xl font-bold mb-4 text-gray-800">Export Products</h2>
            <hr className="mb-4" />

            <div className="max-h-[400px] overflow-y-auto custom-scroll pr-2">
              {screen === 0 && (
                <div className="space-y-4">
                  <label className="flex items-center gap-3">
                    <input type="radio" checked={selection === "all"} onChange={() => setSelection("all")} className="w-5 h-5 text-orange-600" />
                    <span className="text-gray-700 text-lg">
                      CSV file with all fields
                    </span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="radio" checked={selection === "selected"} onChange={() => setSelection("selected")} className="w-5 h-5 text-orange-600" />
                    <span className="text-gray-700 text-lg">
                      CSV file with selected fields
                    </span>
                  </label>
                </div>
              )}

              {screen === 1 && (
                <div className="grid grid-cols-2 gap-2">
                  {allFields.map((field) => (
                    <label key={field} className="flex items-center gap-2 text-gray-700" >
                      <input type="checkbox"
                        checked={selectedFields.includes(field) || mandatoryFields.includes(field)
                        } disabled={mandatoryFields.includes(field)} onChange={() => handleCheckboxChange(field)} className="w-4 h-4 accent-orange-600" />
                      <span className={mandatoryFields.includes(field) ? "font-semibold text-gray-800" : ""} >
                        {formatLabel(field)}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <hr className="my-4" />

            <div className="flex justify-end gap-3">
              <button onClick={handleClose} disabled={loading} className="px-4 py-2 border rounded-md text-gray-800 hover:bg-gray-100" >
                Cancel
              </button>

              {screen === 1 && (
                <button onClick={() => setScreen(0)} className="px-4 py-2 border rounded-md text-gray-800 hover:bg-gray-100" >
                  Previous
                </button>
              )}

              <button onClick={handleNext} disabled={loading} className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-md disabled:opacity-60" >
                {screen === 1 || selection === "all" ? loading ? "Exporting..." : "Export" : "Next"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExportCSV;