const { contextBridge, ipcRenderer } = require("electron");

// Exponer APIs seguras a la interfaz de usuario
contextBridge.exposeInMainWorld("electron", {
  // Base de datos
  database: {
    importData: (filePath) => ipcRenderer.invoke("import-data", filePath),
    getCategories: () => ipcRenderer.invoke("get-categories"),
    addCategory: (name) => ipcRenderer.invoke("add-category", name),
    getGroups: () => ipcRenderer.invoke("get-groups"),
    addGroup: (name) => ipcRenderer.invoke("add-group", name),
    getBarcodes: () => ipcRenderer.invoke("get-barcodes"),
    getBarcodeByProductId: (productId) =>
      ipcRenderer.invoke("get-barcode-by-product-id", productId),
    addBarcode: (productId, barcode) => ("add-barcode", productId, barcode),
    getProducts: () => ipcRenderer.invoke("get-products"),
    getQuickAccessProducts: () =>
      ipcRenderer.invoke("get-quick-access-products"),
    updateQuickAccess: (productId, quickAccess, keyboard_shortcut) =>
      ipcRenderer.invoke(
        "update-quick-access",
        productId,
        quickAccess,
        keyboard_shortcut
      ),
    checkQuickAccessKey: (key) =>
      ipcRenderer.invoke("check-quick-access-key", key),
    addProduct: (product) => ipcRenderer.invoke("add-product", product),
    updateProduct: (product) => ipcRenderer.invoke("update-product", product),
    searchProducts: (query) => ipcRenderer.invoke("search-products", query),
    searchProductsByBarcode: (barcode) =>
      ipcRenderer.invoke("search-products-by-barcode", barcode),
    searchProductBySupplierCode: (supplierCode) =>
      ipcRenderer.invoke("search-product-by-supplier-code", supplierCode),
    deleteProduct: (id) => ipcRenderer.invoke("delete-product", id),
  },

  // Dialogs
  dialog: {
    showError: (message) => ipcRenderer.send("show-error", message),
    showSuccess: (message) => ipcRenderer.send("show-success", message),
  },

  // Sistema
  system: {
    getAppVersion: () => ipcRenderer.invoke("get-app-version"),
    selectFile: () => ipcRenderer.invoke("select-file"),
  },
});
