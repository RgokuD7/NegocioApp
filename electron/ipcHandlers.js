// ipcHandlers.js
import { dialog, app } from "electron";
import fs from "fs"; // Importar 'fs' como módulo
import { exec } from "child_process";
import path from "path";

export function registerIpcHandlers(ipcMain, db) {
  // Preparar statements una sola vez para reutilización
  const statements = prepareStatements(db);

  // Manejador para importar datos (CSV o SQL)
  ipcMain.handle("import-data", async (_, filePath) => {
    try {
      const fileExtension = filePath.split(".").pop().toLowerCase();
      // Verificar la extensión del archivo
      if (fileExtension === "sql") {
        return importFromSQL(filePath, db);
      } else {
        throw new Error("Tipo de archivo no soportado.");
      }
    } catch (error) {
      console.error("Error importing data:", error);
      throw new Error(`Error al importar datos: ${error.message}`);
    }
  });

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

  // Manejador para exportar datos
  ipcMain.handle("export-data", async (_, savePath) => {
    try {
      const dbPath = path.join(app.getPath("userData"), "database.sqlite");
      if (!savePath || !dbPath) {
        throw new Error("Ruta de guardado o base de datos no proporcionada.");
      }

      // Leer la base de datos como archivo binario
      const databaseBuffer = fs.readFileSync(dbPath);

      const sql_path = savePath + ".sql";
      const sqlite_path = savePath + ".sqlite";

      // Guardar ese contenido en la ruta seleccionada
      fs.writeFileSync(sqlite_path, databaseBuffer);

      exportToSQL(sql_path, dbPath);

      return { success: true, message: "Base de datos exportada con éxito." };
    } catch (error) {
      console.error("Error al exportar base de datos:", error);
      return { success: false, message: error.message };
    }
  });

  // Función para exportar la base de datos a un archivo SQL
  async function exportToSQL(outputPath, dbPath) {
    return new Promise((resolve, reject) => {
      const dumpCommand = `sqlite3 "${dbPath}" .dump > "${outputPath}"`;

      exec(dumpCommand, (error, stdout, stderr) => {
        if (error) {
          console.error("Error al exportar la base de datos:", error);
          reject(error);
        } else {
          console.log("Base de datos exportada correctamente.");
          resolve(true);
        }
      });
    });
  }

  // Abrir el diálogo para seleccionar un archivo
  ipcMain.handle("select-file", async (_) => {
    const result = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [
        { name: "Archivos SQL", extensions: ["sql"] } /* 
        { name: "Archivos CSV", extensions: ["csv"] }, */,
      ],
    });

    return result.filePaths[0]; // Devuelve la ruta del primer archivo seleccionado
  });

  // Seleccionar la ruta para guardar un archivo
  ipcMain.handle("select-save-path", async (_) => {
    const filters = {
      sql: { name: "Archivos SQL", extensions: ["sql"] } /* 
      excel: { name: "Archivos Excel", extensions: ["xlsx"] },
      csv: { name: "Archivos CSV", extensions: ["csv"] }, */,
    };

    const result = await dialog.showSaveDialog({
      title: "Guardar archivo",
      defaultPath: "respaldo",
      filters: filters.sql,
    });

    return result.filePath; // Devuelve la ruta seleccionada para guardar
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
          price: parseFloat(row.price),
          unit_id: row.unit.trim(),
          quick_access: row.quick_access === "1" ? 1 : 0, // Si está marcado como '1'
          keyboard_shortcut: row.keyboard_shortcut.trim(),
        });
      }

      // Insertar los productos en la base de datos
      const insertStatement = db.prepare(`
      INSERT INTO products (
        name, category_id, group_id, 
        price, unit_id, quick_access, keyboard_shortcut
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

      for (const product of products) {
        insertStatement.run(
          product.name,
          product.category_id,
          product.group_id,
          product.code,
          product.supplier_code,
          product.price,
          product.unit_id,
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

  ipcMain.handle("add-group", async (_, name, price) => {
    try {
      validateString(name, "nombre de grupo");

      const result = statements.insertGroup.run(name.trim(), price);
      return { id: result.lastInsertRowid, name: name.trim(), price };
    } catch (error) {
      handleDatabaseError(
        error,
        "añadir grupo",
        "UNIQUE constraint failed",
        "Ya existe un grupo con este nombre"
      );
    }
  });
  ipcMain.handle("update-group", async (_, id, name, price) => {
    try {
      validateId(id, "grupo");
      validateString(name, "nombre de grupo");
      validateNumber(price, "precio del grupo");
      statements.updateGroup.run(name.trim(), price, id);
      return { id, name: name.trim(), price };
    } catch (error) {
      handleDatabaseError(
        error,
        "actualizar grupo",
        "UNIQUE constraint failed",
        "Ya existe un grupo con este nombre"
      );
    }
  });
  ipcMain.handle("delete-group", async (_, id) => {
    try {
      validateId(id, "grupo");
      statements.deleteGroupById.run(id);
      return { success: true };
    } catch (error) {
      console.error("Error deleting group:", error);
      throw new Error(`Error al eliminar grupo: ${error.message}`);
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
      //validateId(productId, "producto");
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
      return {
        id: result.lastInsertRowid,
        productId,
        barcode: parseInt(barcode),
      };
    } catch (error) {
      handleDatabaseError(
        error,
        "añadir código de barras",
        "UNIQUE constraint failed",
        "Ya existe un código de barras para este producto"
      );
    }
  });
  ipcMain.handle("get-barcode-by-id", async (_, barcodeId) => {
    try {
      validateId(barcodeId, "código de barras");
      const result = statements.getBarcodeById.get(barcodeId);
      return result;
    } catch (error) {
      console.error("Error fetching barcode by ID:", error);
      throw new Error(
        `Error al obtener código de barras por ID: ${error.message}`
      );
    }
  });

  ipcMain.handle("update-barcode", async (_, id, productId, barcode) => {
    try {
      validateId(id, "código de barras");
      validateId(productId, "producto");
      validateString(barcode, "código de barras");

      statements.updateBarcode.run(productId, barcode.trim(), id);
      return { id, productId, barcode: barcode.trim() };
    } catch (error) {
      handleDatabaseError(
        error,
        "actualizar código de barras",
        "UNIQUE constraint failed",
        "Ya existe un código de barras con ese valor"
      );
    }
  });

  ipcMain.handle("delete-barcode", async (_, barcodeId) => {
    try {
      validateId(barcodeId, "código de barras");
      statements.deleteBarcodeById.run(barcodeId);
      return { success: true };
    } catch (error) {
      console.error("Error deleting barcode:", error);
      throw new Error(`Error al eliminar código de barras: ${error.message}`);
    }
  });

  // Manejadores para proveedores

  ipcMain.handle("get-suppliers", async () => {
    try {
      return statements.getAllSuppliers.all();
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      throw new Error(`Error al obtener proveedores: ${error.message}`);
    }
  });

  ipcMain.handle("get-supplier-by-id", async (_, supplierId) => {
    try {
      validateId(supplierId, "proveedor");
      return statements.getSupplierById.get(supplierId);
    } catch (error) {
      console.error("Error fetching supplier by ID:", error);
      throw new Error(`Error al obtener proveedor: ${error.message}`);
    }
  });

  ipcMain.handle("add-supplier", async (_, rut, name) => {
    try {
      validateString(name, "nombre del proveedor");
      const result = statements.insertSupplier.run(rut || null, name.trim());
      return { id: result.lastInsertRowid, name: name.trim(), rut };
    } catch (error) {
      handleDatabaseError(
        error,
        "añadir proveedor",
        "UNIQUE constraint failed: suppliers.name",
        "Ya existe un proveedor con ese nombre"
      );
    }
  });

  ipcMain.handle("update-supplier", async (_, id, rut, name) => {
    try {
      validateId(id, "proveedor");
      validateString(name, "nombre del proveedor");
      statements.updateSupplier.run(rut || null, name.trim(), id);
      return { id, rut, name: name.trim() };
    } catch (error) {
      handleDatabaseError(
        error,
        "actualizar proveedor",
        "UNIQUE constraint failed: suppliers.name",
        "Ya existe un proveedor con ese nombre"
      );
    }
  });

  ipcMain.handle("delete-supplier", async (_, supplierId) => {
    try {
      validateId(supplierId, "proveedor");
      statements.deleteSupplierById.run(supplierId);
      return { success: true };
    } catch (error) {
      console.error("Error deleting supplier:", error);
      throw new Error(`Error al eliminar proveedor: ${error.message}`);
    }
  });

  // Manejadores para códigos de proveedores

  ipcMain.handle("get-supplier-codes", async () => {
    try {
      return statements.getAllSupplierCodes.all();
    } catch (error) {
      console.error("Error fetching supplier codes:", error);
      throw new Error(
        `Error al obtener códigos de proveedores: ${error.message}`
      );
    }
  });

  ipcMain.handle("get-supplier-codes-by-product-id", async (_, productId) => {
    try {
      validateId(productId, "producto");
      return statements.getSupplierCodesByProductId.all(productId);
    } catch (error) {
      console.error("Error fetching supplier codes by product ID:", error);
      throw new Error(
        `Error al obtener códigos de proveedor por producto: ${error.message}`
      );
    }
  });

  ipcMain.handle("get-supplier-codes-by-supplier-id", async (_, supplierId) => {
    try {
      validateId(supplierId, "proveedor");
      return statements.getSupplierCodesBySupplierId.all(supplierId);
    } catch (error) {
      console.error("Error fetching supplier codes by supplier ID:", error);
      throw new Error(
        `Error al obtener códigos por proveedor: ${error.message}`
      );
    }
  });

  ipcMain.handle(
    "add-supplier-code",
    async (_, supplierId, productId, code) => {
      try {
        validateId(supplierId, "proveedor");
        validateId(productId, "producto");
        validateNumber(code, "código de proveedor");

        const result = statements.insertSupplierCode.run(
          supplierId,
          productId,
          code
        );
        return {
          id: result.lastInsertRowid,
          supplier_id: supplierId,
          product_id: productId,
          code,
        };
      } catch (error) {
        handleDatabaseError(
          error,
          "añadir código de proveedor",
          "UNIQUE constraint failed",
          "Ya existe un código para ese proveedor y producto"
        );
      }
    }
  );

  ipcMain.handle(
    "update-supplier-code",
    async (_, id, supplierId, productId, code) => {
      try {
        validateId(id, "código de proveedor");
        validateId(supplierId, "proveedor");
        validateId(productId, "producto");
        validateNumber(code, "código");

        statements.updateSupplierCode.run(supplierId, productId, code, id);
        return { id, supplierId, productId, code };
      } catch (error) {
        handleDatabaseError(
          error,
          "actualizar código de proveedor",
          "UNIQUE constraint failed",
          "Ya existe un código para ese proveedor y producto"
        );
      }
    }
  );

  ipcMain.handle("delete-supplier-code", async (_, id) => {
    try {
      validateId(id, "código de proveedor");
      statements.deleteSupplierCodeById.run(id);
      return { success: true };
    } catch (error) {
      console.error("Error deleting supplier code:", error);
      throw new Error(
        `Error al eliminar código de proveedor: ${error.message}`
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

      console.log("Product:", product);

      const result = statements.insertProduct.run(
        product.id,
        product.name.trim(),
        product.category_id,
        product.group_id,
        product.price,
        product.unit_id,
        product.quick_access ? 1 : 0,
        product.keyboard_shortcut ?? ""
      );

      return {
        id: result.lastInsertRowid,
        ...product,
        name: product.name.trim(),
      };
    } catch (error) {
      handleDatabaseError(
        error,
        "añadir producto",
        "UNIQUE constraint failed: products.name",
        "Ya existe un producto con este nombre"
      );
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
        product.price,
        product.unit_id,
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
      const searchPattern = barcode;
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
      //validateId(id, "producto");

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

  // Manejadores para unidades
  ipcMain.handle("get-units", async () => {
    try {
      return statements.getAllUnits.all();
    } catch (error) {
      console.error("Error fetching units:", error);
      throw new Error(`Error al obtener unidades: ${error.message}`);
    }
  });
  ipcMain.handle("add-unit", async (_, unit) => {
    try {
      validateString(unit.unit, "nombre de unidad");
      validateString(unit.singular_unit, "nombre singular de unidad");
      validateString(unit.price_unit, "nombre de unidad para precio");
      const result = statements.insertUnit.run(
        unit.unit,
        unit.singular_unit,
        unit.price_unit
      );
      return {
        id: result.lastInsertRowid,
        unit: unit.unit.trim(),
        singular_unit: unit.singular_unit.trim(),
        price_unit: unit.price_unit.trim(),
      };
    } catch (error) {
      handleDatabaseError(
        error,
        "añadir unidad",
        "UNIQUE constraint failed: units.unit",
        "Ya existe una unidad con este nombre"
      );
    }
  });
  ipcMain.handle("update-unit", async (_, unit) => {
    try {
      validateId(unit.id, "unidad");
      validateString(unit.unit, "nombre de unidad");
      validateString(unit.singular_unit, "nombre singular de unidad");
      validateString(unit.price_unit, "nombre de unidad para precio");
      const result = statements.updateUnit.run(
        unit.unit,
        unit.singular_unit,
        unit.price_unit,
        unit.id
      );
      if (result.changes === 0) {
        throw new Error("Unidad no encontrada");
      }
      return {
        id: unit.id,
        unit: unit.unit,
        singular_unit: unit.singular_unit,
        price_unit: unit.price_unit,
      };
    } catch (error) {
      console.error("Error updating unit:", error);
      throw new Error(`Error al actualizar unidad: ${error.message}`);
    }
  });
  ipcMain.handle("delete-unit", async (_, id) => {
    try {
      validateId(id, "unidad");
      statements.deleteUnit.run(id);
      return { success: true };
    } catch (error) {
      console.error("Error deleting unit:", error);
      throw new Error(`Error al eliminar unidad: ${error.message}`);
    }
  });

  // Manejadores para ventas
  ipcMain.handle("get-sales", async (_, startDate, endDate) => {
    try {
      // Validación de fechas
      const isValidDate = (dateStr) => !isNaN(new Date(dateStr).getTime());

      console.log(startDate, endDate);

      if (!isValidDate(startDate) || !isValidDate(endDate)) {
        throw new Error("Formato de fecha inválido");
      }

      // Validación adicional
      if (startDate > endDate) {
        throw new Error(
          "La fecha de inicio no puede ser mayor a la fecha final"
        );
      }

      console.log(
        "Consultando ventas entre (UTC ajustado por hora local):",
        startDate,
        "y",
        endDate
      );

      return await statements.getSalesByDateRange.all(startDate, endDate);
    } catch (error) {
      console.error("Error en get-sales:", error);
      throw new Error(`Error al obtener ventas: ${error.message}`);
    }
  });
  ipcMain.handle("add-sale", async (_, sale) => {
    try {
      validateNumber(sale.total, "total de venta");
      //validateString(sale.payment_method, "método de pago");
      const result = statements.insertSale.run(
        sale.total,
        sale.payment_method.trim()
      );
      return result.lastInsertRowid;
    } catch (error) {
      console.error("Error adding sale:", error);
      throw new Error(`Error al añadir venta: ${error.message}`);
    }
  });
  ipcMain.handle("update-sale", async (_, sale) => {
    try {
      validateId(sale.id, "venta");
      validateNumber(sale.total, "total de venta");
      validateString(sale.payment_method, "método de pago");
      const result = statements.updateSale.run(
        sale.total,
        sale.payment_method.trim(),
        sale.id
      );
      if (result.changes === 0) {
        throw new Error("Venta no encontrada");
      }
      return { id: sale.id, ...sale };
    } catch (error) {
      console.error("Error updating sale:", error);
      throw new Error(`Error al actualizar venta: ${error.message}`);
    }
  });
  ipcMain.handle("delete-sale", async (_, id) => {
    try {
      validateId(id, "venta");
      const result = statements.deleteSale.run(id);
      if (result.changes === 0) {
        throw new Error("Venta no encontrada");
      }
      return { success: true };
    } catch (error) {
      console.error("Error deleting sale:", error);
      throw new Error(`Error al eliminar venta: ${error.message}`);
    }
  });
  ipcMain.handle("get-sale-items-by-sale-id", async (_, saleId) => {
    try {
      validateId(saleId, "venta");
      return statements.getAllSaleItemasBySaleId.all(saleId);
    } catch (error) {
      console.error("Error fetching sale items by sale ID:", error);
      throw new Error(
        `Error al obtener artículos de venta por ID de venta: ${error.message}`
      );
    }
  });
  ipcMain.handle("add-sale-item", async (_, saleItem) => {
    try {
      validateId(saleItem.sale_id, "venta");
      //validateId(saleItem.product_id, "producto");
      validateNumber(saleItem.quantity, "cantidad");
      validateNumber(saleItem.price, "precio");
      validateNumber(saleItem.subtotal, "subtotal");
      const result = statements.insertSaleItem.run(
        saleItem.sale_id,
        saleItem.product_id,
        saleItem.quantity,
        saleItem.price,
        saleItem.subtotal
      );
      return { id: result.lastInsertRowid, ...saleItem };
    } catch (error) {
      console.error("Error adding sale item:", error);
      throw new Error(`Error al añadir artículo de venta: ${error.message}`);
    }
  });
  ipcMain.handle("update-sale-item", async (_, saleItem) => {
    try {
      validateId(saleItem.id, "artículo de venta");
      validateId(saleItem.sale_id, "venta");
      validateId(saleItem.product_id, "producto");
      validateNumber(saleItem.quantity, "cantidad");
      validateNumber(saleItem.price, "precio");
      validateNumber(saleItem.subtotal, "subtotal");
      const result = statements.updateSaleItem.run(
        saleItem.sale_id,
        saleItem.product_id,
        saleItem.quantity,
        saleItem.price,
        saleItem.subtotal,
        saleItem.id
      );
      if (result.changes === 0) {
        throw new Error("Artículo de venta no encontrado");
      }
      return { id: saleItem.id, ...saleItem };
    } catch (error) {
      console.error("Error updating sale item:", error);
      throw new Error(
        `Error al actualizar artículo de venta: ${error.message}`
      );
    }
  });
  ipcMain.handle("delete-sale-item", async (_, id) => {
    try {
      validateId(id, "artículo de venta");
      const result = statements.deleteSaleItem.run(id);
      if (result.changes === 0) {
        throw new Error("Artículo de venta no encontrado");
      }
      return { success: true };
    } catch (error) {
      console.error("Error deleting sale item:", error);
      throw new Error(`Error al eliminar artículo de venta: ${error.message}`);
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
    getAllCategories: db.prepare(`
      SELECT * 
      FROM categories 
      ORDER BY name
    `),
    insertCategory: db.prepare(`
      INSERT INTO categories (name)
      VALUES (?)
    `),
    updateCategory: db.prepare(`
      UPDATE categories
      SET name = ? 
      WHERE id = ?
      `),
    deleteCategoryById: db.prepare(`
      DELETE FROM categories
      WHERE id = ?
      `),

    // Grupos
    getAllGroups: db.prepare(`
      SELECT * 
      FROM groups 
      ORDER BY name
    `),
    insertGroup: db.prepare(`
      INSERT INTO groups (name, price) 
      VALUES (?, ?)
    `),
    updateGroup: db.prepare(`
      UPDATE groups 
      SET name = ? , price = ?
      WHERE id = ?
    `),
    deleteGroupById: db.prepare(`
      DELETE 
      FROM groups 
      WHERE id = ?
    `),

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

    getBarcodeById: db.prepare(`
      SELECT b.*
      FROM barcodes b
      WHERE b.id = ?
    `),

    deleteBarcodeById: db.prepare(`
      DELETE FROM barcodes
      WHERE id = ?
    `),

    updateBarcode: db.prepare(`
      UPDATE barcodes
      SET product_id = ?, barcode = ?
      WHERE id = ?
    `),

    // Tabla de proveedores
    getAllSuppliers: db.prepare(`
      SELECT *
      FROM suppliers
      ORDER BY name
    `),

    getSupplierById: db.prepare(`
      SELECT *
      FROM suppliers
      WHERE id = ?
    `),

    insertSupplier: db.prepare(`
      INSERT INTO suppliers (rut, name)
      VALUES (?, ?)
    `),

    updateSupplier: db.prepare(`
      UPDATE suppliers
      SET rut = ?, name = ?
      WHERE id = ?
    `),

    deleteSupplierById: db.prepare(`
      DELETE FROM suppliers
      WHERE id = ?
    `),

    // Códigos de proveedores
    getAllSupplierCodes: db.prepare(`
      SELECT sc.*
      FROM suppliers_codes sc
      ORDER BY sc.id
    `),

    getSupplierCodesByProductId: db.prepare(`
      SELECT sc.*
      FROM suppliers_codes sc
      WHERE sc.product_id = ?
      ORDER BY sc.id
    `),

    getSupplierCodesBySupplierId: db.prepare(`
      SELECT sc.*
      FROM suppliers_codes sc
      WHERE sc.supplier_id = ?
      ORDER BY sc.id
    `),

    insertSupplierCode: db.prepare(`
      INSERT INTO suppliers_codes (supplier_id, product_id, code)
      VALUES (?, ?, ?)
    `),

    deleteSupplierCodeById: db.prepare(`
      DELETE FROM suppliers_codes
      WHERE id = ?
    `),

    updateSupplierCode: db.prepare(`
      UPDATE suppliers_codes
      SET supplier_id = ?, product_id = ?, code = ?
      WHERE id = ?
    `),

    // Productos
    getAllProducts: db.prepare(`
      SELECT p.*, c.name as category_name, g.name as group_name, u.unit as unit
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN groups g ON p.group_id = g.id
      LEFT JOIN units u ON p.unit_id = u.id
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
      INSERT INTO products (id,
        name, category_id, group_id, 
        price, unit_id, quick_access, keyboard_shortcut
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `),
    updateProduct: db.prepare(`
      UPDATE products SET 
        name = ?, category_id = ?, group_id = ?,
        price = ?, unit_id = ?, quick_access = ?, keyboard_shortcut = ?
      WHERE id = ?
    `),
    searchProducts: db.prepare(`
      SELECT p.*, c.name as category_name, g.name as group_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN groups g ON p.group_id = g.id
      WHERE p.name LIKE ?
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
      LEFT JOIN suppliers_codes s ON p.id = s.product_id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN groups g ON p.group_id = g.id
      WHERE s.code LIKE ?
    `),
    deleteProduct: db.prepare("DELETE FROM products WHERE id = ?"),
    // Units
    getAllUnits: db.prepare(`
      SELECT *
      FROM units
      ORDER BY id
    `),
    insertUnit: db.prepare(`
      INSERT INTO units (unit, singular_unit, price_unit)
      VALUES (?, ?, ?)
    `),
    updateUnit: db.prepare(`
      UPDATE units
      SET unit = ?, singular_unit = ?, price_unit = ?
      WHERE id = ?
    `),
    deleteUnit: db.prepare(`
      DELETE FROM units
      WHERE id = ?
    `),
    // Ventas
    getAllSales: db.prepare(`
      SELECT *
      FROM sales
      ORDER BY id
    `),
    insertSale: db.prepare(`
      INSERT INTO sales (total, payment_method)
      VALUES (?, ?)
    `),
    updateSale: db.prepare(`
      UPDATE sales
      SET total = ?, payment_method = ?
      WHERE id = ?
    `),
    deleteSale: db.prepare(`
      DELETE FROM sales
      WHERE id = ?
    `),
    // Detalles de ventas
    getAllSaleItemasBySaleId: db.prepare(`
      SELECT *
      FROM sale_items
      WHERE sale_id = ?
      ORDER BY id
    `),
    insertSaleItem: db.prepare(`
      INSERT INTO sale_items (sale_id, product_id, quantity, price, subtotal)
      VALUES (?, ?, ?, ?, ?)
    `),
    updateSaleItem: db.prepare(`
      UPDATE sale_items
      SET sale_id = ?, product_id = ?, quantity = ?, price = ?
      WHERE id = ?
    `),
    deleteSaleItem: db.prepare(`
      DELETE FROM sale_items
      WHERE id = ?
    `),
    getSalesByDateRange: db.prepare(`
      SELECT 
        s.*,
        json_group_array(json_object(
          'id', si.id,
          'product_id', si.product_id,
          'quantity', si.quantity,
          'price', si.price,
          'subtotal', si.subtotal
        )) as items
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      WHERE datetime(s.created_at) BETWEEN datetime(?) AND datetime(?)
      GROUP BY s.id
      ORDER BY datetime(s.created_at) DESC
    `),

    getSalesByMonth: db.prepare(`
      SELECT 
        strftime('%Y-%m', created_at, 'localtime', '-4 hours') as month,
        COUNT(*) as total_sales,
        SUM(total) as total_amount
      FROM sales
      WHERE strftime('%Y', created_at, 'localtime', '-4 hours') = ?
      GROUP BY month
      ORDER BY month DESC
    `),
  };
}
