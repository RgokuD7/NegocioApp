export interface Category {
  id: number;
  name: string;
}

export interface Group {
  id: number;
  name: string;
  price: number;
}

export interface Product {
  id: number;
  name: string;
  category_id: number | null;
  group_id: number | null;
  price: number;
  unit_id: number | null;
  quick_access: boolean;
  keyboard_shortcut: string;
}

export interface Barcode {
  id: number;
  product_id: number;
  barcode: number;
}

export interface Supplier {
  id: number;
  rut: string;
  name: string;
}
export interface SupplierCode {
  id: number;
  supplier_id: number;
  product_id: number;
  code: string;
}
export interface Unit {
  id: number;
  unit: string;
  singular_unit: string;
  price_unit: string;
}
export interface Sale {
  id: number;
  date: string;
  total: number;
  payment_method: string | null;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number | null;
  quantity: number;
  price: number;
  subtotal: number;
}
