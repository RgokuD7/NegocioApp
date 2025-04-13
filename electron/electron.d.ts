declare global {
  interface Window {
    electron: {
      // Base de datos
      database: {
        importData: (filePath: string) => Promise<{ message: string }>; // Función para importar datos desde un archivo
        exportData: (savePath: string) => Promise<{ message: string }>; // Función para exportar datos a un archivo
        getCategories: () => Promise<Category[]>; // Obtiene las categorías
        addCategory: (name: string) => Promise<Category>; // Agrega una categoría
        getGroups: () => Promise<Group[]>; // Obtiene los grupos
        addGroup: (name: string, price: number) => Promise<Group>; // Agrega un grupo

        // ========================================================
        // Funciones relacionadas con Códigos de Barras (Barcodes)
        // ========================================================
        getBarcodes: () => Promise<Barcode[]>; // Obtiene todos los códigos de barras
        getBarcodeByProductId: (productId: number) => Promise<Barcode[]>; // Obtiene los códigos de barras por ID de producto
        addBarcode: (productId: number, barcode: string) => Promise<void>; // Añade un código de barras a un producto

        // ========================================================
        // Funciones relacionadas con Proveedores (Suppliers)
        // ========================================================
        getSuppliers: () => Promise<Supplier[]>; // Obtiene todos los proveedores
        getSupplierById: (supplierId: number) => Promise<Supplier>; // Obtiene un proveedor por su ID
        addSupplier: (rut: string, name: string) => Promise<Supplier>; // Añade un nuevo proveedor
        updateSupplier: (id: number, rut: string, name: string) => Promise<Supplier>; // Actualiza un proveedor
        deleteSupplier: (supplierId: number) => Promise<void>; // Elimina un proveedor

        // ========================================================
        // Funciones relacionadas con Códigos de Proveedores (Supplier Codes)
        // ========================================================
        getSupplierCodes: () => Promise<SupplierCode[]>; // Obtiene todos los códigos de proveedores
        getSupplierCodesByProductId: (productId: number) => Promise<SupplierCode[]>; // Obtiene códigos de proveedores por ID de producto
        getSupplierCodesBySupplierId: (supplierId: number) => Promise<SupplierCode[]>; // Obtiene códigos de proveedores por ID de proveedor
        addSupplierCode: (supplierId: number, productId: number, code: string) => Promise<void>; // Añade un código de proveedor
        updateSupplierCode: (id: number, supplierId: number, productId: number, code: string) => Promise<void>; // Actualiza un código de proveedor
        deleteSupplierCode: (id: number) => Promise<void>; // Elimina un código de proveedor

        // ========================================================
        // Funciones relacionadas con Productos (Products)
        // ========================================================
        getProducts: () => Promise<Product[]>; // Obtiene todos los productos
        getQuickAccessProducts: () => Promise<Product[]>; // Obtiene los productos de acceso rápido
        updateQuickAccess: (
          id: number,
          quick_access: boolean,
          keyboard_shortcut: string
        ) => Promise<void>; // Actualiza el acceso rápido de un producto
        checkQuickAccessKey: (key: string) => Promise<boolean>; // Verifica si una tecla de acceso rápido ya está en uso
        addProduct: (product: Product) => Promise<Product>; // Agrega un nuevo producto
        updateProduct: (product: Product) => Promise<Product>; // Actualiza un producto existente
        searchProducts: (query: string) => Promise<Product[]>; // Busca productos por nombre, código, etc.
        searchProductsByBarcode: (barcode: number) => Promise<Product[]>; // Busca productos por código de barras
        searchProductBySupplierCode: (code: string) => Promise<Product[]>; // Busca productos por código de proveedor
        deleteProduct: (id: number) => Promise<void>; // Elimina un producto

        // ========================================================
        // Funciones relacionadas con unidades (Units)
        // ========================================================
        getUnits: () => Promise<Unit[]>; // Obtiene todas las unidades
        addUnit: (unit: string) => Promise<Unit>; // Añade una nueva unidad
        updateUnit: (id: number, unit: string) => Promise<Unit>; // Actualiza una unidad existente
        deleteUnit: (id: number) => Promise<void>; // Elimina una unidad
        // ========================================================
        // Funciones relacionadas con Ventas (Sales)
        // ========================================================
        getSales: () => Promise<Sale[]>; // Obtiene todas las ventas
        getSaleById: (saleId: number) => Promise<Sale>; // Obtiene una venta por su ID
        getSaleItemsBySaleId: (saleId: number) => Promise<SaleItem[]>; // Obtiene los artículos de una venta por su ID
        addSale: (sale: Sale) => Promise<Sale>; // Añade una nueva venta
        updateSale: (sale: Sale) => Promise<Sale>; // Actualiza una venta existente
        deleteSale: (saleId: number) => Promise<void>; // Elimina una venta
        // ========================================================
        // Funciones detalladas de Ventas (Sales)
        // ========================================================
        getSaleDetailsBySaleId: (saleId: number) => Promise<SaleItem[]>; // Obtiene los detalles de una venta por su ID
        addSaleItem: (saleId: number, productId: number, quantity: number) => Promise<SaleItem>; // Añade un artículo a una venta
        updateSaleItem: (saleItemId: number, quantity: number) => Promise<SaleItem>; // Actualiza un artículo de una venta
        deleteSaleItem: (saleItemId: number) => Promise<void>; // Elimina un artículo de una venta

      };

      // Diálogos (ventanas emergentes)
      dialog: {
        showError: (message: string) => void; // Muestra un mensaje de error
        showSuccess: (message: string) => void; // Muestra un mensaje de éxito
      };

      // Sistema
      system: {
        getAppVersion: () => Promise<string>; // Obtiene la versión de la aplicación
        selectFile: () => Promise<string>; // Obtiene la ruta de un archivo
        selectSavePath: () => Promise<string>; // Obtiene la ruta de guardado
      };
    };
  }
}

// Esto es necesario para que TypeScript reconozca la declaración global
export {};
