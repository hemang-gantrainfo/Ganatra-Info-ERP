export interface ProductField {
  name: string;
  label: string;
  type: "text" | "numeric" | "date" | "select" | "custom";
  required?: boolean;
  fullWidth?: boolean;
  options?: any[];
  layout?: "vertical" | "horizontal";
  selectionType?: "single" | "multiple";
  maxLength?: number;
}

export interface ProductSection {
  section: string;
  fields: ProductField[];
}

export const productFields: ProductSection[] = [
  {
    section: "Parent Product",
    fields: [],
  },
  {
    section: "Basic Information",
    fields: [
      { name: "name", label: "Product Name", type: "text", required: true, fullWidth: true },
      { name: "sku", label: "Product Code (SKU)", type: "text", required: true, fullWidth: true },
      { name: "qty", label: "Quantity (Qty)", type: "numeric", required: true, fullWidth: true },
      { name: "subtitle", label: "Subtitle", type: "text", fullWidth: true },
      { name: "brand", label: "Brand", type: "text", fullWidth: true, options: [] },
    ],
  },
  {
    section: "Description",
    fields: [],
  },
  {
    section: "Images",
    fields: [],
  },
  {
    section: "Pricing",
    fields: [
      { name: "rrp", label: "Price (Rrp)", type: "numeric", required: true, fullWidth: true },
      { name: "cost_price", label: "Cost Price", type: "numeric", fullWidth: true },
      { name: "store_price", label: "Store Price", type: "numeric", fullWidth: true },
    ],
  },
  {
    section: "Offers",
    fields: [
      { name: "promo_price", label: "Promo Price", type: "numeric", fullWidth: true },
      { name: "promo_start", label: "Promo Start", type: "date", fullWidth: true },
      { name: "promo_end", label: "Promo End", type: "date", fullWidth: true },
    ],
  },
  {
    section: "Others",
    fields: [
      { name: "category", label: "Category", type: "select", fullWidth: true, options: [] },
    ],
  },
  {
    section: "Product Variations", fields: []
  },
  {
    section: "Shipping",
    fields: [
      { name: "height", label: "Height (cm)", type: "numeric", fullWidth: true },
      { name: "width", label: "Width (cm)", type: "numeric", fullWidth: true },
      { name: "length", label: "Length (cm)", type: "numeric", fullWidth: true },
      { name: "cubic", label: "Cubic", type: "numeric", fullWidth: true, maxLength: 4 },
      // { name: "shippingWeight", label: "Shipping Weight", type: "numeric", fullWidth: true },
    ],
  },
  {
    section: "SEO",
    fields: [
      { name: "seo_title", label: "SEO Page Title ", type: "text", fullWidth: true },
    ],
  },
];