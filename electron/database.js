import path from 'path';
import { app } from 'electron';
import sqlite3 from 'better-sqlite3';

// Ruta a la base de datos
const dbPath = path.join(app.getPath('userData'), 'database.sqlite');

// Inicializar y preparar la base de datos
export async function initializeDatabase() {
  try {
    // Opciones para better-sqlite3
    const options = {
      verbose: console.log,
      fileMustExist: false
    };
    
    // Inicializar conexión
    const db = new sqlite3(dbPath, options);
    
    // Habilitar integridad referencial
    db.pragma('foreign_keys = ON');
    
    // Crear tablas si no existen
    createTables(db);
    
    return db;
  } catch (error) {
    console.error('Database initialization error:', error);
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Tabla de grupos
    db.exec(`
      CREATE TABLE IF NOT EXISTS groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

     // Tabla de codigos de barras
     db.exec(`
      CREATE TABLE IF NOT EXISTS barcodes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        barcode INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
      )
    `);
    
    // Tabla de productos
    db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category_id INTEGER,
        group_id INTEGER,
        supplier_code TEXT,
        price REAL NOT NULL DEFAULT 0,
        unit TEXT,
        quick_access BOOLEAN,
        keyboard_shortcut TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL
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
  });
  
  // Ejecutar transacción
  transaction();
}