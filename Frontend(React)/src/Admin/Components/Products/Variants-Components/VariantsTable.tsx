import { CameraIcon, PencilIcon, TrashIcon } from "lucide-react";
import React from "react";

interface VariantImage {
  url: string;
  type: string;
}

interface Variant {
  id?: number;
  name: string;
  sku: string;
  qty: string | number;
  price: string | number;
  option?: Record<string, string>;
  images?: VariantImage[];
}

interface VariantsTableProps {
  variants: Variant[];
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}

const styleHeader =
  "bg-gray-200 font-bold h-10 px-3 py-2 text-sm text-left border-b border-gray-300";

const VariantsTable: React.FC<VariantsTableProps> = ({ variants, onEdit, onDelete }) => {
  if (!variants || variants.length === 0) return <div className="mt-2"></div>;

  const flatVariants: Variant[] = variants
    .flatMap((v) => (Array.isArray(v) ? v : [v]))
    .map((v) => {
      let images: VariantImage[] = [];

      if (v.images) {
        images = v.images;
      } else {
        images = [
          ...(v.mainImages || []).map((img: any) => ({ ...img, type: "main" })),
          ...(v.altImages || []).map((img: any) => ({ ...img, type: "alt" })),
        ];
      }

      return { ...v, images };
    });

  return (
    <div className="mt-2 w-full overflow-x-auto rounded-md border border-gray-300 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className={styleHeader}>Image</th>
            <th className={styleHeader}>Name</th>
            <th className={styleHeader}>SKU</th>
            <th className={styleHeader}>Qty</th>
            <th className={styleHeader}>Price</th>
            <th className={styleHeader}>Options</th>
            <th className={`${styleHeader} text-center`}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {flatVariants.map((v, idx) => (
            <tr key={idx} className="hover:bg-gray-50 border-b border-gray-200 transition" >
              <td className="px-3 py-2">
                {v.images && v.images.length > 0 ? (
                  <div className="flex items-center gap-2">
                    {v.images.slice(0, 3).map((img, i) => (
                      <div key={i} className="relative group cursor-pointer" title={img.type} >
                        <div className="w-9 h-9 rounded border border-gray-300 overflow-hidden">
                          <img src={img.url} className="w-full h-full object-cover" alt={img.type} />
                        </div>
                      </div>
                    ))}

                    {v.images.length > 3 && (
                      <span className="text-xs text-gray-500 self-center">
                        +{v.images.length - 3}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="w-10 h-10 flex items-center justify-center text-gray-400 cursor-pointer" onClick={() => onEdit(idx)} >
                    <CameraIcon className="w-10 h-10" />
                  </div>
                )}
              </td>

              <td className="px-3 py-2">{v.name}</td>
              <td className="px-3 py-2">{v.sku}</td>
              <td className="px-3 py-2">{v.qty || "0"}</td>
              <td className="px-3 py-2">${v.price || "0"}</td>
              <td className="px-3 py-2">
                {v.option &&
                  Object.entries(v.option).map(([key, value]) => (
                    <div key={key} className="text-sm">
                      <strong>{key}:</strong> {value}
                    </div>
                  ))}
              </td>

              <td className="px-3 py-2 text-center">
                <button className="inline-flex items-center text-gray-800 mr-2 hover:text-[#fc4e15]" onClick={() => onEdit(idx)} >
                  <PencilIcon className="w-5 h-5 inline" />
                </button>

                <button className="inline-flex items-center text-gray-800 hover:text-[#fc4e15]" onClick={() => onDelete(idx)} >
                  <TrashIcon className="w-5 h-5 inline" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default VariantsTable;
