import React, { lazy, useEffect, useRef, useState } from "react";
import { Dialog, Box, Button, Typography, FormControl, Select, MenuItem, IconButton, TextField, Stack, Checkbox, FormControlLabel } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import LibraryAddOutlinedIcon from "@mui/icons-material/LibraryAddOutlined";
import AddCategory from "../Category/Add-Category";
import ImageUploader from "./Upload-Image";
import FormField from "./Form-Fields/FormField";
import AdminHeader from "../Header-Footer/Admin-Header";
import Footer from "../Header-Footer/Footer";
import CustomFieldRenderer from "./Form-Fields/CustomFieldRenderer";
import VariantsTable from "./Variants-Components/VariantsTable";
import { productFields } from "./Product-Services/ProductFields";
import AddBrands from "../Brands/Add-Brands";
import API_URL from "../../../config";
import axios from "axios";
import DeleteIcon from "@mui/icons-material/Delete";
import { EditorProvider, Editor, Toolbar, BtnBold, BtnItalic, BtnUnderline, BtnStrikeThrough, BtnNumberedList, BtnBulletList, BtnLink, BtnUndo, BtnRedo, BtnClearFormatting, BtnStyles, Separator } from "react-simple-wysiwyg";
import OptionValueManager from "./OptionValueManager";
import { closeLoading, showLoading } from "../../../General/Loader";
import { PlusSquare } from "lucide-react";

const AddVariantsDialog = lazy(() => import("./Variants-Components/Add-Product-Variation"));

interface AddProductDialogProps {
    open: boolean;
    onClose: () => void;
    editingProduct: any | null;
    formData: Record<string, any>;
    setFormData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
    errors: Record<string, string>;
    setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    categories: any[];
    brands: any[];
    customFields: any[];
    requiredFieldsMap: Record<string, boolean>;
    userRole: string | undefined;
    shopifyStatus: number;
    maropostStatus: number;
    mainImages: { url: string; isPrimary?: boolean }[];
    setMainImages: React.Dispatch<React.SetStateAction<{ url: string; isPrimary?: boolean }[]>>;
    altImages: { url: string }[];
    setAltImages: React.Dispatch<React.SetStateAction<{ url: string }[]>>;
    handleSubmit: () => void;
    openAddCategoryDialog: boolean;
    openAddBrandDialog: boolean;
    setOpenAddCategoryDialog: React.Dispatch<React.SetStateAction<boolean>>;
    setOpenAddBrandDialog: React.Dispatch<React.SetStateAction<boolean>>;
    newCategoryName: string;
    setNewCategoryName: React.Dispatch<React.SetStateAction<string>>;
    handleSaveCategory: () => void;
    handleSaveBrand: () => void;
    handleCloseAddCategoryDialog: () => void;
    handleCloseAddBrandDialog: () => void;
}

const AddProductDialog: React.FC<AddProductDialogProps> = ({
    open,
    onClose,
    editingProduct,
    formData,
    setFormData,
    errors,
    brands,
    setErrors,
    categories,
    requiredFieldsMap,
    mainImages,
    setMainImages,
    altImages,
    setAltImages,
    handleSubmit,
    openAddCategoryDialog,
    openAddBrandDialog,
    setOpenAddCategoryDialog,
    setOpenAddBrandDialog,
    newCategoryName,
    setNewCategoryName,
    handleSaveCategory,
    handleSaveBrand,
    handleCloseAddCategoryDialog,
    handleCloseAddBrandDialog,
    customFields,
}) => {
    const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [activeSection, setActiveSection] = useState(0);
    const [openVariationDialog, setOpenVariationDialog] = useState(false);
    const [variants, setVariants] = useState<any[]>([]);
    const [editingVariationIndex, setEditingVariationIndex] = useState<number | null>(null);
    const [variationToEdit, setVariationToEdit] = useState<any | null>(null);
    const mainContentRef = useRef<HTMLDivElement | null>(null);
    const [container, setContainer] = useState<HTMLDivElement | null>(null);
    const [sidebarWidth, setSidebarWidth] = useState(50);
    const [parentSku, setParentSku] = useState<string>("");
    const [manualActiveSection, setManualActiveSection] = useState<number | null>(null);
    const apiCallCache: any = useRef({});
    const [variantOptions, setVariantOptions] = useState<Array<{ id: string, name: string, value: string }>>([]);
    const [variantErrors, setVariantErrors] = useState<Array<any>>([]);
    const [availableOptionNames, setAvailableOptionNames] = useState<string[]>([]);
    const [availableOptionValues, setAvailableOptionValues] = useState<Record<number, string[]>>({});
    const [optionValueDialog, setOptionValueDialog] = useState<{
        open: boolean;
        type: "option" | "value";
        optionIndex?: number | null;
    }>({ open: false, type: "option", optionIndex: null });

    useEffect(() => {
        const fetchParentSku = async () => {
            if (editingProduct?.parent_id) {
                const productId = editingProduct.parent_id;
                if (apiCallCache.current[productId] === true) {
                    return;
                }

                setFormData((prev) => ({ ...prev, variantsId: editingProduct.id }));
                try {
                    const res: any = await axios.get(`${API_URL}/products/${productId}`);
                    if (res.data?.product?.sku) {
                        setParentSku(res.data.product.sku);
                    } else {
                        setParentSku("");
                    }
                    apiCallCache.current[productId] = true;

                } catch (err) {
                    setParentSku("");
                    apiCallCache.current[productId] = true;
                }
            } else {
                setParentSku("");
            }
        };
        fetchParentSku();
    }, [editingProduct]);

    React.useEffect(() => {
        showLoading(3000);
        const opts = editingProduct?.variants_options;
        if (!opts) {
            setVariantOptions([]);
            return;
        }

        let parsedOptions: any[] = [];

        try {
            if (typeof opts === "string") {
                const parsed = JSON.parse(opts);
                parsedOptions = Array.isArray(parsed) ? parsed : typeof parsed === "object"
                    ? Object.entries(parsed).map(([key, value]) => ({
                        id: key,
                        name: key,
                        value: value,
                    }))
                    : [];
            } else if (Array.isArray(opts)) {
                parsedOptions = opts;
            } else if (typeof opts === "object" && opts !== null) {
                const keys = Object.keys(opts);
                if (keys.includes("name") && keys.includes("value")) {
                    parsedOptions = [opts];
                } else if (!keys.includes("created_at")) {
                    parsedOptions = Object.entries(opts).map(([key, value]) => ({
                        id: key,
                        name: key,
                        value: value,
                    }));
                } else {
                    parsedOptions = [];
                }
            }
        } catch (error) {
        }

        parsedOptions = parsedOptions.map((opt) => ({
            id: opt.id || crypto.randomUUID(),
            name: opt.name || "",
            value: opt.value || "",
        }));

        setVariantOptions(parsedOptions);

        if (parsedOptions.length > 0) {
            setTimeout(async () => {
                for (let index = 0; index < parsedOptions.length; index++) {
                    const opt = parsedOptions[index];
                    if (opt.name) {
                        await handleOptionNameChange(index, opt.name);
                    }
                }

                setTimeout(() => {
                    setVariantOptions(prev => {
                        const updated = [...prev];
                        parsedOptions.forEach((opt, index) => {
                            if (index < updated.length && opt.value) {
                                updated[index] = {
                                    ...updated[index],
                                    value: opt.value
                                };
                            }
                        });
                        return updated;
                    });
                }, 200);
            }, 100);
        }
        closeLoading();
    }, [editingProduct]);


    const scrollToSection = (index: number) => {
        const section = sectionRefs.current[index];
        if (section && container) {
            setManualActiveSection(index);
            const containerTop = container.getBoundingClientRect().top;
            const sectionTop = section.getBoundingClientRect().top;
            const offset = 40;
            const scrollOffset = sectionTop - containerTop + container.scrollTop - offset;
            container.scrollTo({ top: scrollOffset, behavior: "smooth" });
            setActiveSection(index);
        }
    };

    useEffect(() => {
        if (container) {
            const handleScroll = () => {
                if (manualActiveSection !== null) return;
                if (!sectionRefs.current.length) return;
                const containerTop = container.getBoundingClientRect().top;
                let closestIndex = 0;
                let minDistance = Infinity;
                sectionRefs.current.forEach((section, idx) => {
                    if (!section) return;
                    const rect = section.getBoundingClientRect();
                    const distance = Math.abs(rect.top - containerTop);
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestIndex = idx;
                    }
                });

                setActiveSection(closestIndex);
            };

            container.addEventListener("scroll", handleScroll);
            const handleWheelOrTouch = () => setManualActiveSection(null);
            container.addEventListener("wheel", handleWheelOrTouch);
            container.addEventListener("touchmove", handleWheelOrTouch);

            return () => {
                container.removeEventListener("scroll", handleScroll);
                container.removeEventListener("wheel", handleWheelOrTouch);
                container.removeEventListener("touchmove", handleWheelOrTouch);
            };
        }

        if (editingProduct) {
            const updatedFormData: any = { ...editingProduct };
            if (editingProduct.promo_start) {
                updatedFormData.promo_start = editingProduct.promo_start.split("T")[0];
            }
            if (editingProduct.promo_end) {
                updatedFormData.promo_end = editingProduct.promo_end.split("T")[0];
            }

            customFields.forEach((f) => {
                const fieldName = f.customField;
                const matchingKey = Object.keys(editingProduct).find(
                    (key) => key.toLowerCase() === fieldName.toLowerCase()
                );

                if (matchingKey) {
                    updatedFormData[fieldName] = editingProduct[matchingKey];
                } else if (editingProduct.custom_fields && editingProduct.custom_fields[fieldName] !== undefined) {
                    updatedFormData[fieldName] = editingProduct.custom_fields[fieldName];
                }
            });

            setFormData(updatedFormData);

            if (Array.isArray(editingProduct.variants) && editingProduct.parent_id == null) {
                const formattedVariants = editingProduct.variants.map((variant: any) => ({
                    id: variant.id,
                    name: variant.name || "",
                    sku: variant.sku || "",
                    qty: variant.qty || "",
                    price: variant.cost_price || "",
                    store_price: variant.store_price || "",
                    rrp: variant.rrp || "",
                    option: variant.variant_options || {},
                    images: variant.images?.map((img: any) => ({
                        id: img.id,
                        url: img.image_path,
                        type: img.type,
                    })) || [],
                }));

                setVariants(formattedVariants);
                setFormData((prev) => ({ ...prev, variants: formattedVariants }));
            } else {
                setVariants([]);
            }
        }

        if (formData.promo_start && formData.promo_end) {
            if (formData.promo_end < formData.promo_start) {
                setFormData((prev) => ({ ...prev, promo_end: "" }));
            }
        }
    }, [
        container,
        manualActiveSection,
        editingProduct,
        customFields,
        setFormData,
        formData.promo_start,
        formData.promo_end,
    ]);

    const updatedProductFields = React.useMemo(() => {
        let result = productFields.map((section) => {
            const customFieldsForSection = customFields.filter(
                (f) => f.section === section.section
            );
            return {
                ...section,
                fields: [
                    ...section.fields,
                    ...customFieldsForSection.map((f) => ({
                        name: f.customField,
                        fieldType: f.fieldType,
                        label: f.fieldName,
                        type: "custom",
                        options: f.options ? f.options.split(",") : [],
                        layout: f.layout || "vertical",
                        selectionType: f.selectionType,
                        required: requiredFieldsMap[f.customField] ?? false,
                        fullWidth: true,
                    })),
                ],
            };
        });

        if (formData.parent_id) {
            const filtered = result.filter((section) => !["SEO", "Shipping", "Offers", "Description", "Others",].includes(section.section)).map((section) => {
                let updatedFields = section.fields;

                if (section.section === "Basic Information") {
                    updatedFields = updatedFields.filter(
                        (field) => !["subtitle", "brand"].includes(field.name)
                    );
                }

                updatedFields = updatedFields.filter(
                    (field) => field.type !== "custom"
                );

                return {
                    ...section,
                    fields: updatedFields,
                };
            });
            return filtered;
        }

        result = result.filter(
            (section) => !["Parent Product",].includes(section.section));
        return result;
    }, [formData.parent_id, customFields, requiredFieldsMap, productFields]);

    useEffect(() => {

        if (editingProduct == null) {
            setFormData((prev) => ({ ...prev, active: true }));
        }
    }, [editingProduct]);

    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            variants_options: variantOptions,
        }));
    }, [variantOptions]);

    const handleAddVariation = (newVariation: any) => {
        setVariants(prev => {
            const updatedVariants = editingVariationIndex !== null
                ? prev.map((v, idx) => idx === editingVariationIndex ? newVariation : v)
                : [...prev, newVariation];

            setFormData(prevForm => ({ ...prevForm, variants: updatedVariants }));
            return updatedVariants;
        });

        setEditingVariationIndex(null);
        setVariationToEdit(null);
    };

    const fetchOptionNames = async (): Promise<void> => {
        try {
            const optionsResponse: any = await axios.get(`${API_URL}/variant-keys`);
            const data = optionsResponse?.data?.data;

            if (Array.isArray(data)) {
                setAvailableOptionNames(data);
            } else {
                setAvailableOptionNames([]);
            }
        } catch (error) {
            setAvailableOptionNames([]);
        }
    };

    useEffect(() => {
        fetchOptionNames();
    }, []);

    const handleOptionNameChange = async (index: number, newName: string) => {
        const currentValue = variantOptions[index]?.value || "";

        setVariantOptions((prev) => {
            const updated = [...prev];
            updated[index] = {
                ...updated[index],
                name: newName,
                value: currentValue,
            };
            return updated;
        });

        setVariantErrors((prev) => {
            const newErrors = [...prev];
            if (newErrors[index]) newErrors[index].name = "";
            return newErrors;
        });

        if (newName) {
            try {
                const payload = { option_name: newName };
                const optionsValueResponse: any = await axios.post(`${API_URL}/variants-options`, payload)
                    .catch(error => {
                        return { data: { data: [] } };
                    });

                if (Array.isArray(optionsValueResponse?.data?.data)) {
                    setAvailableOptionValues((prev) => ({
                        ...prev,
                        [index]: optionsValueResponse.data.data,
                    }));
                } else {
                    setAvailableOptionValues((prev) => ({
                        ...prev,
                        [index]: [],
                    }));
                }
            } catch (error: any) {
                setAvailableOptionValues((prev) => ({
                    ...prev,
                    [index]: [],
                }));
            }
        } else {
            setAvailableOptionValues((prev) => ({
                ...prev,
                [index]: [],
            }));
        }
    };

    const handleOptionValueChange = (index: number, newValue: string) => {
        setVariantOptions((prev) => {
            return prev.map((item, i) =>
                i === index ? { ...item, value: newValue } : item
            );
        });


        setVariantErrors((prev) => {
            const newErrors = [...prev];
            if (newErrors[index]) newErrors[index].value = "";
            return newErrors;
        });
    };


    const getMissingRequiredFields = () => {
        const missing: string[] = [];
        const isVariant = formData.parent_id !== null && formData.parent_id !== "";
        const variantRequiredFields = ["cost_price", "rrp", "store_price", "qty", "name", "sku"];

        Object.entries(requiredFieldsMap).forEach(([fieldName, isRequired]) => {
            if (!isRequired) return;

            if (isVariant && !variantRequiredFields.includes(fieldName)) return;

            const value = formData[fieldName];
            if (
                value === undefined ||
                value === null ||
                value === "" ||
                (typeof value === "number" && isNaN(value))
            ) {
                missing.push(fieldName);
            }
        });

        return missing;
    };

    const handleChange = (e: any) => {
        const { name, value, type, checked } = e.target;
        const val = type === "checkbox" ? checked : value;
        setFormData((prev) => ({ ...prev, [name]: val }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
        if (name === "sku") {
            const duplicate = variants.some((variation) => variation.sku === val);
            if (duplicate)
                setErrors((prev) => ({ ...prev, sku: "Main SKU cannot be the same as a variation SKU" }));
        }
    };

    const handleSubmitWithValidation = () => {
        const missingFields = getMissingRequiredFields();
        if (missingFields.length > 0) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                missingFields.forEach((field) => {
                    newErrors[field] = "This field is required";
                });
                return newErrors;
            });

            const flatFields = updatedProductFields.flatMap((section) =>
                section.fields.map((field) => ({ ...field, section: section.section }))
            );

            const firstMissingField = flatFields.find((f) =>
                missingFields.includes(f.name)
            );

            if (firstMissingField) {
                const sectionIndex = updatedProductFields.findIndex(
                    (section) => section.section === firstMissingField.section
                );
                if (sectionIndex >= 0) scrollToSection(sectionIndex);
            }
            return;
        }

        const newVariantErrors: { name?: string; value?: string }[] = [];
        let hasError = false;

        variantOptions.forEach((opt, idx) => {
            const nameError = opt.name.trim() === "" ? "Option name is required" : "";
            const valueError = opt.value.trim() === "" ? "Option value is required" : "";

            if (nameError || valueError) {
                hasError = true;
                newVariantErrors[idx] = { name: nameError, value: valueError };
            } else {
                newVariantErrors[idx] = {};
            }
        });

        setVariantErrors(newVariantErrors);
        setFormData((prev) => ({
            ...prev,
            variants_options: variantOptions,
        }));
        if (hasError) return;
        handleSubmit();
    };

    const isFieldRequired = (fieldName: string) => requiredFieldsMap[fieldName];
    const [variantToDeleteIndex, setVariantToDeleteIndex] = useState<number | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const confirmDeleteVariant = (index: number) => {
        setVariantToDeleteIndex(index);
        setDeleteDialogOpen(true);
    };

    const handleDeleteVariants = async (index: number) => {
        const flatVariants: any[] = variants.flatMap(v => Array.isArray(v) ? v : [v]);

        const variant = flatVariants[index];
        if (!variant) return;

        if (variant.id) {
            try {
                await axios.delete(`${API_URL}/products/${variant.id}`);
            } catch (err) {
            }
        }

        let updatedVariants: any[] = [];
        let counter = 0;

        for (let v of variants) {
            if (Array.isArray(v)) {
                const filtered = v.filter(() => counter++ !== index);
                if (filtered.length) updatedVariants.push(filtered);
            } else {
                if (counter++ !== index) updatedVariants.push(v);
            }
        }

        setVariants(updatedVariants);
        setFormData(f => ({ ...f, variants: updatedVariants }));
    };

    const handleAddOptionClick = () => {
        setOptionValueDialog({
            open: true,
            type: "option",
            optionIndex: null
        });
    };

    const handleAddValueClick = (optionIndex: number) => {
        setOptionValueDialog({
            open: true,
            type: "value",
            optionIndex
        });
    };

    const handleSaveNewOption = (optionName: string) => {
        const trimmedName = optionName.trim();
        setAvailableOptionNames((prev) => [...prev, trimmedName]);
        const lastOptionIndex = variantOptions.length - 1;
        if (lastOptionIndex >= 0) {
            setTimeout(() => {
                handleOptionNameChange(lastOptionIndex, trimmedName);
            }, 0);
        }
    };

    const handleSaveNewValue = (valueName: string) => {
        if (optionValueDialog.optionIndex === null || optionValueDialog.optionIndex === undefined) return;

        const trimmedValue = valueName.trim();

        setAvailableOptionValues((prev) => {
            const updated = { ...prev };
            const currentList = updated[optionValueDialog.optionIndex!] || [];
            updated[optionValueDialog.optionIndex!] = [...currentList, trimmedValue];
            return updated;
        });

        if (optionValueDialog.optionIndex !== null) {
            setTimeout(() => {
                handleOptionValueChange(optionValueDialog.optionIndex!, trimmedValue);
            }, 0);
        }
    };

    return (
        <>
            <Dialog open={open} onClose={onClose} fullScreen disableEscapeKeyDown PaperProps={{ sx: { height: "100%", width: "100%" } }} >
                <AdminHeader setSidebarWidth={setSidebarWidth} />
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #ddd", }} >
                    <Box sx={{ fontWeight: 600, fontSize: 18 }}>
                        <LibraryAddOutlinedIcon sx={{ mr: 1 }} />
                        {editingProduct ? "Edit Product" : "Add New Product"}
                    </Box>
                    <IconButton onClick={onClose} sx={{ color: "gray" }}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                <Box sx={{ display: "flex", height: "calc(100% - 64px)", padding: { xs: "13px 0 0 0", md: "10px 0 85px 90px" }}} >
                    <Box sx={{ width: { xs: 115, md: 200 }, borderRight: "1px solid #ddd", px: 2, py: 5, overflowY: "auto", }} >
                        {updatedProductFields.map((section, index) => {
                            const isActive = activeSection === index;

                            return (
                                <Typography key={index} onClick={() => scrollToSection(index)}
                                    sx={{
                                        cursor: "pointer", fontWeight: isActive ? "bold" : "normal", mb: 1.2,
                                        color: isActive ? "#fc4e15" : "text.primary", "&:hover": { color: "#fc4e15" }, fontSize: { xs: "14px", md: "inherit" },
                                        borderLeft: isActive ? "2px solid #fc4e15" : "", paddingLeft: isActive ? 1 : 0, marginLeft: isActive ? "-10px" : 0,
                                    }} >
                                    {typeof section.section === "string"
                                        ? section.section.length > 10 && window.innerWidth < 900 ? section.section.slice(0, 10) + "..." : section.section : section.section}
                                </Typography>
                            );
                        })}
                    </Box>

                    <Box className="custom-scrollbar mb-5" ref={(el: any) => {
                        mainContentRef.current = el; setContainer(el);
                    }} sx={{ flex: 1, px: { xs: 2, md: 10 }, py: 2.5, pb: 50, mt:2, overflowY: "auto" }} >
                        {updatedProductFields.map((section, sectionIndex) => (
                            <Box key={sectionIndex} ref={(el: HTMLDivElement | null) => {
                                sectionRefs.current[sectionIndex] = el;
                            }} data-index={sectionIndex} sx={{ mb: 4 }} >

                                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 0.2, fontSize: "16px", color: "#343a40", }} >
                                    {section.section}
                                </Typography>

                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 1 }}>
                                    {section.fields.map((field: any, fieldIndex) => {
                                        const handleFieldChangeLocal = (e: any) => {
                                            if (field.name === "category" && e.target.value === "add_new") {
                                                setOpenAddCategoryDialog(true);
                                            } else if (field.name === "brand" && e.target.value === "add_brand") {
                                                setOpenAddBrandDialog(true);
                                            } else {
                                                handleChange(e);
                                            }
                                        };
                                        const labelWithRequired = field.label + (isFieldRequired(field.name) ? " *" : "");

                                        if (field.type === "custom") {
                                            return (
                                                <CustomFieldRenderer key={fieldIndex} field={{ ...field, label: labelWithRequired }} value={formData[field.name]}
                                                    onChange={handleFieldChangeLocal} error={errors[field.name]} editing={!!editingProduct} />
                                            );
                                        }

                                        if (field.name === "category") {
                                            return (
                                                <div key={fieldIndex} className="w-full">
                                                    <label className="block font-medium text-sm text-gray-700 mb-1">
                                                        {labelWithRequired}
                                                    </label>

                                                    <select name="category_id" value={formData.category_id || formData.category || ""} className="
                                                            block w-full h-10 rounded-md border border-gray-300 bg-white 
                                                            px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => {
                                                            if (e.target.value === "add_new") {
                                                                setOpenAddCategoryDialog(true);
                                                            } else {
                                                                handleChange(e);
                                                            }
                                                        }} >
                                                        <option value="">Please Select Any Category</option>

                                                        {categories.map((cat: any) => (
                                                            <option key={cat.id} value={cat.id}>
                                                                {cat.name}
                                                            </option>
                                                        ))}

                                                        <option value="add_new" className="bg-blue-50 text-black text-[16px]" >
                                                            + Add New Category
                                                        </option>
                                                    </select>
                                                </div>
                                            );
                                        }

                                        if (field.name === "brand") {
                                            return (
                                                <div key={fieldIndex} className="w-full">
                                                    <label className="block font-medium text-sm text-gray-700 mb-1">
                                                        {labelWithRequired}
                                                    </label>

                                                    <select name="brand" value={formData.brand || ""} className=" block w-full h-10 border border-gray-300 rounded-md bg-white 
                                                        px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => {
                                                            if (e.target.value === "add_brand") {
                                                                setOpenAddBrandDialog(true);
                                                            } else {
                                                                handleFieldChangeLocal(e);
                                                            }
                                                        }} >

                                                        <option value="">Please Select Any Brand</option>
                                                        {brands.map((brand: any) => (
                                                            <option key={brand.id} value={brand.id}>
                                                                {brand.name}
                                                            </option>
                                                        ))}

                                                        <option value="add_brand" className="bg-blue-50 text-black text-[16px]" >
                                                            + Add New Brand
                                                        </option>
                                                    </select>
                                                </div>
                                            );
                                        }
                                        if (field.name === "promo_end") {
                                            return (
                                                <FormField key={fieldIndex}
                                                    field={{
                                                        ...field, label: labelWithRequired, minDate: formData.promo_start,
                                                    }} value={formData[field.name]} onChange={handleChange} error={errors[field.name]} editing={!!editingProduct} />
                                            );
                                        }


                                        return (
                                            <FormField key={fieldIndex} field={{ ...field, label: labelWithRequired }}
                                                value={formData[field.name]} onChange={handleFieldChangeLocal} error={errors[field.name]} editing={!!editingProduct} editingProduct={editingProduct} />
                                        );
                                    })}
                                </Box>
                                {section.section === "Parent Product" && formData.parent_id && (
                                    <div className="mt-2">
                                        <label className="block font-medium text-sm mb-1">
                                            Parent Product Code (SKU)
                                        </label>

                                        <input type="text" className=" w-full h-10 rounded-md border border-gray-300 bg-gray-100 px-3 text-sm cursor-not-allowed "
                                            value={parentSku} disabled />
                                    </div>
                                )}
                                {section.section === "Description" && (
                                    <div className="mt-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Description {isFieldRequired("description") ? "*" : ""}
                                        </label>

                                        <div className={errors.description ? "border border-red-500 rounded-md" : "rounded-md"}>
                                            <EditorProvider>
                                                <div className="border border-gray-300 rounded-lg overflow-hidden bg-white" >
                                                    <div className="border-b border-gray-200 bg-gray-100 px-2 py-1">
                                                        <Toolbar>
                                                            <BtnBold /> <BtnItalic /> <BtnUnderline /> <BtnStrikeThrough /> <Separator /> <BtnNumberedList /> <BtnBulletList /> <Separator />
                                                            <Separator /> <BtnLink /> <Separator /> <BtnUndo /> <BtnRedo /> <Separator /> <BtnClearFormatting /> <BtnStyles />
                                                        </Toolbar>
                                                    </div>

                                                    <Editor value={formData.description || ""} onChange={(e: any) => {
                                                        const content = e.target.value;
                                                        setFormData((prev) => ({ ...prev, description: content }));

                                                        if (errors.description && content.trim() !== "") {
                                                            setErrors((prev) => ({ ...prev, description: "" }));
                                                        }
                                                    }}
                                                        style={{ minHeight: 200, border: "none", outline: "none", padding: "10px", backgroundColor: "#fff", fontSize: "14px", lineHeight: "1.5" }} />
                                                </div>
                                            </EditorProvider>
                                        </div>

                                        {errors.description && (
                                            <span className="text-red-500 text-xs mt-1 block">
                                                {errors.description}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {section.section === "SEO" && (
                                    <div className="mt-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            SEO Description {isFieldRequired("seo_description") ? "*" : ""}
                                        </label>

                                        <div className={`rounded-md overflow-hidden bg-white ${errors.seo_description ? "border border-red-500" : "border border-gray-300"}`} >
                                            <EditorProvider>
                                                <div className="border-b border-gray-300 bg-gray-100 px-2 py-1">
                                                    <Toolbar> <BtnBold /> <BtnItalic /> <BtnUnderline />
                                                        <BtnStrikeThrough /> <Separator /> <BtnNumberedList /> <BtnBulletList />
                                                        <Separator /> <BtnLink /> <Separator /> <BtnUndo />
                                                        <BtnRedo /> <Separator /> <BtnClearFormatting /> <BtnStyles />
                                                    </Toolbar>
                                                </div>

                                                <Editor value={formData.seo_description || ""} onChange={(e: any) => {
                                                    const content = e.target.value;

                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        seo_description: content,
                                                    }));

                                                    if (errors.seo_description && content.trim() !== "") {
                                                        setErrors((prev) => ({
                                                            ...prev, seo_description: "",
                                                        }));
                                                    }
                                                }}
                                                    style={{
                                                        minHeight: 200, padding: "10px", border: "none",
                                                        outline: "none", backgroundColor: "#fff", fontSize: "14px", lineHeight: "1.5",
                                                    }} />
                                            </EditorProvider>
                                        </div>

                                        {errors.seo_description && (
                                            <span className="text-red-500 text-xs mt-1 block">
                                                {errors.seo_description}
                                            </span>
                                        )}
                                    </div>
                                )}
                                {section.section === "Images" && (
                                    <div className="flex flex-col md:flex-row gap-4 mt-1">
                                        <ImageUploader label="Main Image" images={mainImages} setImages={setMainImages} multiple={false} required={isFieldRequired("main_image")} isMainImage />

                                        <ImageUploader label="Alt Images" images={altImages} setImages={setAltImages} multiple={true} required={isFieldRequired("alt_images")} />
                                    </div>
                                )}
                                {section.section === "Product Variations" &&
                                    (editingProduct === null || editingProduct?.parent_id === null) && (
                                        <div className="mt-1">

                                            <button type="button"
                                                onClick={() => setOpenVariationDialog(true)} className=" border border-[#fc4e15] text-[#fc4e15]
                    px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-orange-50 transition " >
                                                <PlusSquare size={16} />
                                                Add Variations
                                            </button>

                                            <VariantsTable variants={variants} onEdit={(idx) => {
                                                setVariationToEdit(variants[idx]);
                                                setEditingVariationIndex(idx);
                                                setOpenVariationDialog(true);
                                            }}
                                                onDelete={(idx) => confirmDeleteVariant(idx)}
                                            />
                                        </div>)}

                                {(section.section === "Product Variations" && editingProduct?.parent_id !== null && editingProduct?.parent_id !== undefined) && (
                                    <Box sx={{ mt: 2 }}>
                                        {variantOptions.map((opt, idx) => {
                                            const error = variantErrors[idx] || {};
                                            return (
                                                <Stack direction="row" spacing={2} key={opt.id} alignItems="flex-start" sx={{ mb: 2 }}>
                                                    <Box sx={{ width: "45%" }}>
                                                        <Typography variant="caption" color="textSecondary" sx={{ mb: 0.5, display: "block" }}>
                                                            Option Name*
                                                        </Typography>
                                                        <TextField select value={opt.name} onChange={(e) => {
                                                            if (e.target.value === "__add_option__") {
                                                                handleAddOptionClick();
                                                            } else {
                                                                handleOptionNameChange(idx, e.target.value);
                                                            }
                                                        }}
                                                            error={!!error.name}
                                                            helperText={error.name} fullWidth size="small" SelectProps={{ native: false }} >
                                                            {availableOptionNames.filter((name) => {
                                                                return !variantOptions.some((option, index) => index !== idx && option.name === name);
                                                            }).map((name, nameIndex) => (
                                                                <MenuItem key={`option-${idx}-${nameIndex}-${name}`} value={name}>
                                                                    {name}
                                                                </MenuItem>
                                                            ))
                                                            }
                                                            <MenuItem key={`add-option-${idx}`} value="__add_option__">
                                                                <em>
                                                                    <LibraryAddOutlinedIcon sx={{ mr: "5px", height: "18px" }} />
                                                                    Add Option
                                                                </em>
                                                            </MenuItem>
                                                        </TextField>
                                                    </Box>

                                                    <Box sx={{ width: "45%" }}>
                                                        <Typography variant="caption" color="textSecondary" sx={{ mb: 0.5, display: "block" }}>
                                                            Option Value*
                                                        </Typography>
                                                        <TextField select value={opt.value} onChange={(e) => {
                                                            if (e.target.value === "__add_value__") {
                                                                handleAddValueClick(idx);
                                                            } else {
                                                                handleOptionValueChange(idx, e.target.value);
                                                            }
                                                        }} error={!!error.value} helperText={error.value} fullWidth size="small" disabled={!opt.name} SelectProps={{ native: false }} >
                                                            {opt.name ? [
                                                                ...((availableOptionValues[idx] || []).filter((val) => {
                                                                    const selectedSameOptionValues = variantOptions.filter((o, index) => index !== idx && o.name === opt.name).map((o) => o.value);
                                                                    return !selectedSameOptionValues.includes(val);
                                                                })).map((value, valueIndex) => (
                                                                    <MenuItem key={`value-${idx}-${valueIndex}-${value}`} value={value}>
                                                                        {value}
                                                                    </MenuItem>
                                                                )),
                                                                ...(opt.value && !(availableOptionValues[idx] || []).includes(opt.value) ? [
                                                                    <MenuItem key={`current-value-${idx}`} value={opt.value}>
                                                                        {opt.value}
                                                                    </MenuItem>
                                                                ] : []),
                                                                <MenuItem key={`add-value-${idx}`} value="__add_value__">
                                                                    <em>
                                                                        <LibraryAddOutlinedIcon sx={{ mr: "5px", height: "18px" }} />
                                                                        Add Value
                                                                    </em>
                                                                </MenuItem>
                                                            ] : (
                                                                <MenuItem disabled value="">
                                                                    <em>Please select option name first</em>
                                                                </MenuItem>
                                                            )}
                                                        </TextField>
                                                    </Box>

                                                    <Box>
                                                        <IconButton color="error" sx={{ marginTop: "26px" }} onClick={() => {
                                                            setVariantOptions((prev) => prev.filter((_, i) => i !== idx));
                                                            setVariantErrors((prev) => {
                                                                const newErrors = [...prev];
                                                                newErrors.splice(idx, 1);
                                                                return newErrors;
                                                            });
                                                            setAvailableOptionValues((prev) => { const newValues = { ...prev }; delete newValues[idx]; return newValues })
                                                        }} >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Box>
                                                </Stack>
                                            );
                                        })}

                                        <Button
                                            variant="outlined"
                                            startIcon={<LibraryAddOutlinedIcon />}
                                            onClick={() => {
                                                setVariantOptions((prev) => [...prev, { id: crypto.randomUUID(), name: "", value: "" }]);
                                                setVariantErrors((prev) => [...prev, {}]);
                                            }}
                                            sx={{ color: "#fc4e15", borderColor: "#fc4e15", mt: 1 }}
                                        >
                                            Add Option
                                        </Button>
                                    </Box>
                                )}


                            </Box>
                        ))}

                        <Box sx={{
                            position: "fixed", bottom: "53px", left: 0, right: 0, backgroundColor: "background.paper", borderTop: "1px solid #ddd", borderBottom: "1px solid #ddd",
                            p: 3, py: 2, display: "flex", justifyContent: "flex-end", gap: 2, zIndex: 10
                        }} >
                            <Button sx={{ color: "#272324" }} onClick={onClose}  >
                                Cancel
                            </Button>
                            <Button variant="contained" sx={{ color: "#fff", background: "#fc4e15" }} onClick={handleSubmitWithValidation}>
                                {!editingProduct && (
                                    <>
                                        <PlusSquare size={16} className="mr-1" />  Add Product
                                    </>
                                )}
                                {editingProduct && (
                                    <>
                                        Update Product
                                    </>
                                )}
                            </Button>
                        </Box>
                    </Box>

                    {(formData.parent_id === "" || formData.parent_id === null) && (
                        <Box sx={{
                            width: { xs: 115, md: 300 },
                            borderLeft: "1px solid #ddd", px: 2, py: 5.5, overflowY: "auto", display: { xs: "none", md: "flex" }, flexDirection: "column", gap: 2,
                        }} >
                            <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 0.2 }}>
                                Status
                            </Typography>

                            <FormControlLabel control={
                                <Checkbox checked={!!formData.active} onChange={(e) => setFormData((prev) => ({ ...prev, active: e.target.checked }))} />} label="Active" />
                            <FormControlLabel disabled={true} control={
                                <Checkbox checked={!!formData.maropost_sync} onChange={(e) => setFormData((prev) => ({ ...prev, maropost_sync: e.target.checked }))} />} label="Neto" />
                            <FormControlLabel disabled={true} control={
                                <Checkbox checked={!!formData.shopify_sync} onChange={(e) => setFormData((prev) => ({ ...prev, shopify_sync: e.target.checked }))} />} label="Shopify" />
                        </Box>
                    )}
                </Box>
                <Footer sidebarWidth={sidebarWidth} />
            </Dialog>

            {openAddCategoryDialog && (
                <AddCategory open={openAddCategoryDialog} onClose={handleCloseAddCategoryDialog} onSave={handleSaveCategory} formValues={{ name: newCategoryName }}
                    setFormValues={(values) => setNewCategoryName(values.name)} fields={[{ key: "name", label: "Category Name" }]} editingId={null} title="Category" />
            )}

            {openAddBrandDialog && (
                <AddBrands open={openAddBrandDialog} onClose={handleCloseAddBrandDialog} onSave={handleSaveBrand} />
            )}
            {openVariationDialog && (
                <AddVariantsDialog open={openVariationDialog}
                    onClose={() => {
                        setOpenVariationDialog(false); setVariationToEdit(null); setEditingVariationIndex(null);
                    }} onSave={handleAddVariation} productData={formData} isEdit={!!variationToEdit} editData={variationToEdit || null} />
            )}

            {deleteDialogOpen && (
                <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                    <Box sx={{ p: 3, minWidth: 300 }}>
                        <Typography sx={{ mb: 2 }}>Are you sure you want to delete this variant?</Typography>
                        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
                            <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: "#272324" }}>Cancel</Button>
                            <Button onClick={() => {
                                if (variantToDeleteIndex !== null) {
                                    handleDeleteVariants(variantToDeleteIndex);
                                }
                                setDeleteDialogOpen(false);
                            }} variant="contained" color="error" >
                                Delete
                            </Button>
                        </Box>
                    </Box>
                </Dialog>
            )}

            {optionValueDialog.type && (
                <OptionValueManager
                    type={optionValueDialog.type}
                    open={optionValueDialog.open}
                    onClose={() => setOptionValueDialog({ open: false, type: "option", optionIndex: null })}
                    onSave={optionValueDialog.type === "option" ? handleSaveNewOption : handleSaveNewValue}
                    existingItems={
                        optionValueDialog.type === "option"
                            ? availableOptionNames
                            : availableOptionValues[optionValueDialog.optionIndex!] || []
                    }
                    currentOptionIndex={optionValueDialog.optionIndex}
                />
            )}
        </>
    );
};

export default AddProductDialog;