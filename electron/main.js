import { app, BrowserWindow, ipcMain, dialog, Menu } from "electron";
import path from "path";
import isDev from "electron-is-dev";
import { initializeDatabase } from "./database.js";
import { registerIpcHandlers } from "./ipcHandlers.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { WebSocketServer } from "ws"; // Asegúrate de importar WebSocketServer si no lo tienes ya

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Variable para almacenar la ventana principal
let mainWindow = null;
let db = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, "../assets/icon.png"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.loadURL(
    isDev
      ? "http://localhost:5173"
      : `file://${path.join(__dirname, "../dist/index.html")}`
  );

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

async function initializeApp() {
  try {
    // Inicializar base de datos
    db = await initializeDatabase();
    console.log("Database connection established successfully");

    // Registrar manejadores IPC una vez que la base de datos está lista
    registerIpcHandlers(ipcMain, db);

    // Crear la ventana principal
    createWindow();
  } catch (error) {
    console.error("Failed to initialize application:", error);
    dialog.showErrorBox(
      "Error de Inicialización",
      `No se pudo inicializar la aplicación: ${error.message}`
    );
    app.quit();
  }
}

// Iniciar la aplicación cuando esté lista
app.whenReady().then(initializeApp);

// Crear una nueva ventana si no existe ninguna al activar la app (macOS)
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Salir cuando todas las ventanas están cerradas (excepto en macOS)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Asegurarse de cerrar correctamente la base de datos al salir
app.on("quit", () => {
  try {
    if (db) {
      db.close();
      console.log("Database connection closed properly");
    }
  } catch (error) {
    console.error("Error closing database:", error);
  }
});
