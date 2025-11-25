import React, { useEffect, useState } from "react";
import { Box, Button, TextField, FormControl, Select, MenuItem, Typography } from "@mui/material";
import { SelectChangeEvent } from "@mui/material/Select";
import axios from "axios";
import AdminHeader from "../Header-Footer/Admin-Header";
import Footer from "../Header-Footer/Footer";
import API_URL from "../../../config";
import { toast } from "react-toastify";
import { closeLoading, showLoading } from "../../../General/Loader";

type FieldType =
  | ""
  | "Dropdown"
  | "Short Text"
  | "Text"
  | "Description"
  | "Date"
  | "Integer Number"
  | "Decimal Number"
  | "True/False";

type SelectionType = "Single selection" | "Multiple selection";

export interface CustomFieldData {
  id: string | number;
  customField: string;
  fieldName: string;
  fieldType: FieldType;
  selectionType?: SelectionType;
  options?: string;
  section: string;
  fieldDescription: string;
  descriptionOptions?: string;
}

interface CustomFieldsProps {
  onSave: (data: CustomFieldData) => void;
  onClose: () => void;
  initialData?: CustomFieldData;
  editingField?: CustomFieldData | null;
}

const allFieldTypes: FieldType[] = [
  "Text",
  "Description",
  "Integer Number",
  "Decimal Number",
  "Date",
  "Short Text",
  "True/False",
  "Dropdown",
];

const CustomFields: React.FC<CustomFieldsProps> = ({
  onSave,
  onClose,
  initialData,
  editingField
}) => {
  const [formData, setFormData] = useState<CustomFieldData>({
    id: "",
    customField: "",
    fieldName: "",
    fieldType: "",
    selectionType: "Single selection",
    options: "",
    section: "",
    fieldDescription: "",
    descriptionOptions: "",
    ...initialData,
  });

  const [fieldCharactersLeft, setFieldCharactersLeft] = useState(28);
  const [customFieldOptions, setCustomFieldOptions] = useState<any[]>([]);
  const sectionOptions = [
    "Basic Information",
    "Description",
    "Images",
    "Pricing",
    "Offers",
    "Others",
    "Product Variations",
    "Shipping",
  ];
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (editingField) {
      setFormData(editingField);
    }
  }, [editingField]);

  useEffect(() => {
    const fetchCustomFields = async () => {
      showLoading(3000);
      try {
        const response: any = await axios.get(`${API_URL}/custom-fields/list`);
        const fields = response.data.map((f: any) => ({ name: f.field_name }));
        setCustomFieldOptions(fields);

        if (initialData?.customField) {
          setFormData((prev) => ({
            ...prev,
            customField: initialData.customField,
          }));
        } else if (fields.length > 0) {
          setFormData((prev) => ({
            ...prev,
            customField: fields[0].name,
          }));
        }

        if (initialData?.fieldName) {
          setFieldCharactersLeft(28 - initialData.fieldName.length);
        }
      } catch (error) {
      } finally {
        closeLoading();
      }
    };
    fetchCustomFields();
  }, [initialData]);


  const handleChange = (
    event: any) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      delete newErrors[name];
      return newErrors;
    });

    if (name === "fieldName") setFieldCharactersLeft(28 - value.length);
  };

  const handleSelectionTypeChange = (event: any) => {
    setFormData((prev) => ({
      ...prev,
      selectionType: event.target.value as SelectionType,
    }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.customField)
      newErrors.customField = "Custom Field is required";
    if (!formData.fieldName) newErrors.fieldName = "Field Name is required";
    if (!formData.fieldType) newErrors.fieldType = "Field Type is required";
    if (formData.fieldType === "Dropdown" && !formData.options)
      newErrors.options = "Options are required for Dropdown";
    if (!formData.section) newErrors.section = "Section is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    const payload: any = {
      customField: formData.customField,
      fieldName: formData.fieldName,
      fieldType: formData.fieldType,
      fieldDescription: formData.fieldDescription,
      options:
        formData.fieldType === "Dropdown" && formData.options
          ? Array.from(
            new Set(
              formData.options
                .split(/\n|,/)
                .map((opt) => opt.trim())
                .filter(Boolean)
            )
          ).join(",")
          : undefined,
      section: formData.section,
      selectionType:
        formData.fieldType === "Dropdown" ? formData.selectionType : undefined,
    };

    try {
      if (editingField) {
        const url = `${API_URL}/custom-fields/${editingField.id}?_method=PUT`;

        await axios.post(url, payload, {
          headers: { "Content-Type": "application/json" },
        });

        toast.success("Field updated successfully!", { autoClose: 3000 });
      } else {
        await axios.post(`${API_URL}/custom-fields`, payload, {
          headers: { "Content-Type": "application/json" },
        });

        toast.success("Field saved successfully!", { autoClose: 3000 });
      }

      onSave(payload);
      onClose();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        "Failed to save custom field. Please try again.";
      toast.error(errorMessage, { autoClose: 3000 });
    }
  };

  const descriptionOptionsArray = formData.descriptionOptions ? formData.descriptionOptions.split(",").map((o) => o.trim()) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl flex flex-col max-h-[85vh]">
        <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-semibold">Custom Field Configuration</h2>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-grow custom-scrollbar">
          <div className="flex gap-4 mb-4 flex-wrap">
            <div className="flex-grow basis-full sm:basis-[45%]">
              <label className="font-bold text-sm">Custom Field*</label>
              <select
                name="customField"
                value={formData.customField}
                disabled={!!editingField}
                onChange={handleChange}
                className="w-full h-10 border rounded px-2 mt-1 disabled:opacity-70 disabled:cursor-not-allowed bg-white"
              >
                <option value="">Select field</option>
                {customFieldOptions.map((f: any) => (
                  <option key={f.name} value={f.name}>
                    {f.name}
                  </option>
                ))}
              </select>
              {errors.customField && (
                <p className="text-red-600 text-xs mt-1">{errors.customField}</p>
              )}
            </div>

            <div className="flex-grow basis-full sm:basis-[45%]">
              <label className="font-bold text-sm">Field Name*</label>
              <input
                name="fieldName"
                value={formData.fieldName}
                onChange={handleChange}
                required
                maxLength={28}
                className={`w-full border rounded px-3 h-10 mt-1 ${errors.fieldName ? "border-red-500" : ""
                  }`}
              />
              <p className="text-xs text-gray-500 mt-1">
                {errors.fieldName || `${fieldCharactersLeft} characters left`}
              </p>
            </div>
          </div>

          <div className="flex gap-4 mb-4 flex-wrap">
            <div
              className={`flex-grow ${formData.fieldType === "Dropdown"
                ? "sm:basis-[45%]"
                : "sm:basis-full"
                }`}
            >
              <label className="font-bold text-sm">Field Type*</label>
              <select
                name="fieldType"
                value={formData.fieldType}
                onChange={handleChange}
                className="w-full h-10 border rounded px-2 mt-1"
              >
                <option value="">Select type</option>
                {allFieldTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.fieldType && (
                <p className="text-red-600 text-xs mt-1">{errors.fieldType}</p>
              )}
            </div>

            {formData.fieldType === "Dropdown" && (
              <div className="flex-grow basis-full sm:basis-[45%]">
                <label className="font-bold text-sm">Selection Type*</label>
                <select
                  name="selectionType"
                  value={formData.selectionType}
                  onChange={handleSelectionTypeChange}
                  className="w-full h-10 border rounded px-2 mt-1"
                >
                  <option value="Single selection">Single selection</option>
                  <option value="Multiple selection">Multiple selection</option>
                </select>
              </div>
            )}
          </div>

          {formData.fieldType === "Dropdown" && (
            <div className="mb-4 w-full">
              <label className="font-bold text-sm">
                Dropdown (One option per line)*
              </label>
              <textarea
                name="options"
                value={formData.options}
                onChange={handleChange}
                rows={8}
                className={`w-full border rounded p-2 mt-1 ${errors.options ? "border-red-500" : ""
                  }`}
                placeholder="Enter each option on a new line."
              />
              <p className="text-xs text-gray-500 mt-1">
                {errors.options || "Enter each option on a new line."}
              </p>
            </div>
          )}

          <div className="flex gap-4 mb-4 flex-wrap">
            <div className="w-full">
              <label className="font-bold text-sm">Section*</label>
              <select
                name="section"
                value={formData.section}
                onChange={handleChange}
                className="w-full h-10 border rounded px-2 mt-1"
              >
                <option value="">Select section</option>
                {sectionOptions.map((section, index) => (
                  <option key={index} value={section}>
                    {section}
                  </option>
                ))}
              </select>
              {errors.section && (
                <p className="text-red-600 text-xs mt-1">{errors.section}</p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <label className="font-bold text-sm">Field Description</label>
            {formData.fieldType === "Description" &&
              descriptionOptionsArray.length > 0 ? (
              <select
                name="descriptionOptions"
                value={formData.descriptionOptions}
                onChange={handleChange}
                className="w-full h-10 border rounded px-2 mt-1"
              >
                {descriptionOptionsArray.map((opt, i) => (
                  <option key={i} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <textarea
                name="fieldDescription"
                value={formData.fieldDescription}
                onChange={handleChange}
                rows={4}
                className="w-full border rounded p-2 mt-1"
              />
            )}
          </div>
        </div>

        <div className="p-4 sm:p-6 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-400 rounded hover:bg-gray-100 text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded text-white bg-orange-600 hover:bg-orange-700"
          >
            {editingField ? "Update" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomFields;
