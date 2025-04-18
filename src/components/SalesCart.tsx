import React, { useState, useEffect, useRef } from "react";
import { Minus, Plus, Search, Trash } from "lucide-react";
import SearchResultsModal from "./SearchResultsModal";
import { Product, Unit, Barcode } from "../types";
import { formatCurrencyChile } from "../utils/utils";
import ProductNotFoundModal from "./ProductNotFoundModal";

interface SalesCartProps {
  onOpenAddProducts?: () => void;
  onShortcutAdded: () => void;
  shorcutData: string;
}
const SalesCart: React.FC<SalesCartProps> = ({
  onOpenAddProducts,
  onShortcutAdded,
  shorcutData,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [processedQuery, setProcessedQuery] = useState("");
  const [isSearchResultsOpen, setIsSearchResultsOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [barcodes, setBarcodes] = useState<Barcode[]>([]);
  const [quantityInput, setQuantityInput] = useState<number>(1);
  const [totalSale, setTotalSale] = useState<number>(0);
  const [isProductNotFoundModalOpen, setIsProductNotFoundModalOpen] =
    useState(false);
  const [selectedProducts, setSelectedProducts] = useState<
    { product: Product; quantity: number }[]
  >([]);

  const inputRef = useRef<HTMLInputElement>(null);

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Verificación exhaustiva de null
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    console.log(shorcutData);
    if (typeof shorcutData === "string" && shorcutData.trim() !== "") {
      setSearchQuery((prev) => `${prev}${shorcutData}`);
      if (onShortcutAdded) onShortcutAdded();
      setTimeout(() => {
        const form = document.querySelector("form") as HTMLFormElement;
        if (form) {
          const submitEvent = new Event("submit", {
            bubbles: true,
            cancelable: true,
          });
          form.dispatchEvent(submitEvent);
        }
      }, 50);
    }
  }, [shorcutData]);

  useEffect(() => {
    if (searchQuery) {
      const trimmedQuery = searchQuery.toLowerCase().trim();
      const match = trimmedQuery.match(/^(\d+(?:[.,]\d+)?)\s*[*]\s*(.+)/);

      if (match) {
        const quantity = parseFloat(match[1].replace(",", "."));
        const productName = match[2];

        setQuantityInput(quantity);
        setProcessedQuery(productName); // este es un nuevo estado limpio sin el "3x"
      } else {
        setQuantityInput(1);
        setProcessedQuery(trimmedQuery); // usamos el query tal cual si no hay x
      }
    }

    if (inputRef.current) inputRef.current.focus();
  }, [searchQuery]);

  useEffect(() => {
    const total = selectedProducts.reduce(
      (sum, sl) => sum + sl.product.price * sl.quantity,
      0
    );
    setTotalSale(total);
    if (inputRef.current) inputRef.current.focus();
  }, [selectedProducts]);

  const loadData = async () => {
    try {
      const [productsData, barcodesData, unitsData] = await Promise.all([
        window.electron.database.getProducts(),
        window.electron.database.getBarcodes(),
        window.electron.database.getUnits(),
      ]);
      setProducts(productsData);
      setBarcodes(barcodesData);
      setUnits(unitsData);
    } catch (error) {
      console.error("Error cargando datos:", error);
      window.electron.dialog.showError(
        "Error al cargar las categorías y grupos"
      );
    }

    if (inputRef.current) inputRef.current.focus();
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(processedQuery)
  );
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (processedQuery) {
      // Buscar coincidencia con codigos de barra
      const matchedBarcode = barcodes.find(
        (b) => b.barcode === parseInt(processedQuery)
      );
      const matchedId = products.find((p) => p.id === parseInt(processedQuery));
      //const isOnlyNumbers = (str: string) => /^\d+$/.test(str);
      if (matchedBarcode) {
        const foundProduct = products.find(
          (p) => p.id === matchedBarcode.product_id
        );
        if (foundProduct) {
          handleSelectProduct(foundProduct);
          setIsSearchResultsOpen(false);
        }
      } else if (matchedId) {
        handleSelectProduct(matchedId);
        setIsSearchResultsOpen(false);
      } else if (filteredProducts.length == 1) {
        handleSelectProduct(filteredProducts[0]);
      } else if (filteredProducts.length == 0) {
        setIsProductNotFoundModalOpen(true);
        return;
      } else {
        setIsSearchResultsOpen(true);
      }
      setSearchQuery("");
      setQuantityInput(1);
      if (onShortcutAdded) onShortcutAdded();
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (e.target.value == "") setIsSearchResultsOpen(false);
    else setIsSearchResultsOpen(true);
  };

  const handleSelectProduct = (product: Product) => {
    const existingProduct = selectedProducts.find(
      (sp) => sp.product.id === product.id
    );
    console.log(quantityInput);

    if (!existingProduct) {
      // Si no está en la lista, lo agregamos con cantidad 1
      setSelectedProducts([
        ...selectedProducts,
        { product, quantity: quantityInput },
      ]);
    } else {
      // Si ya está, aumentamos la cantidad
      setSelectedProducts((prev) =>
        prev.map((sp) =>
          sp.product.id === product.id
            ? { ...sp, quantity: sp.quantity + quantityInput }
            : sp
        )
      );
    }
  };

  const getUnitById = (id: number) => {
    const findunit = units?.find((u) => u.id === id);
    return findunit;
  };

  const handleRemoveProduct = (id: number) => {
    setSelectedProducts(selectedProducts.filter((sp) => sp.product.id !== id));
  };

  return (
    <div className="w-2/3 bg-[#8FC1B5] p-6 flex flex-col justify-between">
      {!isSearchResultsOpen && (
        <div className="flex-1 max-h-[80vh] overflow-y-auto">
          {selectedProducts.length > 0 ? (
            <div className="grid gap-4">
              {selectedProducts.map((sp) => (
                <div
                  key={sp.product.id}
                  className="bg-white grid rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between">
                    <h3 className="text-[#007566] font-medium text-lg">
                      CÓDIGO: {sp.product.id}
                    </h3>
                    <div className="flex justify-between gap-5">
                      <button
                        onClick={() => {
                          if (sp.quantity == 1)
                            handleRemoveProduct(sp.product.id);
                          else {
                            setSelectedProducts((prev) =>
                              prev.map((prevsp) =>
                                prevsp.product.id === sp.product.id
                                  ? { ...prevsp, quantity: sp.quantity - 1 }
                                  : prevsp
                              )
                            );
                          }
                        }}
                        className="text-gray-400 hover:text-red-500">
                        <Minus size={20} />
                      </button>
                      <h3 className="text-[#007566] font-medium text-lg">
                        {sp.quantity}
                      </h3>
                      <button
                        onClick={() => {
                          setSelectedProducts((prev) =>
                            prev.map((prevsp) =>
                              prevsp.product.id === sp.product.id
                                ? { ...prevsp, quantity: sp.quantity + 1 }
                                : prevsp
                            )
                          );
                        }}
                        className="text-gray-400 hover:text-[#007566]">
                        <Plus size={20} />
                      </button>
                      <button
                        onClick={() => handleRemoveProduct(sp.product.id)}
                        className="text-gray-400 hover:text-red-500">
                        <Trash size={20} />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <h3 className="font-medium text-lg">{sp.product.name}</h3>
                  </div>
                  <div className="flex justify-between items-end">
                    <h3 className="font-medium text-lg text-gray-500">
                      {formatCurrencyChile(sp.product.price)}
                      {sp.product.unit_id
                        ? getUnitById(sp.product.unit_id)?.price_unit || ""
                        : ""}
                    </h3>
                    <h3 className="font-medium text-lg text-[#007566]">
                      TOTAL:{" "}
                      {formatCurrencyChile(sp.quantity * sp.product.price)}
                    </h3>
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
      )}
      <SearchResultsModal
        isOpen={isSearchResultsOpen}
        onClose={() => {
          setIsSearchResultsOpen(false);
          setSearchQuery("");
        }}
        products={filteredProducts}
        onSelectProduct={handleSelectProduct}
      />

      {/* Search bar at the bottom */}
      <div>
        <div className="flex justify-end">
          <h1 className="font-semibold text-right text-5xl text-[#007566]">
            TOTAL: {formatCurrencyChile(totalSale)}
          </h1>
        </div>
        <form onSubmit={handleSearch} className="mt-4 relative" ref={formRef}>
          <input
            ref={inputRef}
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

export default SalesCart;
