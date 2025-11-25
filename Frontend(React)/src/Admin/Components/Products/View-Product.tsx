import React from "react";
import { BASE_URL } from "../../../config";

interface ViewProductProps {
  open: boolean;
  onClose: () => void;
  viewProduct: any;
  getCategoryName: (id: number) => string;
  getBrandName: (id: number) => string;
}

const ViewProduct: React.FC<ViewProductProps> = ({
  open,
  onClose,
  viewProduct,
  getCategoryName,
  getBrandName,
}) => {
  if (!open) return null;

  const variantOptions = viewProduct?.variants_options
    ? JSON.parse(viewProduct.variants_options)
    : null;

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-[9999] transition-all duration-300 ${open ? "opacity-100 visible" : "opacity-0 invisible"}`} >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} ></div>

      <div className="relative bg-white w-[95%] max-w-6xl max-h-[80vh] overflow-hidden rounded-2xl shadow-xl flex flex-col border border-gray-200">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            {viewProduct?.name || "Product Details"}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700 transition" >
            ✕
          </button>
        </div>

        <div className="flex flex-col px-6 py-4 overflow-y-auto custom-scrollbar">
          {viewProduct?.images?.length ? (
            <div className="flex flex-wrap gap-3 mb-4">
              {viewProduct.images.map((img: any, i: number) => {
                const imageUrl =
                  img.url ||
                  (img.image_path ? `${BASE_URL}/${img.image_path}` : undefined);
                const isMain = img.isPrimary;

                return (
                  <div key={i}
                    className={`flex items-center justify-center rounded-lg overflow-hidden bg-gray-100 border ${isMain
                      ? "border-blue-500 w-44 h-44 sm:w-32 sm:h-32" : "border-gray-300 w-28 h-28 sm:w-20 sm:h-20"}`} >
                    {imageUrl ? (
                      <img src={imageUrl} alt={`img-${i}`} className="max-w-full max-h-full object-contain" />
                    ) : (
                      <span className="text-gray-400 text-sm">No Image</span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-gray-400 mb-4">
              No images available
            </div>
          )}

          <div className="overflow-y-auto max-h-[85vh] border rounded-lg custom-scrollbar">
            <table className="w-full text-sm text-left text-gray-700">
              <tbody>
                {[
                  ["Parent", viewProduct?.parentsku],
                  ["SKU", viewProduct?.sku],
                  ["Product Name", viewProduct?.name],
                  ["Quantity", viewProduct?.qty],
                  ["Cost Price", viewProduct?.cost_price ? `$${viewProduct.cost_price}` : "0"],
                  ["RRP", viewProduct?.rrp ? `$${viewProduct.rrp}` : "0"],
                  ["Store Price", viewProduct?.store_price ? `$${viewProduct.store_price}` : "0"],
                  ["Brand", getBrandName(viewProduct?.brand)],
                  ["Category", getCategoryName(viewProduct?.category_id)],
                  ["Subtitle", viewProduct?.subtitle],
                  ["Length (CM)", viewProduct?.length],
                  ["Cubic", viewProduct?.cubic],
                  ["Width (CM)", viewProduct?.width],
                  ["Height (CM)", viewProduct?.height],
                  ["Seo Title", viewProduct?.seo_title],
                  ["Seo Description", viewProduct?.seo_description],
                ]
                  .filter(([_, value]) => value !== undefined && value !== null && value !== "")
                  .map(([label, value], idx) => (
                    <tr key={idx} className={`border-b ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`} >
                      <td className="px-4 py-2 font-semibold w-2/5">{label}</td>
                      <td className="px-4 py-2">{value}</td>
                    </tr>
                  ))}

                {variantOptions && (
                  <>
                    <tr className="bg-gray-100 border-b">
                      <td colSpan={2} className="px-4 py-2 font-bold">
                        Variants
                      </td>
                    </tr>
                    {Object.entries(variantOptions).map(([key, value], i) => (
                      <tr key={i} className="border-b">
                        <td className="px-8 py-2 font-semibold capitalize">
                          {key}
                        </td>
                        <td className="px-4 py-2">{String(value)}</td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end border-t border-gray-200 px-6 py-3 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 rounded-md text-gray-700 hover:bg-gray-200 transition" >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewProduct;
