const { contextBridge, ipcRenderer } = require("electron");

// Exponer APIs seguras a la interfaz de usuario
contextBridge.exposeInMainWorld("electron", {
  // Base de datos
  database: {
    // Importar datos desde SQL
    importData: (filePath) => ipcRenderer.invoke("import-data", filePath),
    // Exportar datos a SQL
    exportData: (savePath) => ipcRenderer.invoke("export-data", savePath),
    exportProductsJson: (savePath) => ipcRenderer.invoke("export-products-json", savePath),
    // Categorías
    getCategories: () => ipcRenderer.invoke("get-categories"), // Obtener todas las categorías
    addCategory: (name) => ipcRenderer.invoke("add-category", name), // Añadir una nueva categoría

    // Grupos
    getGroups: () => ipcRenderer.invoke("get-groups"), // Obtener todos los grupos
    addGroup: (name, price) => ipcRenderer.invoke("add-group", name, price), // Añadir un nuevo grupo
    updateGroup: (id, name, price) =>
      ipcRenderer.invoke("update-group", id, name, price), // Actualizar un grupo
    deleteGroup: (id) => ipcRenderer.invoke("delete-group", id), // Eliminar un grupo por ID

    // Codigos de barras
    getBarcodes: () => ipcRenderer.invoke("get-barcodes"), // Obtener todos los códigos de barras
    getBarcodeByProductId: (productId) =>
      ipcRenderer.invoke("get-barcode-by-product-id", productId), // Obtener un código de barras por ID de producto
    getBarcodeById: (barcodeId) =>
      ipcRenderer.invoke("get-barcode-by-id", barcodeId), // Obtener un código de barras por ID
    addBarcode: (productId, barcode) =>
      ipcRenderer.invoke("add-barcode", productId, barcode), // Añadir un código de barras para un producto
    updateBarcode: (id, productId, barcode) =>
      ipcRenderer.invoke("update-barcode", id, productId, barcode), // Actualizar un código de barras
    deleteBarcode: (id) => ipcRenderer.invoke("delete-barcode", id),
    // Manejadores para proveedores
    getSuppliers: () => ipcRenderer.invoke("get-suppliers"), // Obtener todos los proveedores
    getSupplierById: (supplierId) =>
      ipcRenderer.invoke("get-supplier-by-id", supplierId), // Obtener proveedor por ID
    addSupplier: (rut, name) => ipcRenderer.invoke("add-supplier", rut, name), // Añadir un nuevo proveedor
    updateSupplier: (id, rut, name) =>
      ipcRenderer.invoke("update-supplier", id, rut, name), // Actualizar proveedor
    deleteSupplier: (supplierId) =>
      ipcRenderer.invoke("delete-supplier", supplierId), // Eliminar proveedor

    // Manejadores para códigos de proveedores
    getSupplierCodes: () => ipcRenderer.invoke("get-supplier-codes"), // Obtener todos los códigos de proveedores
    getSupplierCodesByProductId: (productId) =>
      ipcRenderer.invoke("get-supplier-codes-by-product-id", productId), // Obtener códigos de proveedores por ID de producto
    getSupplierCodesBySupplierId: (supplierId) =>
      ipcRenderer.invoke("get-supplier-codes-by-supplier-id", supplierId), // Obtener códigos de proveedores por ID de proveedor
    addSupplierCode: (supplierId, productId, code) =>
      ipcRenderer.invoke("add-supplier-code", supplierId, productId, code), // Añadir un código de proveedor
    updateSupplierCode: (id, supplierId, productId, code) =>
      ipcRenderer.invoke(
        "update-supplier-code",
        id,
        supplierId,
        productId,
        code
      ), // Actualizar código de proveedor
    deleteSupplierCode: (id) => ipcRenderer.invoke("delete-supplier-code", id), // Eliminar código de proveedor

    // Productos
    getProducts: () => ipcRenderer.invoke("get-products"), // Obtener todos los productos
    getQuickAccessProducts: () =>
      ipcRenderer.invoke("get-quick-access-products"), // Obtener productos de acceso rápido
    updateQuickAccess: (productId, quickAccess, keyboard_shortcut) =>
      ipcRenderer.invoke(
        "update-quick-access",
        productId,
        quickAccess,
        keyboard_shortcut
      ), // Actualizar acceso rápido de producto
    checkQuickAccessKey: (key) =>
      ipcRenderer.invoke("check-quick-access-key", key), // Verificar si la tecla de acceso rápido ya está asignada
    addProduct: (product) => ipcRenderer.invoke("add-product", product), // Añadir un nuevo producto
    updateProduct: (product) => ipcRenderer.invoke("update-product", product), // Actualizar un producto
    searchProducts: (query) => ipcRenderer.invoke("search-products", query), // Buscar productos por una consulta
    searchProductsByBarcode: (barcode) =>
      ipcRenderer.invoke("search-products-by-barcode", barcode), // Buscar productos por código de barras
    searchProductBySupplierCode: (supplierCode) =>
      ipcRenderer.invoke("search-product-by-supplier-code", supplierCode), // Buscar productos por código de proveedor
    deleteProduct: (id) => ipcRenderer.invoke("delete-product", id), // Eliminar un producto por ID
    // Unidades
    getUnits: () => ipcRenderer.invoke("get-units"), // Obtener todas las unidades
    addUnit: (unit) => ipcRenderer.invoke("add-unit", unit), // Añadir una nueva unidad
    updateUnit: (unit) => ipcRenderer.invoke("update-unit", unit), // Actualizar una unidad
    deleteUnit: (id) => ipcRenderer.invoke("delete-unit", id), // Eliminar una unidad por ID
    // Ventas
    getSales: (startDate, endDate) =>
      ipcRenderer.invoke("get-sales", startDate, endDate), // Obtener todas las ventas
    addSale: (sale) => ipcRenderer.invoke("add-sale", sale), // Añadir una nueva venta
    updateSale: (sale) => ipcRenderer.invoke("update-sale", sale), // Actualizar una venta
    deleteSale: (id) => ipcRenderer.invoke("delete-sale", id), // Eliminar una venta por ID
    // Detalles de ventas
    getSaleItemsBySaleId: (saleId) =>
      ipcRenderer.invoke("get-sale-items", saleId), // Obtener detalles de una venta por ID de venta
    addSaleItem: (saleItem) => ipcRenderer.invoke("add-sale-item", saleItem), // Añadir un nuevo detalle de venta
    updateSaleItem: (saleItem) =>
      ipcRenderer.invoke("update-sale-item", saleItem), // Actualizar un detalle de venta
    deleteSaleItem: (id) => ipcRenderer.invoke("delete-sale-item", id), // Eliminar un detalle de venta por ID
  },

  // Dialogos (ventanas emergentes)
  dialog: {
    showError: (message) => ipcRenderer.send("show-error", message), // Mostrar mensaje de error
    showSuccess: (message) => ipcRenderer.send("show-success", message), // Mostrar mensaje de éxito
  },

  // Sistema (funciones relacionadas con el sistema y la aplicación)
  system: {
    getAppVersion: () => ipcRenderer.invoke("get-app-version"), // Obtener la versión de la aplicación
    selectFile: () => ipcRenderer.invoke("select-file"), // Abrir un cuadro de diálogo para seleccionar un archivo
    selectSavePath: () => ipcRenderer.invoke("select-save-path"), // Abrir un cuadro de diálogo para guardar un archivo
  },
});
