import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  Database,
  DatabaseBackup,
  PackageSearch,
  Plus,
  Search,
  Settings,
  Wrench,
  X,
} from "lucide-react";
import AddProductModal from "./components/AddProductModal";
import QuickAccessModal from "./components/QuickAccessModal";
import SearchResultsModal from "./components/SearchResultsModal";
import DatabaseTab from "./components/DatabaseTab";
import { Product } from "./types";
import { formatCurrencyChile } from "./utils/utils";

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isQuickAccessVisible, setIsQuickAccessVisible] = useState(true); // Controla la visibilidad de los accesos rápidos
  const [selectedSection, setSelectedSection] = useState(""); // Estado para la sección seleccionada
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isDatabaseOpen, setIsDatabaseOpen] = useState(false);
  const [isQuickAccessOpen, setIsQuickAccessOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchResultsOpen, setIsSearchResultsOpen] = useState(false);
  const [quickAccessProducts, setQuickAccessProducts] = useState<Product[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [quickAccessProductsData, productsData] = await Promise.all([
        window.electron.database.getQuickAccessProducts(),
        window.electron.database.getProducts(),
      ]);
      setQuickAccessProducts(quickAccessProductsData);
      setProducts(productsData);
    } catch (error) {
      console.error("Error cargando datos:", error);
      window.electron.dialog.showError(
        "Error al cargar las categorías y grupos"
      );
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (filteredProducts.length == 1) {
        setIsSearchResultsOpen(false);
        handleSelectProduct(filteredProducts[0]);
      } else {
        setIsSearchResultsOpen(true);
      }
    }
  };

  // Lógica para cambiar la sección derecha basada en la opción seleccionada
  let content;
  switch (selectedSection) {
    case "products":
      content = (
        <AddProductModal
          isOpen={true}
          onClose={() => setIsAddProductOpen(false)}
          onProductAdded={loadData}
        />
      );
      break;
    case "bd":
      content = <DatabaseTab />;
      break;
    default:
      content = <p>Seleccione una opción.</p>;
      break;
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSelectProduct = (product: Product) => {
    if (!selectedProducts.some((p) => p.id === product.id)) {
      setSelectedProducts([...selectedProducts, product]);
    }
  };

  const handleRemoveProduct = (id: number) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== id));
  };

  return (
    <div className="flex min-h-screen select-none">
      {/* Left Section - 1/3 width */}
      <div className="w-1/3 bg-[#007566] p-6 flex flex-col">
        {/* Quick Access buttons */}
        {!isMenuOpen && isQuickAccessVisible && (
          <div className="grid grid-cols-2 gap-3 mt-4">
            <button
              onClick={() => setIsQuickAccessOpen(true)}
              className="bg-white/10 text-white p-3 rounded-lg hover:bg-white/20 transition-colors duration-200 flex flex-col items-center justify-center no-drag">
              <Settings size={24} className="mb-1" />
              <span className="font-medium">Configurar</span>
              <span className="text-sm opacity-80">Accesos Rápidos</span>
            </button>
            <button
              onClick={() => setIsQuickAccessOpen(true)}
              className="bg-white/10 text-white p-3 rounded-lg hover:bg-white/20 transition-colors duration-200 flex flex-col items-center justify-center no-drag">
              <Wrench size={24} className="mb-1" />
              <span className="font-medium">Configuración</span>
              <span className="text-sm opacity-80">General</span>
            </button>
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
        {isMenuOpen && !isQuickAccessVisible && (
          <div className="grid grid-cols-1 gap-3 mt-4">
            <button
              onClick={() => setSelectedSection("products")}
              className="bg-white/10 text-white p-3 rounded-lg hover:bg-white/20 transition-colors duration-200 flex flex-col items-center justify-center no-drag">
              <PackageSearch size={24} className="mb-1" />
              <span className="font-medium">Productos</span>
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
          onClick={() => {
            setIsMenuOpen(!isMenuOpen); // Cambia el estado de visibilidad del menú
            setIsQuickAccessVisible(!isQuickAccessVisible); // Oculta los accesos rápidos cuando se abre el menú
          }}
          className="mt-auto bg-white text-[#007566] hover:bg-gray-100 transition-colors duration-200 py-3 px-6 rounded-lg flex items-center justify-center gap-2 font-medium no-drag">
          {isMenuOpen ? (
            <ChevronUp size={20} /> // Flecha hacia arriba cuando el menú está abierto
          ) : (
            <ChevronDown size={20} /> // Flecha hacia abajo cuando el menú está cerrado
          )}
          {isMenuOpen ? "Cerrar Menú" : "Menú"}
        </button>

        {/* Add Product Button at the bottom */}
        {/*     <button
          onClick={() => setIsAddProductOpen(true)}
          className="mt-auto bg-white text-[#007566] hover:bg-gray-100 transition-colors duration-200 py-3 px-6 rounded-lg flex items-center justify-center gap-2 font-medium no-drag">
          <Plus size={20} />
          Agregar Productos
        </button> */}
      </div>

      {/* Right Section - 2/3 width */}

      {!isMenuOpen && isQuickAccessVisible && (
        <div className="w-2/3 bg-[#8FC1B5] p-6 flex flex-col">
          <div className="flex-1 overflow-auto">
            {selectedProducts.length > 0 ? (
              <div className="grid gap-4">
                {selectedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-lg">{product.name}</h3>
                        <p className="text-gray-600">
                          {formatCurrencyChile(product.price)}
                        </p>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <button
                          onClick={() => handleRemoveProduct(product.id)}
                          className="text-gray-400 hover:text-red-500">
                          <X size={20} />
                        </button>
                        <p>Código: {product.id}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center mt-4">
                No hay productos que coincidan con la búsqueda
              </p>
            )}
          </div>

          {/* Search bar at the bottom */}
          <form onSubmit={handleSearch} className="mt-4 relative">
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full px-4 py-3 rounded-lg pl-10 focus:outline-none focus:ring-2 focus:ring-[#007566]"
            />
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
          </form>
        </div>
      )}

      {isMenuOpen && !isQuickAccessVisible && (
        <div className="w-2/3 bg-[#8FC1B5] p-6 flex flex-col justify-center">{content}</div>
      )}

      {/* Modals */}

      <QuickAccessModal
        isOpen={isQuickAccessOpen}
        onClose={() => setIsQuickAccessOpen(false)}
        onQuickAccesAdded={loadData}
      />

      <SearchResultsModal
        isOpen={isSearchResultsOpen}
        onClose={() => {
          setIsSearchResultsOpen(false);
          setSearchQuery("");
        }}
        products={filteredProducts}
        onSelectProduct={handleSelectProduct}
      />
    </div>
  );
}

export default App;
