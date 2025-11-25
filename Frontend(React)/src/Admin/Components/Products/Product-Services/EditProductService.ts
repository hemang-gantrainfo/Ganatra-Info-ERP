import axios from "axios";
import API_URL from "../../../../config";

export const fetchProduct = async (id: number) => {
  try {
    const response: any = await axios.get(`${API_URL}/products/${id}`);
    const product = response.data.product;

    const mainImages = (product.images || [])
      .filter((img: any) => img.type === "main")
      .map((img: any) => ({
        id: img.id,
        url: img.url || img.image_path,
        isPrimary: true,
      }));

    const altImages = (product.images || [])
      .filter((img: any) => img.type === "alt")
      .map((img: any) => ({
        id: img.id,
        url: img.url || img.image_path,
      }));

    const formData = {
      category: product.category_id || "",
      id: product.id || "",
      brand: product.brand || "",
      sku: product.sku || "",
      name: product.name || "",
      description: product.description || "",
      qty: product.qty || "0",
      totalQty: product.total_qty,
      parent_id: product.parent_id || "",
      rrp: product.rrp || "",
      subtitle: product.subtitle || "",
      store_price: product.store_price || "",
      promo_start: product.promo_start ? product.promo_start.split("T")[0] : "",
      promo_end: product.promo_end ? product.promo_end.split("T")[0] : "",
      promo_price: product.promo_price || "",
      seo_title: product.seo_title || "",
      seo_description: product.seo_description || "",
      cost_price: product.cost_price || "",
      width: product.width || "",
      length: product.length || "",
      cubic: product.cubic || "",
      height: product.height || "",
      active: product.active || false,
      shopify_sync: product.shopify_sync || false,
      maropost_sync: product.maropost_sync || false,
    };

    return {
      success: true,
      product,
      formData,
      mainImages,
      altImages,
    };
  } catch (error) {
    return { success: false, error };
  }
};
