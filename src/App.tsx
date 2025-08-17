import { useState, useEffect } from "react";
import {
  BanknoteArrowDown,
  ChevronDown,
  Database,
  PackageSearch,
  ChartNoAxesCombined,
} from "lucide-react";
import AddProductModal from "./components/AddProductModal";
import QuickAccessModal from "./components/QuickAccessModal";
import DatabaseTab from "./components/DatabaseTab";
import { Product } from "./types";
import SalesCart from "./components/SalesCart";
import DailySalesTab from "./components/DailySalesTab";
import SalesStatsTab from "./components/SalesStatsTab";
import { DateRangeProvider } from "./context/DateRangeContext";
import { AnimatePresence, motion } from "framer-motion";
import { formatCurrencyChile } from "./utils/utils";
import useGlobalKeyPress from "./hooks/useGlobalKeyPress";
import { set } from "date-fns";

const useKeyboardShortcuts = (
  quickAccessProducts: any[],
  onShortcutPress: (productId: string) => void
) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignorar si el usuario está escribiendo en un input
      /* if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      } */

      // Buscar producto que coincida con la tecla presionada
      const productWithShortcut = quickAccessProducts.find(
        (product) =>
          product.keyboard_shortcut &&
          product.keyboard_shortcut.toLowerCase() === event.key.toLowerCase()
      );

      if (productWithShortcut) {
        event.preventDefault(); // Evitar comportamiento por defecto
        console.log(
          `Atajo presionado: ${event.key} para producto ${productWithShortcut.name}`
        );
        onShortcutPress(productWithShortcut.id.toString());
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [quickAccessProducts, onShortcutPress]);
};

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [shortcutPress, setShortcutPress] = useState("");
  const [selectedSection, setSelectedSection] = useState("products"); // Estado para la sección seleccionada
  //const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isQuickAccessOpen, setIsQuickAccessOpen] = useState(false);
  const [quickAccessProducts, setQuickAccessProducts] = useState<Product[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const quickAccessProductsData =
        await window.electron.database.getQuickAccessProducts();
      setQuickAccessProducts(quickAccessProductsData);
    } catch (error) {
      console.error("Error cargando datos:", error);
      window.electron.dialog.showError(
        "Error al cargar las categorías y grupos"
      );
    }
  };

  /*   useGlobalKeyPress("Escape", () => {
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
  });
   */
  useKeyboardShortcuts(quickAccessProducts, setShortcutPress);

  // Lógica para cambiar la sección derecha basada en la opción seleccionada
  let content;
  switch (selectedSection) {
    case "products":
      content = <AddProductModal isOpen={true} onProductAdded={loadData} />;
      break;
    case "sales":
      content = <DailySalesTab />;
      break;
    case "stats":
      content = <SalesStatsTab />;
      break;
    case "bd":
      content = <DatabaseTab />;
      break;
    default:
      content = (
        <div className="w-2/3 bg-[#8FC1B5] p-6 flex flex-col justify-between">
          <p>Seleccione una opción.</p>
        </div>
      );
      break;
  }

  return (
    <DateRangeProvider>
      <div className="flex min-h-screen max-h-screen select-none">
        {/* Left Section - 1/3 width */}
        <div className="w-1/3 bg-[#007566] p-6 flex flex-col">
          {/* Quick Access buttons */}
          {!isMenuOpen && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }} // Afecta todas las animaciones
                className="grid grid-cols-3 gap-2 mt-4">
                {quickAccessProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() =>
                      setShortcutPress("_" + product.id.toString())
                    }
                    className="bg-white/10 text-white p-3 rounded-lg hover:bg-white/20 transition-colors duration-200 flex flex-col items-center justify-center no-drag">
                    <span className="font-medium">{product.name}</span>
                    <span className="text-sm opacity-70">{product.id}</span>
                    <span className="text-sm opacity-40">
                      {formatCurrencyChile(product.price)}
                    </span>
                    {product.keyboard_shortcut != "" ? (
                      <span className="text-sm opacity-80">
                        {product.keyboard_shortcut}
                      </span>
                    ) : (
                      <></>
                    )}
                  </button>
                ))}
              </motion.div>
            </AnimatePresence>
          )}

          {/* Menú desplegable con opciones */}
          {isMenuOpen && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }} // Afecta todas las animaciones
                className="grid grid-cols-1 gap-3 mt-4">
                <button
                  id="products"
                  onClick={() => setSelectedSection("products")}
                  className="bg-white/10 text-white p-3 rounded-lg hover:bg-white/20 transition-colors duration-200 flex flex-col items-center justify-center no-drag">
                  <PackageSearch size={24} className="mb-1" />
                  <span className="font-medium">Productos</span>
                </button>
                <button
                  id="sales"
                  onClick={() => setSelectedSection("sales")}
                  className="bg-white/10 text-white p-3 rounded-lg hover:bg-white/20 transition-colors duration-200 flex flex-col items-center justify-center no-drag">
                  <BanknoteArrowDown size={24} className="mb-1" />
                  <span className="font-medium">Ventas</span>
                </button>
                <button
                  id="stats"
                  onClick={() => setSelectedSection("stats")}
                  className="bg-white/10 text-white p-3 rounded-lg hover:bg-white/20 transition-colors duration-200 flex flex-col items-center justify-center no-drag">
                  <ChartNoAxesCombined size={24} className="mb-1" />
                  <span className="font-medium">Estadisticas</span>
                </button>
                <button
                  onClick={() => setSelectedSection("bd")}
                  className="bg-white/10 text-white p-3 rounded-lg hover:bg-white/20 transition-colors duration-200 flex flex-col items-center justify-center no-drag">
                  <Database size={24} className="mb-1" />
                  <span className="font-medium">Base de datos</span>
                </button>
                {/* Aquí puedes agregar más botones según las opciones que quieras */}
              </motion.div>
            </AnimatePresence>
          )}

          <button
            id="menu"
            onClick={() => {
              setIsMenuOpen(!isMenuOpen); // Cambia el estado de visibilidad del menú
            }}
            className="mt-auto bg-white text-[#007566] hover:bg-gray-100 transition-colors duration-200 py-3 px-6 rounded-lg flex items-center justify-center gap-2 font-medium no-drag">
            {isMenuOpen ? "Cerrar Menú" : "Menú"}
            <ChevronDown
              className={`transform transition-transform ${
                isMenuOpen ? "rotate-180" : ""
              }`}
              size={20}
            />
          </button>
        </div>

        {/* Right Section - 2/3 width */}

        <SalesCart
          isOpen={!isMenuOpen}
          onOpenAddProducts={() => {
            setIsMenuOpen(true);
            setSelectedSection("products");
          }}
          onShortcutAdded={() => setShortcutPress("")}
          shorcutData={shortcutPress}
        />

        {isMenuOpen && content}

        {/* Modals */}

        <QuickAccessModal
          isOpen={isQuickAccessOpen}
          onClose={() => setIsQuickAccessOpen(false)}
          onQuickAccesAdded={loadData}
        />
        {/* 
      <SearchResultsModal
        isOpen={isSearchResultsOpen}
        onClose={() => {
          setIsSearchResultsOpen(false);
          setSearchQuery("");
        }}
        products={filteredProducts}
        onSelectProduct={handleSelectProduct}
      /> */}
      </div>
    </DateRangeProvider>
  );
}

export default App;
