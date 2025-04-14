import { useEffect, useState } from "react";
import { Download, Search, Trash, Upload } from "lucide-react";
import ProductNotFoundModal from "./ProductNotFoundModal";
import { Barcode, Product } from "../types";

interface Barcodes {
  isOpen: boolean;
  onOpenAddProducts?: () => void;
}

const Barcodes: React.FC<Barcodes> = ({ isOpen, onOpenAddProducts }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isProductNotFoundModalOpen, setIsProductNotFoundModalOpen] =
    useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [barcodes, setBarcodes] = useState<Barcode[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  useEffect(() => {
    loadData();
  }, [isOpen]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [productsData, barcodesData] = await Promise.all([
        window.electron.database.getProducts(),
        window.electron.database.getBarcodes(),
      ]);
      setProducts(productsData);
      setBarcodes(barcodesData);
      setFilteredProducts(productsData);
    } catch (error) {
      console.error("Error cargando datos:", error);
      window.electron.dialog.showError(
        "Error al cargar las categorías y grupos"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const foundProductBarcodes = (id: number) =>
    barcodes.filter((b) => b.product_id == id);

  const deleteBarcode = async (id: number) => {
    const deleteResult = await window.electron.database.deleteBarcode(id);

    if (deleteResult.success) {
      setBarcodes((prev) => prev.filter((pb) => pb.id !== id));
    } else {
      window.electron.dialog.showError(
        "No se pudo eliminar el código de barras."
      );
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery) {
      // Buscar coincidencia con codigos de barra
      const matchedBarcode = barcodes.find(
        (b) => b.barcode === parseInt(searchQuery)
      );
      const matchedId = products.find((p) => p.id === parseInt(searchQuery));
      //const isOnlyNumbers = (str: string) => /^\d+$/.test(str);
      if (matchedBarcode) {
        const foundProduct = products.find(
          (p) => p.id === matchedBarcode.product_id
        );
        if (foundProduct) {
          setFilteredProducts([foundProduct]);
        }
      } else if (matchedId) {
        setFilteredProducts([matchedId]);
      } else {
        const foundPrducts = products.filter((p) =>
          p.name.toLowerCase().includes(searchQuery)
        );
        setFilteredProducts(foundPrducts);
        if (foundPrducts.length == 0) {
          return;
        }
      }
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    const foundPrducts = products.filter((p) =>
      p.name.toLowerCase().includes(searchQuery)
    );
    setFilteredProducts(foundPrducts);
    if (query == "") setFilteredProducts(products);
    else if (foundPrducts.length == 0) {
      return;
    }
  };
  return (
    <div className="w-2/3 bg-[#8FC1B5] p-6 flex flex-col justify-between">
      <div className="flex-1 overflow-y-auto">
        {filteredProducts.length > 0 ? (
          <div className="grid gap-4">
            {filteredProducts.map((fp) => (
              <div
                key={fp.id}
                className="bg-white grid rounded-lg p-4 shadow-sm">
                <div className="flex justify-between">
                  <h3 className="font-medium text-lg">{fp.name}</h3>
                  <h3 className="text-[#007566] font-medium text-lg">
                    CÓDIGO: {fp.id}
                  </h3>
                </div>
                <div className="grid">
                  {/*                   <h3 className="font-medium text-lg text-gray-500">
                    Códigos de barra
                  </h3> */}
                  {foundProductBarcodes(fp.id).map((b) => (
                    <div
                      className="flex justify-between gap-5 hover:bg-[#8fc1b558] rounded-lg p-1"
                      key={b.id}>
                      <h3 className="font-medium text-lg text-gray-500">
                        {b.barcode}
                      </h3>
                      <button
                        className="text-gray-400 hover:text-red-500"
                        onClick={() => deleteBarcode(b.id)}>
                        <Trash />
                      </button>
                    </div>
                  ))}
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
      <div>
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

      <ProductNotFoundModal
        isOpen={isProductNotFoundModalOpen}
        onClose={() => setIsProductNotFoundModalOpen(false)}
        searchQuery={searchQuery}
        onConfirm={() => {
          setIsProductNotFoundModalOpen(false);
          if (onOpenAddProducts) {
            onOpenAddProducts();
          }
        }}
      />
    </div>
  );
};

export default Barcodes;
