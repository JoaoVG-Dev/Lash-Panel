import { supabase } from "@/integrations/supabase/client";

export type ProductType = "cola" | "fios" | "removedor" | "primer" | "cleanser" | "outros";
export type ProductStatus = "active" | "inactive";
export type ProductAlert = "expired" | "expiring" | "low_stock" | "ok";

export type Product = {
  id: string;
  user_id: string;
  name: string;
  brand: string | null;
  category: string | null;
  product_type: ProductType;
  quantity: number;
  unit: string;
  expiration_date: string | null;
  alert_quantity: number | null;
  status: ProductStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductInput = {
  name: string;
  brand?: string | null;
  category?: string | null;
  product_type: ProductType;
  quantity: number;
  unit: string;
  expiration_date?: string | null;
  alert_quantity?: number | null;
  status: ProductStatus;
  notes?: string | null;
};

export const PRODUCT_TYPES: Array<{ value: ProductType; label: string }> = [
  { value: "cola", label: "Cola" },
  { value: "fios", label: "Fios" },
  { value: "removedor", label: "Removedor" },
  { value: "primer", label: "Primer" },
  { value: "cleanser", label: "Cleanser" },
  { value: "outros", label: "Outros" },
];

const EXPIRING_WINDOW_DAYS = 30;

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return 0;
}

function normalizeProduct(row: Product): Product {
  return {
    ...row,
    quantity: toNumber(row.quantity),
    alert_quantity: row.alert_quantity === null ? null : toNumber(row.alert_quantity),
  };
}

function normalizeInput(input: ProductInput) {
  return {
    name: input.name.trim(),
    brand: input.brand?.trim() || null,
    category: input.category?.trim() || null,
    product_type: input.product_type,
    quantity: Number.isFinite(input.quantity) ? input.quantity : 0,
    unit: input.unit.trim() || "un",
    expiration_date: input.expiration_date || null,
    alert_quantity:
      input.alert_quantity === null || input.alert_quantity === undefined
        ? null
        : Number(input.alert_quantity),
    status: input.status,
    notes: input.notes?.trim() || null,
  };
}

export function getProductTypeLabel(type: ProductType | string) {
  return PRODUCT_TYPES.find((item) => item.value === type)?.label ?? "Outros";
}

export function getProductAlert(product: Product, referenceDate = new Date()): ProductAlert {
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);

  if (product.expiration_date) {
    const expiration = new Date(`${product.expiration_date}T00:00:00`);
    const diffDays = Math.ceil((expiration.getTime() - today.getTime()) / 86_400_000);
    if (diffDays < 0) return "expired";
    if (diffDays <= EXPIRING_WINDOW_DAYS) return "expiring";
  }

  if (product.alert_quantity !== null && product.quantity <= product.alert_quantity) {
    return "low_stock";
  }

  return "ok";
}

export function isProductInAlert(product: Product) {
  return getProductAlert(product) !== "ok";
}

export async function listProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as Product[]).map(normalizeProduct);
}

export async function listGlueProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("product_type", "cola")
    .eq("status", "active")
    .order("name", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as Product[]).map(normalizeProduct);
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error("Não autenticado");

  const { data, error } = await supabase
    .from("products")
    .insert({ user_id: userId, ...normalizeInput(input) })
    .select()
    .single();
  if (error) throw error;
  return normalizeProduct(data as Product);
}

export async function updateProduct(id: string, input: ProductInput): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .update(normalizeInput(input))
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return normalizeProduct(data as Product);
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

export async function countProductsInAlert(): Promise<number> {
  const products = await listProducts();
  return products.filter(isProductInAlert).length;
}
