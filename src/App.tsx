import { useState, useEffect } from "react";
import {
  Barcode,
  ChevronDown,
  ChevronUp,
  Database,
  PackageSearch,
  Settings,
  Wrench,
} from "lucide-react";
import AddProductModal from "./components/AddProductModal";
import QuickAccessModal from "./components/QuickAccessModal";
import DatabaseTab from "./components/DatabaseTab";
import { Product } from "./types";
import { formatCurrencyChile } from "./utils/utils";
import SalesCart from "./components/SalesCart";
import Barcodes from "./components/Barcodes";

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState(""); // Estado para la sección seleccionada
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
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

  // Lógica para cambiar la sección derecha basada en la opción seleccionada
  let content;
  switch (selectedSection) {
    case "products":
      content = <AddProductModal isOpen={true} onProductAdded={loadData} />;
      break;
    case "barcodes":
      content = <Barcodes isOpen={true} />;
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
    <div className="flex min-h-screen max-h-screen select-none">
      {/* Left Section - 1/3 width */}
      <div className="w-1/3 bg-[#007566] p-6 flex flex-col">
        {/* Quick Access buttons */}
        {!isMenuOpen && (
          <div className="grid grid-cols-2 gap-3 mt-4">
            {quickAccessProducts.map((product) => (
              <button
                key={product.id}
                className="bg-white/10 text-white p-3 rounded-lg hover:bg-white/20 transition-colors duration-200 flex flex-col items-center justify-center no-drag">
                <span className="font-medium">{product.name}</span>
                <span className="text-sm opacity-80">
                  {formatCurrencyChile(product.price)}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Menú desplegable con opciones */}
        {isMenuOpen && (
          <div className="grid grid-cols-1 gap-3 mt-4">
            <button
              id="products"
              onClick={() => setSelectedSection("products")}
              className="bg-white/10 text-white p-3 rounded-lg hover:bg-white/20 transition-colors duration-200 flex flex-col items-center justify-center no-drag">
              <PackageSearch size={24} className="mb-1" />
              <span className="font-medium">Productos</span>
            </button>
            <button
              onClick={() => setSelectedSection("barcodes")}
              className="bg-white/10 text-white p-3 rounded-lg hover:bg-white/20 transition-colors duration-200 flex flex-col items-center justify-center no-drag">
              <Barcode size={24} className="mb-1" />
              <span className="font-medium">Códigos De Barra</span>
            </button>
            <button
              onClick={() => setSelectedSection("bd")}
              className="bg-white/10 text-white p-3 rounded-lg hover:bg-white/20 transition-colors duration-200 flex flex-col items-center justify-center no-drag">
              <Database size={24} className="mb-1" />
              <span className="font-medium">Base de datos</span>
            </button>
            {/* Aquí puedes agregar más botones según las opciones que quieras */}
          </div>
        )}

        <button
          id="menu"
          onClick={() => {
            setIsMenuOpen(!isMenuOpen); // Cambia el estado de visibilidad del menú
          }}
          className="mt-auto bg-white text-[#007566] hover:bg-gray-100 transition-colors duration-200 py-3 px-6 rounded-lg flex items-center justify-center gap-2 font-medium no-drag">
          {isMenuOpen ? (
            <ChevronUp size={20} /> // Flecha hacia arriba cuando el menú está abierto
          ) : (
            <ChevronDown size={20} /> // Flecha hacia abajo cuando el menú está cerrado
          )}
          {isMenuOpen ? "Cerrar Menú" : "Menú"}
        </button>
      </div>

      {/* Right Section - 2/3 width */}

      {!isMenuOpen && (
        <SalesCart
          onOpenAddProducts={() => {
            setIsMenuOpen(true);
            setSelectedSection("products");
          }}
        />
      )}

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
  );
}

export default App;
