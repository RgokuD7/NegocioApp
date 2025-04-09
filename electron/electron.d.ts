// electron.d.ts

declare global {
  interface Window {
    electron: {
      // Base de datos
      database: {
        importData: (filePath: string) => Promise<{ message: string }>; // Función para importar datos desde un archivo
        getCategories: () => Promise<Category[]>; // Obtiene las categorías
        addCategory: (name: string) => Promise<Category>; // Agrega una categoría
        getGroups: () => Promise<Group[]>; // Obtiene los grupos
        addGroup: (name: string) => Promise<Group>; // Agrega un grupo
        getBarcodes: () => Promise<Barcode[]>; // Obtiene los códigos de barras
        getBarcodeByProductId: (productId: number) => Promise<Barcode[]>; // Obtiene los códigos de barras por ID de producto
        addBarcode: (producId: number, barcode: string) => Promise<void>; // Agrega un código de barras
        getProducts: () => Promise<Product[]>; // Obtiene los productos
        getQuickAccessProducts: () => Promise<Product[]>; // Obtiene productos de acceso rápido
        updateQuickAccess: (
          id: number,
          quick_access: boolean,
          keyboard_shortcut: string
        ) => Promise<void>; // Actualizar quick_access
        checkQuickAccessKey: (key: string) => Promise<boolean>; // Verifica la existencia de una tecla de acceso rápido
        addProduct: (product: Product) => Promise<Product>; // Agrega un producto
        updateProduct: (product: Product) => Promise<Product>; // Actualiza un producto
        searchProducts: (query: string) => Promise<Product[]>; // Busca productos por nombre, código, etc.
        searchProductsByBarcode: (barcode: number) => Promise<Product[]>; // Busca productos por código
        searchProductBySupplierCode: (code: string) => Promise<Product[]>; // Busca productos por código de proveedor
        deleteProduct: (id: number) => Promise<void>; // Elimina un producto
      };
      // Importación de datos
      // Dialogs
      dialog: {
        showError: (message: string) => void; // Muestra un mensaje de error
        showSuccess: (message: string) => void; // Muestra un mensaje de éxito
      };
      // Sistema
      system: {
        getAppVersion: () => Promise<string>; // Obtiene la versión de la app
        selectFile: () => Promise<string>; // Obtiene ruta de un archivo
      };
    };
  }
}

// Esto es necesario para que TypeScript reconozca la declaración global
export {};
