import React, { useEffect, useState } from "react";
import {
  Box, Button, TextField, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Stack, Divider,
  MenuItem
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import API_URL from "../../../../config";
import { toast } from "react-toastify";
import LibraryAddOutlinedIcon from "@mui/icons-material/LibraryAddOutlined";
import Swal from "sweetalert2";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { closeLoading, showLoading } from "../../../../General/Loader";
import OptionValueManager from "../OptionValueManager";


interface VariantRow {
  add: boolean;
  name: string;
  sku: string;
  id?: any;
  qty: string;
  price: string;
  rrp: string;
  store_price: string;
  option: Record<string, string>;
  mainImages?: { url: string; id?: number; file?: File }[];
  altImages?: { url: string; id?: number; file?: File }[];
}

interface AddVariantsDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (variants: VariantRow[]) => void;
  productData?: any;
  editData?: any | null;
  isEdit: boolean;
}

interface Option {
  name: string;
  nameError?: string;
  value: string;
  valueError?: string;
}

const AddVariantsDialog: React.FC<AddVariantsDialogProps> = ({
  open, onClose, onSave, productData, editData, isEdit
}) => {
  const [currentVariant, setCurrentVariant] = useState<VariantRow>({
    name: "", sku: "", qty: "", price: "", rrp: "", store_price: "", option: {}, mainImages: [], altImages: [], id: "", add: false
  });
  const [errors, setErrors] = useState<Partial<VariantRow>>({});
  const [options, setOptions] = useState<Option[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const maxVisible = 3
  const nameRef = React.useRef<HTMLInputElement>(null);
  const skuRef = React.useRef<HTMLInputElement>(null);
  const qtyRef = React.useRef<HTMLInputElement>(null);
  const rrpRef = React.useRef<HTMLInputElement>(null);
  const store_priceRef = React.useRef<HTMLInputElement>(null);
  const priceRef = React.useRef<HTMLInputElement>(null);

  const optionRefs: any = React.useRef<Array<{ name: HTMLInputElement, value: HTMLInputElement }>>([]);
  const [availableOptionNames, setAvailableOptionNames] = useState<string[]>([]);
  const [availableOptionValues, setAvailableOptionValues] = useState<Record<number, string[]>>({});
  const [optionValueDialog, setOptionValueDialog] = useState<{
    open: boolean;
    type: "option" | "value";
    optionIndex?: number | null;
  }>({ open: false, type: "option", optionIndex: null });


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
      toast.error("Failed to load available option names from API.");
      setAvailableOptionNames([]);
    }
  };

  useEffect(() => {
    if (!open) return;
    showLoading(3000);
    setLoading(true);
    setErrors({});
    setAvailableOptionValues({});
    setAvailableOptionNames([]);
    setOptions([{ name: "", value: "" }]);
    setCurrentVariant({
      name: "",
      sku: "",
      qty: "",
      price: "",
      rrp: "",
      store_price: "",
      option: {},
      mainImages: [],
      altImages: [],
      id: undefined,
      add: false,
    });

    fetchOptionNames();

    const loadEditData = async () => {
      if (editData && Object.keys(editData)?.length) {
        let data = Array.isArray(editData) ? editData[0] : editData;
        const mainImages = data.images?.filter((i: any) => i.type === "main")?.map((i: any) => ({ url: i.url, id: i.id })) || [];
        const altImages = data.images?.filter((i: any) => i.type === "alt")?.map((i: any) => ({ url: i.url, id: i.id })) || [];

        setCurrentVariant(prev => ({
          ...prev,
          name: data.name || "",
          add: data.add || false,
          id: data.id,
          sku: data.sku || "",
          qty: String(data.qty || ""),
          price: String(data.price || ""),
          rrp: String(data.rrp || ""),
          store_price: String(data.store_price || ""),
          option: data.option || {},
          mainImages,
          altImages,
        }));

        const formattedOptions: Option[] = Object.entries(data.option || {}).map(([key, value]) => ({
          name: key,
          value: String(value),
        }));

        setOptions(formattedOptions.length ? formattedOptions : [{ name: "", value: "" }]);

        if (formattedOptions.length > 0) {
          await Promise.all(
            formattedOptions.map(async (opt, index) => {
              if (opt.name) {
                await handleOptionNameChange(index, opt.name);
                setOptions(prev => {
                  const updated = [...prev];
                  updated[index] = { ...updated[index], value: opt.value };
                  return updated;
                });
              }
            })
          );
        }
      }

      closeLoading();
      setLoading(false);
    };

    loadEditData();
  }, [open, editData]);

  const handleChange = (field: keyof VariantRow, value: string) => {
    setCurrentVariant(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: value ? undefined : prev[field] }));
  };

  const handleOptionNameChange = async (index: number, value: string) => {
    try {
      const payload = { option_name: value };
      const optionsValueResponse: any = await axios.post(`${API_URL}/variants-options`, payload);

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

      setOptions((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          name: value,
          nameError: value ? undefined : "Option name is required",
        };
        return updated;
      });
    } catch (error: any) {
      setOptions((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          name: value,
          nameError: value ? undefined : "Option name is required",
        };
        return updated;
      });
      setAvailableOptionValues((prev) => ({
        ...prev,
        [index]: [],
      }));
    }
  };

  const handleOptionValueChange = (index: any, value: string) => {
    setOptions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], value, valueError: value ? undefined : "Option value is required" };
      return updated;
    });
  };

  const validateVariant = () => {
    const newErrors: Partial<VariantRow> = {};

    if (!currentVariant.name) newErrors.name = "Field is required";
    if (!currentVariant.sku) newErrors.sku = "Field is required";
    if (!currentVariant.qty) newErrors.qty = "Field is required";
    if (!currentVariant.price) newErrors.price = "Field is required";
    if (!currentVariant.rrp) newErrors.rrp = "Field is required";
    if (!currentVariant.store_price) newErrors.store_price = "Field is required";

    const updatedOptions = options.map(opt => ({
      ...opt,
      nameError: opt.name ? undefined : "Option name is required",
      valueError: opt.value ? undefined : "Option value is required",
    }));

    setOptions(updatedOptions);

    if (updatedOptions.length === 0) {
      const blankOption = {
        name: "",
        value: "",
        nameError: "Option name is required",
        valueError: "Option value is required",
      };
      setOptions([blankOption]);
      setErrors(newErrors);

      if (optionRefs.current[0]?.name) {
        const el = optionRefs.current[0].name;
        if (el instanceof HTMLElement) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.focus();
        }
      }
      return false;
    }

    setErrors(newErrors);

    if (newErrors.name && nameRef.current) {
      nameRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      nameRef.current.focus();
      return false;
    }

    for (let i = 0; i < updatedOptions.length; i++) {
      if (updatedOptions[i].nameError && optionRefs.current[i]?.name) {
        const nameEl = optionRefs.current[i].name;
        let targetEl: HTMLElement | null = null;

        if (nameEl instanceof HTMLElement) {
          targetEl = nameEl;
        } else if (nameEl && typeof nameEl === "object") {
          try {
            const maybeNode =
              typeof (nameEl as any).querySelector === "function"
                ? (nameEl as any).querySelector("input, div, textarea, select")
                : null;
            if (maybeNode instanceof HTMLElement) targetEl = maybeNode;
          } catch {
            targetEl = null;
          }
        }

        if (targetEl) {
          targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
          targetEl.focus();
        }
        return false;
      }

      if (updatedOptions[i].valueError && optionRefs.current[i]?.value) {
        const valueEl = optionRefs.current[i].value;
        let targetEl: HTMLElement | null = null;

        if (valueEl instanceof HTMLElement) {
          targetEl = valueEl;
        } else if (valueEl && typeof valueEl === "object") {
          try {
            const maybeNode =
              typeof (valueEl as any).querySelector === "function"
                ? (valueEl as any).querySelector("input, select, textarea, div")
                : null;
            if (maybeNode instanceof HTMLElement) targetEl = maybeNode;
          } catch {
            targetEl = null;
          }
        }

        if (targetEl) {
          targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
          targetEl.focus();
        }
        return false;
      }
    }

    if (newErrors.sku && skuRef.current) {
      skuRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      skuRef.current.focus();
      return false;
    }
    if (newErrors.qty && qtyRef.current) {
      qtyRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      qtyRef.current.focus();
      return false;
    }
    if (newErrors.rrp && rrpRef.current) {
      rrpRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      rrpRef.current.focus();
      return false;
    }
    if (newErrors.store_price && store_priceRef.current) {
      store_priceRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      store_priceRef.current.focus();
      return false;
    }
    if (newErrors.price && priceRef.current) {
      priceRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      priceRef.current.focus();
      return false;
    }

    return (
      Object.keys(newErrors).length === 0 &&
      !updatedOptions.some(opt => opt.nameError || opt.valueError)
    );
  };

  const handleSaveVariants = async (): Promise<void> => {
    if (!validateVariant()) return;

    const optionRecord: Record<string, string> = {};
    options.forEach(opt => {
      if (opt.name && opt.value) {
        optionRecord[opt.name] = opt.value;
      }
    });

    const variantToSave: VariantRow = { ...currentVariant, option: optionRecord };
    const formPayload = new FormData();

    const appendIfValid = (key: string, value: any) => {
      if (value !== null && value !== undefined && value !== "") {
        formPayload.append(key, value);
      }
    };

    if (!isEdit || editData[0]?.add) {
      if (productData.parent_id != null) {

        const variantToSend = prepareVariantForSave({ ...variantToSave, add: true });
        onSave([variantToSend]);
        setCurrentVariant({
          name: "",
          add: false,
          sku: "",
          qty: "",
          price: "",
          rrp: "",
          store_price: "",
          option: {},
          mainImages: [],
          altImages: [],
          id: undefined,
        });
        setOptions([{ name: "", value: "" }]);
        setErrors({});
        onClose();
        return;
      } else {
        appendIfValid(`variant[0][name]`, currentVariant.name);
        appendIfValid(`variant[0][qty]`, currentVariant.qty);
        appendIfValid(`variant[0][sku]`, currentVariant.sku);
        appendIfValid(`variant[0][cost_price]`, currentVariant.price);
        appendIfValid(`variant[0][rrp]`, currentVariant.rrp);
        appendIfValid(`variant[0][store_price]`, currentVariant.store_price);

        options.forEach((opt) => {
          if (opt.name && opt.value) {
            formPayload.append(`variant[0][option][${opt.name}]`, String(opt.value));
          }
        });

        const images = [
          ...(currentVariant.mainImages || []).map(img => ({ ...img, type: "main" })),
          ...(currentVariant.altImages || []).map(img => ({ ...img, type: "alt" })),
        ];

        const fetchFileFromBlob = async (img: any): Promise<File> => {
          const response = await fetch(img.url);
          const blob = await response.blob();
          return new File([blob], `image-${Date.now()}.jpg`, { type: blob.type });
        };

        for (let idx = 0; idx < images.length; idx++) {
          const img: any = images[idx];
          let fileToAppend: File | null = null;

          if (img.file instanceof File) {
            fileToAppend = img.file;
          } else if (img.url) {
            try {
              fileToAppend = await fetchFileFromBlob(img);
            } catch (err) {
            }
          }

          if (fileToAppend) {
            formPayload.append(`variant[0][images][${idx}][file]`, fileToAppend);
            formPayload.append(`variant[0][images][${idx}][type]`, img.type);
          } else if (img.id) {
            formPayload.append(`variant[0][images][${idx}][id]`, String(img.id));
            formPayload.append(`variant[0][images][${idx}][type]`, img.type);
          }
        }

        const url = `${API_URL}/products/${productData.id}?_method=PUT`;

        try {
          const response = await fetch(url, { method: "POST", body: formPayload });
          if (!response.ok) throw new Error("Failed to save variant");
          const data = await response.json();
          const variants = data?.product?.variants || [];
          const lastVariant = variants.at(-1);
          const updatedVariantToSave = { ...variantToSave, id: lastVariant?.id };
          const variantToSend = prepareVariantForSave(updatedVariantToSave);

          Swal.fire({
            icon: "success", title: "🎉 Variants added successfully!", text: "Welcome back!", showConfirmButton: false,
            timer: 3000, timerProgressBar: true, background: "#fff", color: "#333", backdrop: `rgba(0,0,0,0.4)`,
            showClass: {
              popup: "animate__animated animate__fadeInDown",
            },
            hideClass: {
              popup: "animate__animated animate__fadeOutUp",
            },
          });
          onSave([variantToSend]);
          setCurrentVariant({ name: "", sku: "", qty: "", price: "", rrp: "", store_price: "", option: {}, mainImages: [], altImages: [], id: undefined, add: false });
          setOptions([{ name: "", value: "" }]);
          setErrors({});
          onClose();
        } catch (err) {
          toast.error("Failed to save variant.", { autoClose: 3000 });
        }
      }
    } else {
      if (productData.parent_id !== "" || productData.parent_id !== null || productData.parent_id !== undefined) {
        const fetchFileFromBlob = async (img: any): Promise<File> => {
          const res = await fetch(img.url);
          const blob = await res.blob();
          const fileName = img.name || img.url.split("/").pop() || "image.png";
          return new File([blob], fileName, { type: blob.type });
        };

        const variantsData: VariantRow[] = [variantToSave];

        for (let index = 0; index < variantsData.length; index++) {
          const variant = variantsData[index];

          appendIfValid(`variant[${index}][name]`, variant.name);
          appendIfValid(`variant[${index}][id]`, variant.id || editData.id);
          appendIfValid(`variant[${index}][qty]`, variant.qty);
          appendIfValid(`variant[${index}][cost_price]`, variant.price);

          if (variant.rrp !== null && variant.rrp !== undefined && variant.rrp !== "") {
            formPayload.append(`variant[${index}][rrp]`, String(variant.rrp));
          }

          if (variant.store_price !== null && variant.store_price !== undefined && variant.store_price !== "") {
            formPayload.append(`variant[${index}][store_price]`, String(variant.store_price));
          }

          options.forEach((opt, optIndex) => {
            if (opt.name && opt.value) {
              formPayload.append(`variant[${index}][option][${opt.name}]`, String(opt.value));
            }
          });

          const images = [
            ...(variant.mainImages || []).map(img => ({ ...img, type: "main" })),
            ...(variant.altImages || []).map(img => ({ ...img, type: "alt" })),
          ];

          for (let idx = 0; idx < images.length; idx++) {
            const img: any = images[idx];
            let fileToAppend: File | null = null;

            if (img.file instanceof File) {
              fileToAppend = img.file;
            } else if (img.url && !img.id) {
              try {
                fileToAppend = await fetchFileFromBlob(img);
              } catch (err) { }
            }

            if (fileToAppend) {
              formPayload.append(`variant[${index}][images][${idx}][file]`, fileToAppend);
              formPayload.append(`variant[${index}][images][${idx}][type]`, img.type);
            } else if (img.id) {
              formPayload.append(`variant[${index}][images][${idx}][id]`, String(img.id));
              formPayload.append(`variant[${index}][images][${idx}][type]`, img.type);
            }
          }
        }

        const currentImageIds: number[] = [
          ...(currentVariant.mainImages || []).map((img: any) => img.id).filter(Boolean),
          ...(currentVariant.altImages || []).map((img: any) => img.id).filter(Boolean),
        ];

        const deletedImages = (editData?.images || []).filter(
          (img: any) => img.id && !currentImageIds.includes(img.id)
        );

        deletedImages.forEach((img: any, i: number) =>
          formPayload.append(`deleted_images[${i}]`, String(img.id))
        );

        const url = `${API_URL}/products/${productData?.id || editData.id}?_method=PUT`;

        try {
          const response = await fetch(url, { method: "POST", body: formPayload });
          if (!response.ok) throw new Error("Failed to save variant");

          Swal.fire({
            icon: "success", title: "🎉 Variants updated successfully!",
            text: "Welcome back!", showConfirmButton: false, timer: 3000, timerProgressBar: true, background: "#fff", color: "#333", backdrop: `rgba(0,0,0,0.4)`,
            showClass: {
              popup: "animate__animated animate__fadeInDown",
            },
            hideClass: {
              popup: "animate__animated animate__fadeOutUp",
            },
          });

          const variantToSend = prepareVariantForSave(variantToSave);
          onSave([variantToSend]);
          setCurrentVariant({ name: "", sku: "", qty: "", price: "", rrp: "", store_price: "", option: {}, mainImages: [], altImages: [], id: undefined, add: false });
          setOptions([{ name: "", value: "" }]);
          setErrors({});
          onClose();
        } catch (err) {
        }
      } else {
        if (isEdit) {
          const variantToSend = prepareVariantForSave(variantToSave);
          onSave([variantToSend]);
          setCurrentVariant({ name: "", sku: "", qty: "", price: "", store_price: "", rrp: "", option: {}, mainImages: [], altImages: [], id: undefined, add: false });
          setOptions([{ name: "", value: "" }]);
          setErrors({});
          onClose();
          return;
        }
      }
    }
  };

  const prepareVariantForSave = (variant: VariantRow) => {
    const allImages = [
      ...(variant.mainImages || []).map(img => ({ ...img, type: "main" })),
      ...(variant.altImages || []).map(img => ({ ...img, type: "alt" })),
    ];

    return {
      ...variant,
      images: allImages,
      mainImages: undefined,
      altImages: undefined,
    };
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

    const lastOptionIndex = options.length - 1;
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
        handleOptionValueChange(optionValueDialog.optionIndex, trimmedValue);
      }, 0);
    }
  };

  return (
    <>
      {!loading && (
        <Dialog open={open} onClose={(e, reason) => { if (reason === "backdropClick" || reason === "escapeKeyDown") { onClose(); } }} fullWidth maxWidth="md">
          <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {isEdit ? "Update" : "Add"} Product Variations
            <IconButton onClick={onClose}><CloseIcon /></IconButton>
          </DialogTitle>
          <Divider />
          <DialogContent className="custom-scrollbar">
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Box>
                <Typography variant="caption" color="textSecondary" sx={{ mb: 0.5 }}>Product Name*</Typography>
                <TextField inputRef={nameRef} value={currentVariant.name}
                  onChange={e => handleChange("name", e.target.value)} error={!!errors.name} helperText={errors.name} fullWidth size="small" />
              </Box>

              {(isEdit && editData.id !== undefined) && (
                <Box>
                  <Typography variant="caption" color="textSecondary" sx={{ mb: 0.5 }}>Parent SKU*</Typography>
                  <TextField value={productData.sku} disabled={true} fullWidth size="small" />
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="textSecondary" sx={{ mb: 0.5 }}>SKU*</Typography>
                  <TextField
                    inputRef={skuRef}
                    value={currentVariant.sku}
                    onChange={e => handleChange("sku", e.target.value)}
                    error={!!errors.sku}
                    disabled={isEdit}
                    helperText={errors.sku}
                    fullWidth
                    size="small"
                  />
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="textSecondary" sx={{ mb: 0.5 }}>Qty*</Typography>
                  <TextField
                    inputRef={qtyRef}
                    value={currentVariant.qty}
                    onChange={e => handleChange("qty", e.target.value.replace(/\D/g, ""))}
                    error={!!errors.qty}
                    helperText={errors.qty}
                    fullWidth
                    size="small"
                  />
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="textSecondary" sx={{ mb: 0.5 }}>Cost Price*</Typography>
                  <TextField
                    inputRef={priceRef}
                    value={currentVariant.price}
                    onChange={e => handleChange("price", e.target.value.replace(/[^0-9.]/g, ""))}
                    error={!!errors.price}
                    helperText={errors.price}
                    fullWidth
                    size="small"
                  />
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="textSecondary" sx={{ mb: 0.5 }}>RRP Price*</Typography>
                  <TextField
                    inputRef={rrpRef}
                    value={currentVariant.rrp}
                    onChange={e => handleChange("rrp", e.target.value.replace(/[^0-9.]/g, ""))}
                    error={!!errors.rrp}
                    helperText={errors.rrp}
                    fullWidth
                    size="small"
                  />
                </Box>
              </Box>

              <Box>
                <Typography variant="caption" color="textSecondary" sx={{ mb: 0.5 }}>Store Price*</Typography>
                <TextField inputRef={store_priceRef} value={currentVariant.store_price}
                  onChange={e => handleChange("store_price", e.target.value.replace(/[^0-9.]/g, ""))} error={!!errors.store_price} helperText={errors.store_price} fullWidth size="small" />
              </Box>

              <Box>
                <Typography variant="caption" color="dark" sx={{ mt: 1, display: "block", fontSize: "14px" }}>Variants</Typography>
                {options.map((opt, i) => {
                  if (!optionRefs.current[i]) optionRefs.current[i] = { name: null, value: null };

                  return (
                    <Box key={i} sx={{ display: "flex", width: "100%", gap: 2, alignItems: "flex-start", mb: 2, }} >
                      <Box sx={{ width: "45%" }}>
                        <Typography variant="caption" color="textSecondary" sx={{ mb: 0.5 }}>
                          Option Name*
                        </Typography>
                        <TextField
                          select
                          inputRef={(el) => (optionRefs.current[i].name = el)}
                          value={opt.name}
                          onChange={(e) => {
                            if (e.target.value === "__add_option__") {
                              handleAddOptionClick();
                            } else {
                              handleOptionNameChange(i, e.target.value);
                            }
                          }}
                          error={!!opt.nameError}
                          helperText={opt.nameError || undefined}
                          fullWidth
                          size="small"
                          SelectProps={{ native: false }}
                        >
                          {availableOptionNames
                            .filter((name) => {
                              return !options.some((option, index) =>
                                index !== i && option.name === name
                              );
                            })
                            .map((name) => (
                              <MenuItem key={name} value={name}>
                                {name}
                              </MenuItem>
                            ))
                          }

                          <MenuItem value="__add_option__"
                            onClick={(e) => { e.stopPropagation(); handleAddOptionClick(); }} >
                            <em>
                              <LibraryAddOutlinedIcon sx={{ mr: "5px", height: "18px" }} />
                              Add Option
                            </em>
                          </MenuItem>
                        </TextField>
                      </Box>

                      <Box sx={{ width: "45%" }}>
                        <Typography variant="caption" color="textSecondary" sx={{ mb: 0.5 }}>
                          Option Value*
                        </Typography>
                        <TextField select inputRef={(el) => (optionRefs.current[i].value = el)} value={opt.value}
                          onChange={(e) => {
                            if (e.target.value === "__add_value__") {
                              handleAddValueClick(i);
                            } else {
                              handleOptionValueChange(i, e.target.value);
                            }
                          }}
                          error={!!opt.valueError} helperText={opt.valueError || undefined} fullWidth size="small" disabled={!opt.name} SelectProps={{ native: false }} >
                          {opt.name ? [
                            ...(
                              (availableOptionValues[i] || []).filter((val) => {
                                const selectedSameOptionValues = options
                                  .filter((o, idx) => idx !== i && o.name === opt.name)
                                  .map((o) => o.value);
                                return !selectedSameOptionValues.includes(val);
                              })
                            ).map((value) => (
                              <MenuItem key={value} value={value}>
                                {value}
                              </MenuItem>
                            )),
                            <MenuItem key="__add_value__" value="__add_value__" onClick={(e) => {
                              e.stopPropagation();
                              handleAddValueClick(i);
                            }} >
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
                      <IconButton color="error" sx={{ mt: 3.5 }} onClick={() => { const updatedOptions = [...options]; updatedOptions.splice(i, 1); setOptions(updatedOptions); }} >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  );
                })}

                <Button variant="outlined" size="small" sx={{ alignSelf: "flex-start", color: "#fc4e15", borderColor: "#fc4e15" }} onClick={() => setOptions((prev) => [...prev, { name: "", value: "" }])} >
                  <LibraryAddOutlinedIcon sx={{ mr: "5px", height: "18px" }} /> Add Option
                </Button>
              </Box>
              <Box mt={2}>
                <Box sx={{ display: "flex", flexDirection: "column", maxWidth: "fit-content" }}>
                  <Typography variant="caption">Main Image</Typography>
                  <Button startIcon={<UploadFileIcon />} variant="outlined" component="label" sx={{ mt: 1, height: "50px", minWidth: "250px", color: "#272324", borderColor: "#272324" }}>
                    Upload Main Image
                    <input type="file" hidden accept=".jpg,.jpeg,.png"
                      onChange={(e) => {
                        const files = e.target.files; if (!files || !files[0]) return; const file = files[0];
                        const newImage = { url: URL.createObjectURL(file), file, isPrimary: true }; setCurrentVariant((prev) => ({ ...prev, mainImages: [newImage] }));
                      }} />
                  </Button>
                </Box>
                <Stack direction="row" spacing={2} mt={1} flexWrap="wrap">
                  {currentVariant.mainImages?.map((img, i) => (
                    <Box key={i} sx={{
                      position: "relative", width: 120, height: 120,
                      border: "1px solid #ccc", borderRadius: 1, overflow: "hidden", p: 0.5,
                    }} >
                      <img src={img.url} alt={`main-${i}`} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      <IconButton size="small" onClick={() =>
                        setCurrentVariant((prev) => ({
                          ...prev, mainImages: prev.mainImages?.filter((_, index) => index !== i),
                        }))} sx={{
                          position: "absolute", top: 2,
                          right: 2, background: "rgba(0,0,0,0.5)", color: "white", "&:hover": { background: "rgba(255,0,0,0.7)" },
                        }} >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Stack>
              </Box>

              <Box mt={2}>
                <Box sx={{ display: "flex", flexDirection: "column", maxWidth: "fit-content" }}>
                  <Typography variant="caption">Alt Images</Typography>
                  <Button startIcon={<UploadFileIcon />} variant="outlined" component="label" sx={{ mt: 1, height: "50px", minWidth: "250px", color: "#272324", borderColor: "#272324" }}>
                    Upload Alt Images
                    <input type="file" hidden accept=".jpg,.jpeg,.png" multiple onChange={(e) => {
                      const files = e.target.files;
                      if (!files) return;
                      const newImages = Array.from(files).map((file) => ({ url: URL.createObjectURL(file), file }));
                      setCurrentVariant((prev) => ({
                        ...prev,
                        altImages: [...(prev.altImages || []), ...newImages].slice(0, 20),
                      }));
                      if ((currentVariant.altImages?.length || 0) + files.length > 20) {
                        toast.error("Maximum 20 alt images allowed.", { autoClose: 3000 });
                      }
                    }}
                    />
                  </Button>
                </Box>
                <Stack direction="row" flexWrap="wrap" gap={2} mt={1}>
                  {(showAll ? currentVariant.altImages : currentVariant.altImages?.slice(0, maxVisible))?.map((img, i) => (
                    <Box key={i}
                      sx={{ position: "relative", width: 100, height: 100, border: "1px solid #ccc", borderRadius: 1, overflow: "hidden", p: 0.5, }} >
                      <img src={img.url} alt={`alt-${i}`} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      <IconButton
                        size="small"
                        onClick={() =>
                          setCurrentVariant((prev) => ({
                            ...prev,
                            altImages: prev.altImages?.filter((_, index) => index !== i),
                          }))
                        }
                        sx={{
                          position: "absolute",
                          top: 2, right: 2, background: "rgba(0,0,0,0.5)", color: "white", "&:hover": { background: "rgba(255,0,0,0.7)" },
                        }} >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Stack>

                {(currentVariant.altImages?.length || 0) > maxVisible && (
                  <Button size="small" onClick={() => setShowAll(prev => !prev)} sx={{ mt: 1 }}>
                    {showAll ? "Show Less" : `Show More (+${(currentVariant.altImages?.length || 0) - maxVisible})`}
                  </Button>
                )}
              </Box>
            </Box>
          </DialogContent>
<Divider />
          <DialogActions>
            <Button onClick={onClose} sx={{ color: "#272324" }}>Cancel</Button>
            <Button variant="contained" sx={{ color: "#fff", background: "#fc4e15" }} onClick={handleSaveVariants}> {isEdit ? "Update" : "Save"} Variations</Button>
          </DialogActions>
        </Dialog>
      )}

      {optionValueDialog.type && (
        <OptionValueManager type={optionValueDialog.type} open={optionValueDialog.open} onClose={() => setOptionValueDialog({ open: false, type: "option", optionIndex: null })}
          onSave={optionValueDialog.type === "option" ? handleSaveNewOption : handleSaveNewValue} existingItems={
            optionValueDialog.type === "option" ? availableOptionNames : availableOptionValues[optionValueDialog.optionIndex!] || []}
          currentOptionIndex={optionValueDialog.optionIndex}
        />
      )}
    </>
  );
};

export default AddVariantsDialog;
