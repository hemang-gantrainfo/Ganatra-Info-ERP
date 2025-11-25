import React, { useState } from "react";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import API_URL from "../../../../config";
import { CloudUpload, FileDown, X } from "lucide-react";

interface ImportCSVProps {
    onSuccess?: () => void;
}

const ImportCSV: React.FC<ImportCSVProps> = ({ onSuccess }) => {
    const [open, setOpen] = useState(false);
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [readMode, setReadMode] = useState<
        "add_only" | "update_only" | "delete_and_add"
    >("add_only");
    const [loading, setLoading] = useState(false);

    const handleOpen = () => setOpen(true);
    const handleClose = () => {
        if (loading) return;
        setOpen(false);
        setCsvFile(null);
        setReadMode("add_only");
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];

            if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
                toast.error("Only CSV files are allowed.", { autoClose: 3000 });
                return;
            }

            if (file.size > 1048576) {
                toast.error("File size cannot exceed 1 MB.", { autoClose: 3000 });
                return;
            }

            setCsvFile(file);
        }
    };

    const handleSubmit = async () => {
        if (!csvFile) {
            toast.error("Please select a CSV file to import.", { autoClose: 3000 });
            return;
        }

        if (csvFile.size > 1048576) {
            toast.error("File size cannot exceed 1 MB.", { autoClose: 3000 });
            return;
        }

        setLoading(true);
        const renamedFile = new File([csvFile], "file.csv", { type: csvFile.type });
        const formData = new FormData();
        formData.append("csv_file", renamedFile);
        formData.append("read_mode", readMode);

        try {
            const response = await fetch(`${API_URL}/import-products`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error(`Import failed. Status: ${response.status}`);

            const result = await response.json();

            const addedCount = result.added?.length || 0;
            const updatedCount = result.updated?.length || 0;
            const skippedCount = result.skipped_rows_due_to_column_mismatch?.length || 0;


            if (onSuccess) onSuccess();
            handleClose();
            setLoading(false);
            setTimeout(() => {
                Swal.fire({
                    title: "Success",
                    html: `
                            <div style="font-size:15px; line-height:1.6; text-align:left;">
                                <p><strong>Mode:</strong> ${result.mode || readMode}</p>
                                <p><strong>Added:</strong> ${addedCount}</p>
                                <p><strong>Updated:</strong> ${updatedCount}</p>
                                <p><strong>Skipped:</strong> ${skippedCount}</p>
                            </div>
                        `,
                    icon: "success",
                    confirmButtonText: "Close",
                    confirmButtonColor: "#fc4e15",
                    width: 520,
                });
            }, 3000);

        } catch (err: any) {
            toast.error(err.message || "Failed to import CSV.", { autoClose: 3000 });
            setLoading(false);
        } finally {
        }
    };

    const handleDownloadSample = () => {
        const link = document.createElement("a");
        link.href = "/sample.csv";
        link.download = "Sample_Product.csv";
        link.click();
    };

    return (
        <>
            <button onClick={handleOpen}
                className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-800 text-gray-800 rounded-md hover:bg-gray-100 transition" >
                <FileDown className="w-4 h-4" />
                Import CSV
            </button>

            {open && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-8 relative animate-fadeIn">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">
                            Import Products
                        </h2>

                        <div
                            className="border-2 border-dashed border-orange-500 bg-orange-50 rounded-lg flex flex-col items-center justify-center h-40 cursor-pointer hover:bg-orange-100 transition"
                            onClick={() => document.getElementById("csv-input")?.click()} >
                            <CloudUpload className="w-10 h-10 text-orange-500" />
                            <p className="text-orange-600 font-medium mt-2">
                                Click or Drag & Drop to upload CSV
                            </p>

                            {csvFile && (
                                <div className="flex items-center gap-2 mt-2 text-sm text-gray-700">
                                    <span>Selected: {csvFile.name}</span>
                                    <button type="button"
                                        onClick={(e) => { e.stopPropagation(); setCsvFile(null); }} className="text-red-500 hover:text-red-700" >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            <input key={csvFile ? csvFile.name : "empty"} disabled={loading} id="csv-input" type="file" accept=".csv,text/csv" onChange={handleFileChange} className="hidden" />
                        </div>

                        <div className="mt-5">
                            <label htmlFor="read-mode" className="block text-sm font-medium text-gray-700 mb-1" >
                                Import Mode
                            </label>
                            <select id="read-mode" value={readMode} disabled={loading}
                                onChange={(e) => setReadMode(e.target.value as "add_only" | "update_only" | "delete_and_add")}
                                className="w-full border rounded-md px-3 py-2 text-gray-800 focus:ring-2 focus:ring-orange-400 focus:outline-none" >
                                <option value="add_only">Add Only</option>
                                <option value="update_only">Update Only</option>
                                <option value="delete_and_add">Delete and Add</option>
                            </select>
                        </div>

                        <p className="text-sm text-gray-600 mt-3">
                            Download a{" "}
                            <span onClick={handleDownloadSample} className="text-blue-600 hover:underline cursor-pointer" >
                                CSV template
                            </span>{" "}
                            to see an example of the format required.
                        </p>

                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={handleClose} className="px-4 py-2 text-sm rounded-md border border-gray-400 text-gray-700 hover:bg-gray-100 transition" >
                                Cancel
                            </button>

                            <button onClick={handleSubmit} disabled={!csvFile || loading}
                                className={`px-5 py-2 text-sm rounded-md text-white font-medium transition flex items-center justify-center gap-2 ${!csvFile || loading
                                    ? "bg-orange-400 opacity-70 cursor-not-allowed" : "bg-orange-600 hover:bg-orange-700"}`} >
                                {loading && (
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" >
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" ></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" ></path>
                                    </svg>
                                )}
                                {loading ? "Processing..." : "Submit"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ImportCSV;
