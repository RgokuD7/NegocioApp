export interface Category {
    id: number;
    name: string;
  }
  
export interface Group {
    id: number;
    name: string;
  }
  
export interface Product {
    id: number;
    name: string;
    category_id: number | null;
    group_id: number | null;
    supplier_code: string | null;
    price: number;
    unit: string | null;
    quick_access: boolean;
    keyboard_shortcut: string;
  }

  export interface Barcode{
    id: number;
    product_id: number;
    barcode: string;
  }