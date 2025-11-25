export interface ValidationParams {
  formData: Record<string, any>;
  userRole: any;
  requiredFieldsMap: Record<string, boolean>;
  mainImages?: { url: string; isPrimary?: boolean }[];
  altImages?: { url: string }[];
}

export const validateProductForm = ({
  formData,
  userRole,
  requiredFieldsMap,
  mainImages = [],
  altImages = [],
}: ValidationParams): { isValid: boolean; errors: Record<string, string> } => {
  const newErrors: Record<string, string> = {};

  const labelMap: Record<string, string> = {
    sku: "Product Code",
    rrp: "Price",
    price: "Price",
    name: "Product Name",
    description: "Description",
    qty: "Quantity (Qty)",
    category: "Category",
    brand: "Brand",
    parent_id: "Parent ID",
    subtitle: "Subtitle",
    promo_start: "Promo Start",
    promo_end: "Promo End",
    promo_price: "Promo Price",
    seo_title: "SEO Page Title",
    seo_description: "SEO Description",
    cost_price: "Cost Price",
    store_price: "Store Price",
    width: "Width",
    length: "Length",
    cubic: "Cubic",
    height: "Height",
    images: "Images",
    main_image: "Main Image",
    alt_images: "Alt Images",
  };

  const isVariant = formData.parent_id !== null && formData.parent_id !== "";
  const variantRequiredFields = ["cost_price", "qty", "name", "sku"];

  const requiredFields =
    userRole === "user"
      ? ["sku", "name", "qty"]
      : isVariant
        ? variantRequiredFields
        : Object.keys(requiredFieldsMap).filter((field) => requiredFieldsMap[field]);

  requiredFields.forEach((field) => {
    if (field === "main_image" || field === "alt_images") {
      if (field === "main_image" && (!mainImages || mainImages.length === 0)) {
        newErrors["main_image"] = "Main Image is required";
      }
      if (field === "alt_images" && (!altImages || altImages.length === 0)) {
        newErrors["alt_images"] = "Alt Images are required";
      }
      return;
    }

    const value = formData[field as keyof typeof formData];

    if (field === "qty") {
      if (value === undefined || value === null || (typeof value === "string" && value.trim() === "")) {
        newErrors[field] = `${labelMap[field]} is required`;
      }
      return;
    }

    if (
      value === undefined ||
      value === null ||
      value === 0 ||
      (typeof value === "string" && value.trim() === "") ||
      (Array.isArray(value) && value.length === 0)
    ) {
      newErrors[field] = `${labelMap[field] || field} is required`;
    }
  });

  if (!isVariant) {
    const promoFields = ["promo_price", "promo_start", "promo_end"];
    const promoValues = promoFields.map((f) => formData[f]);
    const filledPromoCount = promoValues.filter((v) => v !== undefined && v !== null && v !== "").length;

    if (filledPromoCount > 0 && filledPromoCount < promoFields.length) {
      promoFields.forEach((field, index) => {
        if (!promoValues[index] || promoValues[index].toString().trim() === "") {
          newErrors[field] = `${labelMap[field]} is required when any promo field is filled`;
        }
      });
    }
  }

  return {
    isValid: Object.keys(newErrors).length === 0,
    errors: newErrors,
  };
};
