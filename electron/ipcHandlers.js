// ipcHandlers.js
import { dialog } from "electron";
import fs from "fs"; // Importar 'fs' como módulo

export function registerIpcHandlers(ipcMain, db) {
  // Preparar statements una sola vez para reutilización
  const statements = prepareStatements(db);

  // Manejador para importar datos (CSV o SQL)
  ipcMain.handle("import-data", async (_, filePath) => {
    try {
      const fileExtension = filePath.split(".").pop().toLowerCase();
      // Verificar la extensión del archivo
      if (fileExtension === "csv") {
        return importFromCSV(filePath, db);
      } else if (fileExtension === "sql") {
        return importFromSQL(filePath, db);
      } else {
        throw new Error("Tipo de archivo no soportado. Usa CSV o SQL.");
      }
    } catch (error) {
      console.error("Error importing data:", error);
      throw new Error(`Error al importar datos: ${error.message}`);
    }
  });

  // Abrir el diálogo para seleccionar un archivo
  ipcMain.handle("select-file", async (_) => {
    const result = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [
        { name: "Archivos SQL", extensions: ["sql"] },
        { name: "Archivos CSV", extensions: ["csv"] },
      ],
    });

    return result.filePaths[0]; // Devuelve la ruta del primer archivo seleccionado
  });

  // Función para importar datos desde un archivo CSV
  async function importFromCSV(filePath, db) {
    try {
      const products = [];

      const fileStream = fs.createReadStream(filePath);
      const parser = fileStream.pipe(csvParser());

      // Leer cada fila y almacenar en un arreglo de productos
      for await (const row of parser) {
        products.push({
          name: row.name.trim(),
          category_id: parseInt(row.category_id),
          group_id: parseInt(row.group_id),
          code: row.code.trim(),
          supplier_code: row.supplier_code.trim(),
          price: parseFloat(row.price),
          unit: row.unit.trim(),
          quick_access: row.quick_access === "1" ? 1 : 0, // Si está marcado como '1'
          keyboard_shortcut: row.keyboard_shortcut.trim(),
        });
      }

      // Insertar los productos en la base de datos
      const insertStatement = db.prepare(`
      INSERT INTO products (
        name, category_id, group_id, code, supplier_code, 
        price, unit, quick_access, keyboard_shortcut
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

      for (const product of products) {
        insertStatement.run(
          product.name,
          product.category_id,
          product.group_id,
          product.code,
          product.supplier_code,
          product.price,
          product.unit,
          product.quick_access,
          product.keyboard_shortcut
        );
      }

      return {
        success: true,
        message: `${products.length} productos importados correctamente desde CSV.`,
      };
    } catch (error) {
      console.error("Error importing products from CSV:", error);
      throw new Error(
        `Error al importar productos desde CSV: ${error.message}`
      );
    }
  }

  // Función para importar datos desde un archivo SQL
  function importFromSQL(filePath, db) {
    try {
      const sql = fs.readFileSync(filePath, "utf-8"); // Leer archivo SQL como texto
      db.exec(sql, (err) => {
        if (err) {
          throw new Error(`Error ejecutando el SQL: ${err.message}`);
        }
      });

      return {
        success: true,
        message: "Datos importados correctamente desde el archivo SQL.",
      };
    } catch (error) {
      console.error("Error importing data from SQL:", error);
      throw new Error(`Error al importar datos desde SQL: ${error.message}`);
    }
  }

  // Manejadores para categorías
  ipcMain.handle("get-categories", async () => {
    try {
      return statements.getAllCategories.all();
    } catch (error) {
      console.error("Error fetching categories:", error);
      throw new Error(`Error al obtener categorías: ${error.message}`);
    }
  });

  ipcMain.handle("add-category", async (_, name) => {
    try {
      validateString(name, "nombre de categoría");

      const result = statements.insertCategory.run(name.trim());
      return { id: result.lastInsertRowid, name: name.trim() };
    } catch (error) {
      handleDatabaseError(
        error,
        "añadir categoría",
        "UNIQUE constraint failed",
        "Ya existe una categoría con este nombre"
      );
    }
  });

  // Manejadores para grupos
  ipcMain.handle("get-groups", async () => {
    try {
      return statements.getAllGroups.all();
    } catch (error) {
      console.error("Error fetching groups:", error);
      throw new Error(`Error al obtener grupos: ${error.message}`);
    }
  });

  ipcMain.handle("add-group", async (_, name) => {
    try {
      validateString(name, "nombre de grupo");

      const result = statements.insertGroup.run(name.trim());
      return { id: result.lastInsertRowid, name: name.trim() };
    } catch (error) {
      handleDatabaseError(
        error,
        "añadir grupo",
        "UNIQUE constraint failed",
        "Ya existe un grupo con este nombre"
      );
    }
  });

  // Manejadores para códigos de barras
  ipcMain.handle("get-barcodes", async () => {
    try {
      return statements.getAllBarcodes.all();
    } catch (error) {
      console.error("Error fetching barcodes:", error);     
      throw new Error(`Error al obtener códigos de barras: ${error.message}`);
    }
  });

  ipcMain.handle("get-barcode-by-product-id", async (_, productId) => {
    try {
      validateId(productId, "producto");
      const result = statements.getBarcodeByProductId.all(productId);
      return result;
    } catch (error) {
      console.error("Error fetching barcodes by product ID:", error);
      throw new Error(
        `Error al obtener códigos de barras por ID de producto: ${error.message}`
      );
    }
  });

  ipcMain.handle("add-barcode", async (_, productId, barcode) => {
    try {
      validateId(productId, "producto");
      validateString(barcode, "código de barras");

      const result = statements.insertBarcode.run(productId, barcode.trim());
      return { id: result.lastInsertRowid, productId, barcode: barcode.trim() };
    } catch (error) {
      handleDatabaseError(
        error,
        "añadir código de barras",
        "UNIQUE constraint failed",
        "Ya existe un código de barras para este producto"
      );
    }
  });

  // Manejadores para productos
  ipcMain.handle("get-products", async () => {
    try {
      return statements.getAllProducts.all();
    } catch (error) {
      console.error("Error fetching products:", error);
      throw new Error(`Error al obtener productos: ${error.message}`);
    }
  });

  ipcMain.handle("get-quick-access-products", async () => {
    try {
      return statements.getQuickAccessProducts.all();
    } catch (error) {
      console.error("Error fetching quick access products:", error);
      throw new Error(
        `Error al obtener productos de acceso rápido: ${error.message}`
      );
    }
  });

  ipcMain.handle(
    "update-quick-access",
    async (_, productId, quickAccess, keyboard_shortcut) => {
      try {
        // Validar los parámetros
        validateId(productId, "producto");

        // Actualizar el producto en la base de datos utilizando la consulta definida
        const result = await statements.updateProductQuickAccess.run(
          quickAccess ? 1 : 0,
          keyboard_shortcut ?? "",
          productId
        );

        if (result.changes === 0) {
          throw new Error("No se pudo actualizar el producto");
        }

        // Retornar el producto actualizado
        return {
          id: productId,
          quick_access: quickAccess,
          keyboard_shortcut: keyboard_shortcut,
        };
      } catch (error) {
        console.error("Error al actualizar acceso rápido del producto:", error);
        throw new Error(`Error al actualizar acceso rápido: ${error.message}`);
      }
    }
  );

  ipcMain.handle("check-quick-access-key", async (_, key) => {
    try {
      const result = statements.checkQuickAccessKey.get(key); // Ejecuta la consulta
      return result.count > 0; // Si count es mayor que 0, significa que la tecla está en uso
    } catch (error) {
      console.error("Error al verificar tecla de acceso rápido:", error);
      throw new Error("Error al verificar tecla de acceso rápido");
    }
  });

  ipcMain.handle("add-product", async (_, product) => {
    try {
      validateProduct(product);

      console.log("Product:", product.keyboard_shortcut);

      const result = statements.insertProduct.run(
        product.name.trim(),
        product.category_id,
        product.group_id,
        product.supplier_code,
        product.price,
        product.unit,
        product.quick_access ? 1 : 0,
        product.keyboard_shortcut ?? ""
      );

      return {
        id: result.lastInsertRowid,
        ...product,
        name: product.name.trim(),
      };
    } catch (error) {
      console.error("Error adding product:", error);
      throw new Error(`Error al añadir producto: ${error.message}`);
    }
  });

  ipcMain.handle("update-product", async (_, product) => {
    try {
      validateProduct(product);
      validateId(product.id, "producto");

      const result = statements.updateProduct.run(
        product.name.trim(),
        product.category_id,
        product.group_id,
        product.supplier_code,
        product.price,
        product.unit,
        product.quick_access ? 1 : 0,
        product.keyboard_shortcut,
        product.id
      );

      if (result.changes === 0) {
        throw new Error("Producto no encontrado");
      }

      return {
        ...product,
        name: product.name.trim(),
      };
    } catch (error) {
      console.error("Error updating product:", error);
      throw new Error(`Error al actualizar producto: ${error.message}`);
    }
  });

  ipcMain.handle("search-products", async (_, query) => {
    try {
      validateString(query, "consulta de búsqueda");

      const searchPattern = `%${query.trim()}%`;
      return statements.searchProducts.all(
        searchPattern,
        searchPattern,
        searchPattern
      );
    } catch (error) {
      console.error("Error searching products:", error);
      throw new Error(`Error en la búsqueda de productos: ${error.message}`);
    }
  });

  ipcMain.handle("search-products-by-barcode", async (_, barcode) => {
    try {
      const searchPattern = `%${barcode}%`;
      return statements.searchProductsByBarcode.all(searchPattern);
    } catch (error) {
      console.error("Error searching products by barcode:", error);
      throw new Error(
        `Error en la búsqueda de productos por código de barras: ${error.message}`
      );
    }
  });

  ipcMain.handle(
    "search-products-by-supplier-code",
    async (_, supplierCode) => {
      try {
        validateString(supplierCode, "código de proveedor");
        const searchPattern = `%${supplierCode.trim()}%`;
        return statements.searchProductsBySupplierCode.all(searchPattern);
      } catch (error) {
        console.error("Error searching products by supplier code:", error);
        throw new Error(
          `Error en la búsqueda de productos por código de proveedor: ${error.message}`
        );
      }
    }
  );

  ipcMain.handle("delete-product", async (_, id) => {
    try {
      validateId(id, "producto");

      const result = statements.deleteProduct.run(id);

      if (result.changes === 0) {
        throw new Error("Producto no encontrado");
      }

      return { success: true, id };
    } catch (error) {
      console.error("Error deleting product:", error);
      throw new Error(`Error al eliminar producto: ${error.message}`);
    }
  });

  // Manejadores para diálogos
  ipcMain.on("show-error", (_, message) => {
    dialog.showErrorBox("Error", message);
  });

  ipcMain.on("show-success", (_, message) => {
    dialog.showMessageBox({
      type: "info",
      title: "Éxito",
      message,
    });
  });

  // Manejador para obtener versión de la aplicación
  ipcMain.handle("get-app-version", () => {
    return app.getVersion();
  });
}

// Funciones auxiliares para validación
function validateString(value, fieldName) {
  if (!value || typeof value !== "string" || value.trim() === "") {
    throw new Error(`${fieldName} es inválido`);
  }
  return true;
}

function validateNumber(value, fieldName) {
  if (isNaN(parseFloat(value)) || parseFloat(value) < 0) {
    throw new Error(`${fieldName} debe ser un número válido`);
  }
  return true;
}

function validateId(id, entityName) {
  if (!id || isNaN(parseInt(id))) {
    throw new Error(`ID de ${entityName} inválido`);
  }
  return true;
}

function validateProduct(product) {
  validateString(product.name, "nombre del producto");
  validateNumber(product.price, "precio");
  return true;
}

function handleDatabaseError(
  error,
  operation,
  uniqueConstraintMessage,
  userFriendlyMessage
) {
  console.error(`Error ${operation}:`, error);

  if (error.message.includes(uniqueConstraintMessage)) {
    throw new Error(userFriendlyMessage);
  }

  throw new Error(`Error al ${operation}: ${error.message}`);
}

// Función para preparar statements SQL
function prepareStatements(db) {
  return {
    // Categorías
    getAllCategories: db.prepare("SELECT * FROM categories ORDER BY name"),
    insertCategory: db.prepare("INSERT INTO categories (name) VALUES (?)"),

    // Grupos
    getAllGroups: db.prepare("SELECT * FROM groups ORDER BY name"),
    insertGroup: db.prepare("INSERT INTO groups (name) VALUES (?)"),

    // Códigos de barras
    getAllBarcodes: db.prepare(`
      SELECT b.*
      FROM barcodes b
      ORDER BY b.id
    `),
    getBarcodeByProductId: db.prepare(`
      SELECT b.*
      FROM barcodes b
      WHERE b.product_id = ?
      ORDER BY b.id
    `),
    insertBarcode: db.prepare(`
      INSERT INTO barcodes (product_id, barcode) 
      VALUES (?, ?)
    `),

    // Productos
    getAllProducts: db.prepare(`
      SELECT p.*, c.name as category_name, g.name as group_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN groups g ON p.group_id = g.id
      ORDER BY p.id
    `),
    getQuickAccessProducts: db.prepare(`
      SELECT p.*
      FROM products p
      WHERE p.quick_access = 1
      ORDER BY p.name
    `),
    updateProductQuickAccess: db.prepare(`
      UPDATE products 
      SET quick_access = ? , keyboard_shortcut = ?
      WHERE id = ?
    `),
    checkQuickAccessKey: db.prepare(`
      SELECT COUNT(*) as count
      FROM products
      WHERE keyboard_shortcut = ?
    `),
    insertProduct: db.prepare(`
      INSERT INTO products (
        name, category_id, group_id, supplier_code, 
        price, unit, quick_access, keyboard_shortcut
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `),
    updateProduct: db.prepare(`
      UPDATE products SET 
        name = ?, category_id = ?, group_id = ?,
        supplier_code = ?, price = ?, unit = ?, quick_access = ?, keyboard_shortcut = ?
      WHERE id = ?
    `),
    searchProducts: db.prepare(`
      SELECT p.*, c.name as category_name, g.name as group_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN groups g ON p.group_id = g.id
      WHERE p.name LIKE ? OR p.supplier_code LIKE ?
      ORDER BY p.id
    `),
    searchProductsByBarcode: db.prepare(`
      SELECT p.*, c.name as category_name, g.name as group_name
      FROM products p
      LEFT JOIN barcodes b ON p.id = b.product_id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN groups g ON p.group_id = g.id
      WHERE b.barcode = ?
    `),
    searchProductsBySupplierCode: db.prepare(`
      SELECT p.*, c.name as category_name, g.name as group_name
      FROM products p
      LEFT JOIN barcodes b ON p.id = b.product_id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN groups g ON p.group_id = g.id
      WHERE p.supplier_code LIKE ?
    `),
    deleteProduct: db.prepare("DELETE FROM products WHERE id = ?"),
  };
}
