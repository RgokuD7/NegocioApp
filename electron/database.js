import path from "path";
import { app } from "electron";
import sqlite3 from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ruta a la base de datos
//const dbPath = path.join(app.getPath("userData"), "database.sqlite");
// Ruta DINÁMICA para la base de datos
function getDbPath() {
  if (process.env.NODE_ENV === "test") {
    return path.join(__dirname, "../tests/test-database.sqlite"); // Ruta para pruebas
  }
  return path.join(app.getPath("userData"), "database.sqlite"); // Ruta producción
}
// Inicializar y preparar la base de datos
export async function initializeDatabase() {
  try {
    // Opciones para better-sqlite3
    const options = {
      verbose: console.log,
      fileMustExist: false,
    };

    const dbPath = getDbPath();

    // Inicializar conexión
    const db = new sqlite3(dbPath, options);

    // Habilitar integridad referencial
    db.pragma("foreign_keys = ON");

    // Crear tablas si no existen
    createTables(db);

    return db;
  } catch (error) {
    console.error("Database initialization error:", error);
    throw new Error(`Error al inicializar la base de datos: ${error.message}`);
  }
}

// Función para crear tablas
function createTables(db) {
  // Iniciar transacción
  const transaction = db.transaction(() => {
    // Tabla de categorías
    db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de grupos
    db.exec(`
      CREATE TABLE IF NOT EXISTS groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        price INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // Tabla de codigos de barras
    db.exec(`
      CREATE TABLE IF NOT EXISTS  barcodes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        barcode INTEGER NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    // Tabla de unidades
    db.exec(`
      CREATE TABLE IF NOT EXISTS units (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit TEXT NOT NULL UNIQUE,
        singular_unit TEXT NOT NULL UNIQUE,
        price_unit TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // Tabla de productos
    db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        category_id INTEGER,
        group_id INTEGER,
        price INTEGER NOT NULL DEFAULT 0,
        unit_id INTEGER,
        quick_access BOOLEAN,
        keyboard_shortcut TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL,
        FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL
      )
    `);

    // Tabla de provedores
    db.exec(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rut INTEGER,
        name TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de codigos de provedores
    db.exec(`
      CREATE TABLE IF NOT EXISTS suppliers_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        supplier_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        code INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    // Tabla de ventas

    db.exec(`
      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        total INTEGER NOT NULL,
        payment_method TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
      `);

    // Tabla de detalles de ventas
    db.exec(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      product_id INTEGER,
      quantity REAL NOT NULL,
      price INTEGER NOT NULL,
      subtotal INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE SET NULL
    )
    `);

    // Triggers para actualizar updated_at
    db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_products_timestamp
    AFTER UPDATE ON products
    BEGIN
    UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END
    `);

    db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_categories_timestamp
    AFTER UPDATE ON categories
    BEGIN
    UPDATE categories SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END
    `);

    db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_groups_timestamp
    AFTER UPDATE ON groups
    BEGIN
    UPDATE groups SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    UPDATE products SET price = NEW.price WHERE group_id = NEW.id;
    END
    `);

    db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_barcodes_timestamp
    AFTER UPDATE ON barcodes
    BEGIN
    UPDATE barcodes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END
    `);

    db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_suppliers_timestamp
    AFTER UPDATE ON suppliers
    BEGIN
    UPDATE suppliers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END
    `);

    db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_suppliers_codes_timestamp
    AFTER UPDATE ON suppliers_codes
    BEGIN
    UPDATE suppliers_codes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END
    `);

    db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_units_timestamp
    AFTER UPDATE ON units
    BEGIN
    UPDATE units SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END
    `);

    db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_sales_timestamp
    AFTER UPDATE ON sales
    BEGIN
    UPDATE sales SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END
    `);

    db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_sale_items_timestamp
    AFTER UPDATE ON sale_items
    BEGIN
    UPDATE sale_items SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END
    `);

    // Índices para la tabla de productos
    db.exec(`
  CREATE INDEX IF NOT EXISTS idx_products_name
  ON products (name);
`);

    db.exec(`
  CREATE INDEX IF NOT EXISTS idx_products_category_id
  ON products (category_id);
`);

    // Índices para la tabla de códigos de barras
    db.exec(`
  CREATE INDEX IF NOT EXISTS idx_barcodes_product_id
  ON barcodes (product_id);
`);

    db.exec(`
  CREATE INDEX IF NOT EXISTS idx_barcodes_barcode
  ON barcodes (barcode);
`);

    // Índices para la tabla de detalles de ventas
    db.exec(`
  CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id
  ON sale_items (sale_id);
`);

    db.exec(`
  CREATE INDEX IF NOT EXISTS idx_sale_items_product_id
  ON sale_items (product_id);
`);

    // Índice para la tabla de ventas por fecha
    db.exec(`
  CREATE INDEX IF NOT EXISTS idx_sales_date
  ON sales (date);
`);

    // Índices para la tabla de códigos de proveedores
    db.exec(`
  CREATE INDEX IF NOT EXISTS idx_suppliers_codes_supplier_id
  ON suppliers_codes (supplier_id);
`);

    db.exec(`
  CREATE INDEX IF NOT EXISTS idx_suppliers_codes_product_id
  ON suppliers_codes (product_id);
`);

    // Índice compuesto para sale_items (sale_id y product_id)
    db.exec(`
  CREATE INDEX IF NOT EXISTS idx_sale_items_sale_product
  ON sale_items (sale_id, product_id);
`);
  });

  // Ejecutar transacción
  transaction();
}
