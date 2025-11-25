import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import CustomFields from "./Add-CustomFields";
import axiosInstance from "../../../Services/axiosInstance";
import { closeLoading, showLoading } from "../../../General/Loader";
import { PencilIcon, TrashIcon } from "lucide-react";
import { Dialog } from "@mui/material";
import ConfirmDialog from "../../../General/General-Delete-Dialoge";

const CustomFieldsList = () => {
  const [fields, setFields]: any = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [page, setPage] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchCustomFields = async () => {
    showLoading(3000);
    setLoading(true);
    try {
      const response: any = await axiosInstance.get(`/custom-fields`);
      const validFields = (response.data || []).filter(
        (field: any) =>
          field &&
          field.id &&
          field.fieldName &&
          field.fieldType &&
          field.customField
      );
      setFields(validFields);
    } catch (error) {
      toast.error("Failed to fetch custom fields");
    } finally {
      closeLoading();
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomFields();
  }, []);

  const handleEdit = (field: any) => {
    setEditingField(field);
    setOpen(true);
  };


  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      showLoading(3000);
      await axiosInstance.delete(`/custom-fields/${deleteId}`);
      toast.success("Field deleted successfully!");
      setFields((prev: any) => prev.filter((f: any) => f.id !== deleteId));
    } catch (error) {
      toast.error("Failed to delete field");
    } finally {
      setConfirmOpen(false);
      setDeleteId(null);
      closeLoading();
    }
  };


  const handleSave = async (savedField: any) => {
    setFields((prev: any) => {
      const existingIndex: any = prev.findIndex((f: any) => f.id === savedField.id);
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = savedField;
        return updated;
      } else {
        return [...prev, savedField];
      }
    });

    setOpen(false);
    setEditingField(null);

    try {
      await fetchCustomFields();
    } catch (error) { }
  };

  const totalPages = Math.ceil(fields.length / rowsPerPage);
  const paginatedFields = fields.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <div>
      <div className="flex justify-end mb-4 pr-3">
        <button
          onClick={() => {
            setEditingField(null);
            setOpen(true);
          }}
          className="inline-flex items-center bg-[#fc4e15] text-white px-4 py-2 rounded-md hover:bg-[#e24412] transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Custom Field
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div
          className="overflow-y-auto custom-scrollbar"
          style={{
            maxHeight: "calc(100vh - 376px)",
            height: "calc(100vh - 376px)",
          }}
        >
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 border-t border-gray-200">
                  Field Name
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 border-t border-gray-200">
                  Field Type
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 border-t border-gray-200">
                  Field Key
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 border-t border-gray-200">
                  Section
                </th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700 border-t border-gray-200">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {fields.length === 0 && !loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-10 text-gray-500"
                    style={{
                      height: "calc(100vh - 434px)",
                      maxHeight: "calc(100vh - 434px)",
                    }}
                  >
                    No custom fields added yet.
                  </td>
                </tr>
              ) : (
                paginatedFields.map((field: any, idx: any) => (
                  <tr
                    key={idx}
                    className="hover:bg-gray-50 border-t border-gray-100"
                  >
                    <td className="px-4 py-3">{field.fieldName || "-"}</td>
                    <td className="px-4 py-3">{field.fieldType || "-"}</td>
                    <td className="px-4 py-3">{field.customField || "-"}</td>
                    <td className="px-4 py-3">{field.section || "-"}</td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(field)}
                        className="inline-flex items-center justify-center p-1 text-gray-700 hover:text-[#fc4e15] transition"
                      >
                        <PencilIcon className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteId(field.id);
                          setConfirmOpen(true);
                        }}
                        className="inline-flex items-center justify-center p-1 text-gray-700 hover:text-red-600 ml-2 transition"
                      >
                        <TrashIcon className="w-4 h-4 inline" />
                      </button>

                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between p-3 border-t border-gray-200 bg-gray-50 text-sm">
          <div>
            Rows per page:{" "}
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(parseInt(e.target.value));
                setPage(0);
              }}
              className="border rounded px-2 py-1 ml-2"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span>
              Page {page + 1} of {totalPages || 1}
            </span>
            <button
              onClick={() => page > 0 && setPage(page - 1)}
              disabled={page === 0}
              className={`px-2 py-1 border rounded ${page === 0
                ? "text-gray-400 cursor-not-allowed"
                : "hover:bg-gray-100"
                }`}
            >
              Prev
            </button>
            <button
              onClick={() => page < totalPages - 1 && setPage(page + 1)}
              disabled={page >= totalPages - 1}
              className={`px-2 py-1 border rounded ${page >= totalPages - 1
                ? "text-gray-400 cursor-not-allowed"
                : "hover:bg-gray-100"
                }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {open && (
        <Dialog open={open} maxWidth="md" fullWidth onClose={() => setOpen(false)}>
          <CustomFields
            onSave={handleSave}
            onClose={() => {
              setOpen(false);
              setEditingField(null);
            }}
            editingField={editingField}
          />
        </Dialog>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(true)}
        onConfirm={confirmDelete}
        title="Delete Custom Field"
        message="Are you sure you want to delete this custom field? This action cannot be undone."
        cancelText="Cancel"
        confirmText="Delete"
      />
    </div>
  );
};

export default CustomFieldsList;
