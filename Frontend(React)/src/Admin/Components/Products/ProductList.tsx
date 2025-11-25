import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import AuthService from "../../../Services/AuthService";
import API_URL, { BASE_URL } from "../../../config";
import AddProductDialog from "./Add-Product";
import ViewProduct from "./View-Product";
import ConfirmDialog from "../../../General/General-Delete-Dialoge";
import { useLocation, useNavigate } from "react-router-dom";
import FilterBar from "./ProductFilter";
import { closeLoading, showLoading } from "../../../General/Loader";
import { initialRequiredFields } from "./Product-Services/RequiredFieldsService";
import { validateProductForm } from "./Product-Services/ValidationService";
import { fetchProduct } from "./Product-Services/EditProductService";
import ProductActions from "./ProductActions";
import ProductTable from "./ProductTable";
import Swal from "sweetalert2";

const Products: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customFields, setcustomFields] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [maropostStatus, setMaropostStatus] = useState(0);
  const [shopifyStatus, setShopifyStatus] = useState(0);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);
  const [viewProduct, setViewProduct] = useState<any | null>(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openAddCategoryDialog, setOpenAddCategoryDialog] = useState(false);
  const [openAddBrandDialog, setOpenAddBrandDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [totalProducts, setTotalProducts] = useState(0);
  const [requiredFieldsMap, setRequiredFieldsMap] = useState<Record<string, boolean>>(initialRequiredFields);
  const userRole = AuthService.getUser()?.role;
  const [brandNameToSave, setBrandNameToSave] = useState("");
  const [openBulkDeleteDialog, setOpenBulkDeleteDialog] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({
    category: "", brand: "", sku: "", rrp: "", name: "", description: "", qty: "0", parent_id: "", subtitle: "", store_price: "", id: "",
    promo_start: "", promo_end: "", promo_price: "", cost_price: "", width: "", length: "", cubic: "", height: "", active: 1, seo_title: "", seo_description: ""
  });

  const [mainImages, setMainImages] = useState<{ url: string; isPrimary?: boolean }[]>([]);
  const [altImages, setAltImages] = useState<{ url: string }[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const currentPageIds = products.map(p => p.id);
  const allSelected = products.length > 0 && products.every(p => selectedProducts.includes(p.id));
  const partiallySelected = products.length > 0 && products.some(p => selectedProducts.includes(p.id)) && !allSelected;

  const [isSelectAllMode, setIsSelectAllMode] = useState(false);
  const [manuallyUnselected, setManuallyUnselected] = useState<number[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const add = params.get("add") === "true";
    const editId = params.get("edit");

    if (add) {
      setEditingProduct(null);
      setOpenDialog(true);
      resetForm();
    } else if (editId) {
      const productToEdit = products.find(p => p.id === parseInt(editId));
      if (productToEdit) fetchProductById(productToEdit.id);
    } else {
      setOpenDialog(false);
    }
  }, [location.search, products]);

  useEffect(() => {
    navigate("/products", { replace: true });
    fetchInitialData();
  }, [page, rowsPerPage]);

  useEffect(() => {
    if (isSelectAllMode) {
      const newSelected = currentPageIds.filter(id => !manuallyUnselected.includes(id));
      setSelectedProducts(prev => Array.from(new Set([...prev, ...newSelected])));
    }
  }, [products, page]);

  useEffect(() => {
    if (isSelectAllMode && selectedProducts.length === 0) {
      setIsSelectAllMode(false);
      setManuallyUnselected([]);
    }
  }, [selectedProducts, isSelectAllMode]);

  const fetchInitialData = async () => {
    try {
      showLoading(3000);
      const [catRes, productRes, fieldMappings, settings, field, brands]: any = await Promise.all([
        axios.get(`${API_URL}/categories`),
        axios.get(`${API_URL}/products?page=${page}&per_page=${rowsPerPage}`),
        axios.get(`${API_URL}/field-mappings`),
        axios.get(`${API_URL}/settings`),
        axios.get(`${API_URL}/custom-fields`),
        axios.get(`${API_URL}/brands`),
      ]);

      setCategories(catRes.data.data);
      setMaropostStatus(settings.data.settings.maropost_status);
      setShopifyStatus(settings.data.settings.shopify_status);
      setcustomFields(field.data || []);
      setBrands(brands.data.data || []);

      const fieldAlias: Record<string, string> = { qty: "qty" };
      const requiredFields = Array.from(
        new Set(
          Object.values(fieldMappings.data).flat().filter((m: any) => m.is_required).map((m: any) => m.local_field)
        )
      );

      const updatedRequiredProductFields = { ...initialRequiredFields };

      requiredFields.forEach((field) => {
        if (field in updatedRequiredProductFields || (field in fieldAlias && fieldAlias[field] in updatedRequiredProductFields)) {
          if (field in updatedRequiredProductFields) {
            updatedRequiredProductFields[field] = true;
          } else if (field in fieldAlias) {
            const mappedField = fieldAlias[field];
            if (mappedField in updatedRequiredProductFields) {
              updatedRequiredProductFields[mappedField] = true;
            }
          }
        }
        else {
          updatedRequiredProductFields[field] = true;
        }
      });

      setRequiredFieldsMap(updatedRequiredProductFields);

      const productsWithImages = productRes.data.data.map((p: any) => ({
        ...p,
        qty: p.qty,
        images: p.images?.map((img: any) => ({ ...img, url: img.path ? `${BASE_URL}/${img.path}` : "", isPrimary: img.is_primary === 1 })) || [],
      }));

      setProducts(productsWithImages);
      setTotalProducts(productRes.data.pagination.total);

    } catch (err) {
      toast.error("Failed to fetch products ❌", { autoClose: 3000 });
    } finally {
      closeLoading();
    }
  };

  const validateForm = (): boolean => {
    const { isValid, errors: newErrors } = validateProductForm({
      formData,
      userRole,
      requiredFieldsMap,
      mainImages,
      altImages,
    });

    if (!isValid) {
      setErrors(newErrors);

      const firstErrorField = Object.keys(newErrors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorField}"]`);

      if (errorElement) {
        (errorElement as HTMLElement).scrollIntoView({ behavior: "smooth", block: "center" });
        (errorElement as HTMLElement).focus();
      }
    }

    return isValid;
  };


  const appendProductImagesToFormData = async (
    formPayload: FormData,
    mainImages: any[],
    altImages: any[],
    index: number,
    existingImages: any[]
  ) => {
    const images: any[] = [...mainImages, ...altImages];
    const currentImageIds = images
      .filter(img => img.id !== undefined)
      .map(img => img.id);

    existingImages.forEach((img, delIdx) => {
      if (!currentImageIds.includes(img.id)) {
        formPayload.append(`deleted_images[${delIdx}]`, String(img.id));
      }
    });

    for (let imgIdx = 0; imgIdx < images.length; imgIdx++) {
      const img = images[imgIdx];
      let fileToAppend: File | null = null;

      const type = img.isPrimary ? 'main' : 'alt';

      if (img.file instanceof File) {
        fileToAppend = img.file;
      }

      if (img.id !== undefined) {
        formPayload.append(`variant[${index}][images][${imgIdx}][id]`, String(img.id));
        formPayload.append(`variant[${index}][images][${imgIdx}][type]`, type);
      }

      if (fileToAppend) {
        formPayload.append(`variant[${index}][images][${imgIdx}][file]`, fileToAppend);
        formPayload.append(`variant[${index}][images][${imgIdx}][type]`, type);
      }
    }
  };

  const fetchFileFromBlob = async (img: any): Promise<File> => {
    const res = await fetch(img.url);
    const blob = await res.blob();
    const fileName = img.name || img.url.split("/").pop() || "image.png";
    return new File([blob], fileName, { type: blob.type });
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      const isEditing = !!editingProduct;
      const formPayload: any = new FormData();

      if (isEditing) {
        const originalProduct: any = editingProduct;
        Object.entries(formData).forEach(([key, value]) => {
          if (value === undefined || value === null || value === "") return;

          if (key === "active" || key === "maropost_sync" || key === "shopify_sync") {
            formPayload.append(key, value ? "1" : "0");
            return;
          }

          if (key === "variants" && (!formData.parent_id || formData.parent_id === "")) {
            return;
          }

          const originalValue =
            key === "qty" ? originalProduct.qty ?? "" : originalProduct[key] ?? "";
          const isDate = key.includes("promo_");
          let changed = false;
          if (isDate) {
            const originalDate = originalValue ? originalValue.split("T")[0] : "";
            changed = value !== originalDate;
          } else {
            changed = String(value).trim() !== String(originalValue).trim();
          }

          if (changed) {
            if (
              ["cost_price", "rrp", "store_price", "promo_price", "qty", "width", "length", "cubic", "height"].includes(key)
            ) {
              formPayload.append(key, String(parseFloat(value as string)));
            } else {
              formPayload.append(key, String(value));
            }
          }

        });
        if (formData.parent_id) {
          const index = 0;
          await appendProductImagesToFormData(
            formPayload,
            mainImages,
            altImages,
            index,
            editingProduct.images
          );
          formPayload.append(`variant[0][name]`, formData.name);
          formPayload.append(`variant[0][id]`, formData.variantsId || formData.id);
          formPayload.append(`variant[0][qty]`, formData.qty);
          formPayload.append(`variant[0][cost_price]`, formData.cost_price);
          if (formData.rrp != null && formData.rrp !== "") {
            formPayload.append(`variant[0][rrp]`, String(formData.rrp));
          }

          if (formData.store_price != null && formData.store_price !== "") {
            formPayload.append(`variant[0][store_price]`, String(formData.store_price));
          }

          if (Array.isArray(formData.variants_options)) {
            formData.variants_options.forEach((opt) => {
              formPayload.append(`variant[0][option][${opt.name}]`, String(opt.value ?? ""));
            });
          }
        } else {
          if (formData.variants !== undefined) {
            const allVariants: any[] = formData.variants.flatMap((v: any) =>
              Array.isArray(v) ? v : []
            );
            for (let index = 0; index < allVariants.length; index++) {
              const variant = allVariants[index];
              formPayload.append(`variant[${index}][name]`, variant.name || "");
              formPayload.append(`variant[${index}][sku]`, variant.sku || "");
              formPayload.append(`variant[${index}][qty]`, variant.qty || "");
              formPayload.append(`variant[${index}][cost_price]`, variant.price || "");
              formPayload.append(`variant[${index}][rrp]`, variant.rrp || "");
              formPayload.append(`variant[${index}][store_price]`, variant.store_price || "");

              if (variant.option && typeof variant.option === "object") {
                Object.entries(variant.option).forEach(([key, value]: any) => {
                  formPayload.append(`variant[${index}][option][${key}]`, value);
                });
              }

              if (variant.images && Array.isArray(variant.images)) {
                const fetchFileFromBlob = async (img: { url?: string }): Promise<File | null> => {
                  if (!img.url) return null;
                  try {
                    const response = await fetch(img.url);
                    const blob = await response.blob();
                    return new File([blob], "image.jpg", { type: blob.type });
                  } catch {
                    return null;
                  }
                };

                for (let imgIdx = 0; imgIdx < variant.images.length; imgIdx++) {
                  const img = variant.images[imgIdx];
                  let fileToAppend: File | null = null;

                  if (img.file instanceof File) {
                    fileToAppend = img.file;
                  } else if (img.url && img.url.startsWith("blob:")) {
                    fileToAppend = await fetchFileFromBlob(img);
                  }

                  if (fileToAppend) {
                    formPayload.append(`variant[${index}][images][${imgIdx}][file]`, fileToAppend);
                  } else if (img.id !== undefined) {
                    formPayload.append(`variant[${index}][images][${imgIdx}][id]`, String(img.id));
                  } else if (img.url) {
                    formPayload.append(`variant[${index}][images][${imgIdx}][url]`, img.url);
                  }

                  formPayload.append(`variant[${index}][images][${imgIdx}][type]`, img.type || 'alt');
                }
              }
            }

          }
        }
      } else {
        Object.entries(formData).forEach(([key, value]) => {
          if (value === undefined || value === null || value === "") return;
          if (key === "active" || key === "maropost_sync" || key === "shopify_sync") {
            formPayload.append(key, value ? "1" : "0");
            return;
          }

          if (key === "variants" && (!formData.parent_id || formData.parent_id === "")) {
            return;
          }

          if (
            ["cost_price", "rrp", "store_price", "promo_price", "qty", "width", "length", "cubic", "height", "parent_id"].includes(key)
          ) {
            formPayload.append(key, String(parseFloat(value as string)));
          } else {
            formPayload.append(key, String(value));
          }
        });

        const variantsData = formData.variants || [];
        const flattenedVariants: any[] = [];
        variantsData.forEach((group: any) => {
          if (Array.isArray(group)) {
            group.forEach((v) => flattenedVariants.push(v));
          } else if (group) {
            flattenedVariants.push(group);
          }
        });

        const fetchFileFromBlob = async (img: { url?: string }): Promise<File | null> => {
          if (!img.url) return null;
          const response = await fetch(img.url);
          const blob = await response.blob();
          return new File([blob], "image.jpg", { type: blob.type });
        };


        for (let index = 0; index < flattenedVariants.length; index++) {
          const variant = flattenedVariants[index];
          formPayload.append(`variant[${index}][name]`, variant.name);
          formPayload.append(`variant[${index}][sku]`, variant.sku);
          formPayload.append(`variant[${index}][qty]`, variant.qty);
          formPayload.append(`variant[${index}][cost_price]`, variant.price);
          formPayload.append(`variant[${index}][rrp]`, variant.rrp);
          formPayload.append(`variant[${index}][store_price]`, variant.store_price);

          if (variant.option) {
            Object.entries(variant.option).forEach(([optionKey, value]) => {
              formPayload.append(`variant[${index}][option][${optionKey}]`, value as string);
            });
          }
          const mainImages = (variant.images || []).filter((img: any) => img.type === 'main');
          const altImages = (variant.images || []).filter((img: any) => img.type === 'alt');
          const images = [...mainImages, ...altImages];

          for (let imgIdx = 0; imgIdx < images.length; imgIdx++) {
            const img = images[imgIdx];
            let fileToAppend: File | null = null;

            if (img.file instanceof File) {
              fileToAppend = img.file;
            } else if (img.url) {
              fileToAppend = await fetchFileFromBlob(img);
            }

            if (fileToAppend) {
              formPayload.append(`variant[${index}][images][${imgIdx}][file]`, fileToAppend);
              formPayload.append(`variant[${index}][images][${imgIdx}][type]`, img.type || 'alt');
            } else if (img.id !== undefined) {
              formPayload.append(`variant[${index}][images][${imgIdx}][id]`, String(img.id));
              formPayload.append(`variant[${index}][images][${imgIdx}][type]`, img.type || 'alt');
            }
          }
        }
      }

      if (formData.parent_id === null || formData.parent_id === undefined || formData.parent_id === "") {
        const allImages: (
          | { file: File; type: "main" | "alt" }
          | { id: number; type: "main" | "alt" }
        )[] = [];
        const currentImageIds: number[] = [];
        const prepareImageData = async (img: any, type: "main" | "alt") => {
          if ("file" in img && img.file instanceof File) {
            allImages.push({ file: img.file, type });
          } else if ("url" in img && img.url && !img.id) {
            const file = await fetchFileFromBlob(img);
            allImages.push({ file, type });
          } else if (img.id) {
            allImages.push({ id: img.id, type });
            currentImageIds.push(img.id);
          }
        };

        for (const img of mainImages || []) await prepareImageData(img, "main");
        for (const img of altImages || []) await prepareImageData(img, "alt");
        if (isEditing) {
          const originalImages: any[] = editingProduct.images || [];
          const deletedImages = originalImages.filter(
            (img) => !currentImageIds.includes(img.id)
          );
          deletedImages.forEach((img, index) => {
            formPayload.append(`deleted_images[${index}]`, String(img.id));
          });
        }

        allImages.forEach((image, index) => {
          if ("file" in image) {
            formPayload.append(`images[${index}][file]`, image.file);
            formPayload.append(`images[${index}][type]`, image.type);
          } else if ("id" in image) {
            formPayload.append(`images[${index}][id]`, String(image.id));
            formPayload.append(`images[${index}][type]`, image.type);
          }
        });
      }

      const finalPayload: any = new FormData();

      for (const [key, value] of formPayload.entries()) {
        if (key === "variations" || key === "variants_options") continue;

        const finalKey = key === "category" ? "category_id" : key;
        finalPayload.append(finalKey, value);
      }

      const obj: Record<string, any> = {};
      for (const [key, value] of finalPayload.entries()) {
        obj[key] = value;
      }

      if (formData.parent_id !== null && formData.parent_id !== undefined && formData.parent_id !== "") {
        finalPayload.delete("cost_price");
        delete obj["cost_price"];
        finalPayload.delete("store_price");
        delete obj["store_price"];
        finalPayload.delete("rrp");
        delete obj["rrp"];
      }

      const apiEndpoint = isEditing
        ? `${API_URL}/products/${formData.parent_id ? formData.parent_id : editingProduct.id}?_method=PUT`
        : `${API_URL}/products`;

      const config = { headers: { "Content-Type": "multipart/form-data" } };
      const response: any = await axios.post(apiEndpoint, finalPayload, config);

      if (response.data?.status === true || response.status === 200 || response.status === 201) {
        toast.success(
          `Product ${isEditing ? "updated" : "added"} successfully ✅`,
          { autoClose: 3000 }
        );
        fetchInitialData();
        handleCloseDialog();
      } else {
        toast.error(response.data?.message || "Something went wrong 😞", {
          autoClose: 4000,
        });
      }

    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "An unexpected error occurred";

      toast.error(errorMessage, { autoClose: 4000 });
    }
  };

  const fetchProductById = async (id: number) => {
    try {
      const result: any = await fetchProduct(id);

      if (!result.success) {
        toast.error("Failed to fetch product details ❌", { autoClose: 3000 });
        return;
      }

      setEditingProduct(result.product);
      setFormData(result.formData);
      setMainImages(result.mainImages);
      setAltImages(result.altImages);

      setOpenDialog(true);
      navigate(`/products?edit=${result.product.id}`);
    } catch {
      toast.error("Failed to fetch product details ❌", { autoClose: 3000 });
    } finally {
    }
  };


  const handleCloseDialog = () => {
    setOpenDialog(false);
    resetForm();
    setMainImages([]);
    setAltImages([]);
    setErrors({});
    navigate("/products", { replace: true });
  };

  const handleViewProduct = (product: any) => {
    setViewProduct(product);
    setOpenViewDialog(true);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      category: "", brand: "", sku: "", name: "", description: "", qty: "0", parent_id: "", subtitle: "", store_price: "", id: "",
      promo_start: "", promo_end: "", rrp: "", promo_price: "", cost_price: "", width: "", length: "", cubic: "", height: "", seo_title: "", seo_description: ""
    });

    setErrors({});
  };

  const handleDeleteClick = (id: number) => {
    setDeletingProductId(id);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingProductId) {
      try {
        await axios.delete(`${API_URL}/products/${deletingProductId}`);
        toast.success("Product deleted successfully 🗑️", { autoClose: 3000 });
        setSelectedProducts(prev => prev.filter(id => id !== deletingProductId));
        fetchInitialData();
        setOpenDeleteDialog(false);
        setDeletingProductId(null);
      } catch (err) {
        toast.error("Failed to delete product ❌", { autoClose: 3000 });
      }
    }
  };

  const getCategoryName = (id: number) => categories.find((c) => Number(c.id) === Number(id))?.name || "";
  const getBrandName = (id: number) => {
    if (!brands || brands.length === 0) return "-";
    const brand = brands.find((b) => Number(b.id) === Number(id));
    return brand ? brand.name : "-";
  };

  const handleCloseAddCategoryDialog = () => {
    setOpenAddCategoryDialog(false);
    setOpenDialog(true);
  };

  const handleCloseAddBrandDialog = () => {
    setOpenAddBrandDialog(false);
    setOpenDialog(true);
  };

  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Category name cannot be empty.", { autoClose: 3000 });
      return;
    }

    try {
      const response: any = await axios.post(`${API_URL}/categories`, { name: newCategoryName });
      const newCat = response.data.data;
      setCategories((prev) => [...prev, newCat]);
      setFormData((prev) => ({ ...prev, category: newCat.id }));
      toast.success("Category added successfully 🎉", { autoClose: 3000 });
      handleCloseAddCategoryDialog();

    } catch (err) {
      toast.error("Failed to add category ❌", { autoClose: 3000 });
    }
  };

  const handleSaveBrand = async (name?: string) => {
    const brandName = name || brandNameToSave;
    if (!brandName.trim()) {
      toast.error("Brand name cannot be empty.", { autoClose: 3000 });
      return;
    }

    try {
      const response: any = await axios.post(`${API_URL}/brands`, { name: brandName });
      toast.success("Brand added successfully", { autoClose: 3000 });
      const newBrand = response.data;
      setBrands((prev) => [...prev, newBrand]);
      setFormData((prev) => ({ ...prev, brand: newBrand.id }));
      setOpenAddBrandDialog(false);
      setBrandNameToSave("");
    } catch (err: any) {
      const backendError =
        err.response?.data?.errors?.name?.[0] ||
        err.response?.data?.message ||
        "Something went wrong";
      toast.error(`${backendError}`, { autoClose: 3000 });
    }
  };

  const handleSelectProduct = (productId: number) => {
    if (isSelectAllMode) {
      if (selectedProducts.includes(productId)) {
        setManuallyUnselected(prev => [...prev, productId]);
        setSelectedProducts(prev => prev.filter(id => id !== productId));
      } else {
        setManuallyUnselected(prev => prev.filter(id => id !== productId));
        setSelectedProducts(prev => [...prev, productId]);
      }
    } else {
      setSelectedProducts(prev =>
        prev.includes(productId)
          ? prev.filter(id => id !== productId)
          : [...prev, productId]
      );
    }
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (products.length === 0) {
      setSelectedProducts([]);
      return;
    }

    if (isSelectAllMode) {
      if (event.target.checked) {
        const newlySelected = currentPageIds.filter(id => !selectedProducts.includes(id));
        setSelectedProducts(prev => Array.from(new Set([...prev, ...newlySelected])));
        setManuallyUnselected(prev => prev.filter(id => !currentPageIds.includes(id)));
      } else {
        setSelectedProducts(prev => prev.filter(id => !currentPageIds.includes(id)));
        setManuallyUnselected(prev => Array.from(new Set([...prev, ...currentPageIds])));
      }
    } else {
      if (event.target.checked) {
        setSelectedProducts(prev => Array.from(new Set([...prev, ...currentPageIds])));
      } else {
        setSelectedProducts(prev => prev.filter(id => !currentPageIds.includes(id)));
      }
    }
  };

  const handleSelectAllProducts = async (selectAll: boolean) => {
    if (selectAll) {
      setIsSelectAllMode(true);
      setSelectedProducts(currentPageIds);
      setManuallyUnselected([]);

    } else {
      setIsSelectAllMode(false);
      setSelectedProducts([]);
      setManuallyUnselected([]);
    }
  };


  const handleConfirmBulkDelete = async () => {

    try {
      let payload: any = {};
      if (isSelectAllMode) {
        payload = {
          bulk_deleted_product_id: "all"
        };

        if (manuallyUnselected.length > 0) {
          payload.unselectproductid = manuallyUnselected;
        }
      } else {
        payload = {
          bulk_deleted_product_id: selectedProducts
        };
      }

      await axios.post(`${API_URL}/products/bulk-delete`, payload);
      setPage(1);
      toast.success("Selected products deleted successfully 🗑️", { autoClose: 3000 });
      setSelectedProducts([]);
      fetchInitialData();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to sync products";
      toast.error(errorMessage, { autoClose: 3000 });
    } finally {
      setOpenBulkDeleteDialog(false);
    }

    // try {

    // } catch (err) {
    //   toast.error("Failed to delete selected products ❌", { autoClose: 3000 });
    // } finally {
    //   setOpenBulkDeleteDialog(false);
    // }
  };

  const handleApplyFilters = async (filters: any) => {

    try {
      const params = new URLSearchParams();
      if (filters.sku) params.append("sku", filters.sku);
      if (filters.brand) params.append("brand", filters.brand);
      if (filters.name) params.append("name", filters.name);
      if (filters.parent_sku) params.append("parentsku", filters.parent_sku);
      if (filters.active !== "" && filters.active !== undefined) params.append("active", filters.active);
      if (filters.min_qty) params.append("min_qty", filters.min_qty);
      if (filters.max_qty) params.append("max_qty", filters.max_qty);

      const response: any = await axios.get(`${API_URL}/products?${params.toString()}`);

      setProducts(response.data.data);
      setTotalProducts(response.data.pagination?.total || response.data.data.length);
    } catch (err) {
      toast.error("Failed to filter products ❌", { autoClose: 3000 });
    } finally {

    }
  };

  const handleSyncProducts = async () => {
    // try {
    //   let payload: any = {};

    //   if (isSelectAllMode) {
    //     payload = {
    //       select: "all"
    //     };

    //     if (manuallyUnselected.length > 0) {
    //       payload.unselect = manuallyUnselected;
    //     }
    //   } else {
    //     payload = {
    //       sku: selectedProducts
    //     };
    //   }

    //  await axios.post(`${API_URL}/products/bulk-delete`, payload);
    // setPage(1);
    // toast.success("Selected products deleted successfully 🗑️", { autoClose: 3000 });
    // setSelectedProducts([]);
    // fetchInitialData();
    // } catch (err: any) {
    //   const errorMessage = err.response?.data?.message || "Failed to sync products";
    //   toast.error(errorMessage, { autoClose: 3000 });
    // }

    Swal.fire({
      icon: "success", title: "🎉 Products have been synced successfully.", text: "Success!", showConfirmButton: false,
      timer: 3000, timerProgressBar: true, background: "#fff", color: "#333", backdrop: `rgba(0,0,0,0.4)`,
      showClass: { popup: "animate__animated animate__fadeInDown", },
      hideClass: { popup: "animate__animated animate__fadeOutUp", },
    });
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileAction = (action: () => void) => {
    action();
    setMobileMenuOpen(false);
  };

  return (
    <>
      <FilterBar onApplyFilters={handleApplyFilters} rowsPerPage={rowsPerPage} page={page} />
      <ProductActions totalProducts={totalProducts} selectedProducts={selectedProducts} products={products} manuallyUnselected={manuallyUnselected}
        rowsPerPage={rowsPerPage} mobileMenuOpen={mobileMenuOpen} handleMobileMenuToggle={handleMobileMenuToggle} handleMobileAction={handleMobileAction}
        handleSyncProducts={handleSyncProducts} setOpenBulkDeleteDialog={setOpenBulkDeleteDialog} navigate={navigate} fetchInitialData={fetchInitialData}
        handleSelectAll={handleSelectAllProducts} isSelectAllMode={isSelectAllMode} allSelected={allSelected} />

      <ProductTable products={products} totalProducts={totalProducts} rowsPerPage={rowsPerPage} page={page} setPage={setPage}
        setRowsPerPage={setRowsPerPage} allSelected={allSelected} partiallySelected={partiallySelected} selectedProducts={selectedProducts}
        handleSelectAll={handleSelectAll} handleSelectProduct={handleSelectProduct} fetchProductById={fetchProductById} handleViewProduct={handleViewProduct}
        handleDeleteClick={handleDeleteClick} getCategoryName={getCategoryName} getBrandName={getBrandName} BASE_URL={BASE_URL} />

      {openDialog && (
        <AddProductDialog open={openDialog} onClose={handleCloseDialog}
          editingProduct={editingProduct} formData={formData} setFormData={setFormData} errors={errors} setErrors={setErrors}
          categories={categories} brands={brands} requiredFieldsMap={requiredFieldsMap} userRole={userRole} shopifyStatus={shopifyStatus}
          maropostStatus={maropostStatus} mainImages={mainImages} setMainImages={setMainImages} altImages={altImages} setAltImages={setAltImages}
          handleSubmit={handleSubmit} openAddCategoryDialog={openAddCategoryDialog} setOpenAddCategoryDialog={setOpenAddCategoryDialog} setOpenAddBrandDialog={setOpenAddBrandDialog} newCategoryName={newCategoryName}
          setNewCategoryName={setNewCategoryName} handleSaveCategory={handleSaveCategory} openAddBrandDialog={openAddBrandDialog} handleSaveBrand={handleSaveBrand} handleCloseAddCategoryDialog={handleCloseAddCategoryDialog}
          handleCloseAddBrandDialog={handleCloseAddBrandDialog} customFields={customFields}
        />
      )}

      {openDeleteDialog && (
        <ConfirmDialog open={openDeleteDialog} title="Confirm Deletion" message="Are you sure you want to delete this product?"
          onConfirm={handleConfirmDelete} onClose={() => setOpenDeleteDialog(false)} confirmText="Delete" cancelText="Cancel" />
      )}
      {openBulkDeleteDialog && (
        <ConfirmDialog
          open={openBulkDeleteDialog} title="Confirm Bulk Deletion" message={`Are you sure you want to delete ${selectedProducts.length} selected products?`}
          onConfirm={handleConfirmBulkDelete} onClose={() => setOpenBulkDeleteDialog(false)} confirmText="Delete" cancelText="Cancel"
        />
      )}
      {openViewDialog && (
        <ViewProduct open={openViewDialog} onClose={() => setOpenViewDialog(false)} viewProduct={viewProduct} getCategoryName={getCategoryName} getBrandName={getBrandName} />
      )}
    </>
  );
};

export default Products;