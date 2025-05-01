import React, { useState, useEffect, useRef } from "react";
import { Minus, Plus, Search, Trash } from "lucide-react";
import SearchResultsModal from "./SearchResultsModal";
import { Product, Unit, Barcode } from "../types";
import { formatCurrencyChile, roundToNearestTen } from "../utils/utils";
import ProductNotFoundModal from "./ProductNotFoundModal";
import ProvisionalProductModal from "./ProvisionalProductModal";
import useGlobalKeyPress from "../hooks/useGlobalKeyPress";
import PaymentModal from "./PaymentModal";
import AlertModal from "./AlertModal";

interface SalesCartProps {
  isOpen: boolean;
  onOpenAddProducts?: () => void;
  onShortcutAdded: () => void;
  shorcutData: string;
}
const SalesCart: React.FC<SalesCartProps> = ({
  isOpen,
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
  const [isProvisionalProductModalOpen, setIsProvisionalProductModalOpen] =
    useState(false);
  const [provisionalId, setProvisionalId] = useState<number>(-1);
  const [focusElement, setFocusElement] = useState<number>(-1);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<
    { product: Product; quantity: number }[]
  >([]);

  const [alert, setAlert] = useState<{
    show: boolean;
    type: "error" | "success";
    message: string;
    duration: number;
  }>({ show: false, type: "success", message: "", duration: 1000 });

  useGlobalKeyPress("F8", () => {
    if (isOpen) {
      // Solo responde si el SalesCart está activo
      setIsProvisionalProductModalOpen(!isProvisionalProductModalOpen);
    }
  });

  const handleInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault(); // Evita comportamiento por defecto (como mover el cursor)
      setFocusElement(0);
    }

    if (e.key === " ") {
      if (selectedProducts.length > 0 && searchQuery == "") {
        setIsPaymentModalOpen(true);
      }
    }
  };

  useGlobalKeyPress("F5", () => {
    if (isOpen) {
      // Solo responde si el SalesCart está activo
      setSelectedProducts([]);
    }
  });

  const inputRef = useRef<HTMLInputElement>(null);

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (typeof shorcutData === "string" && shorcutData.trim() !== "") {
      setProcessedQuery(shorcutData);
      // setSearchQuery((prev) => `${prev}${shorcutData}`);
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
    const total = selectedProducts.reduce(
      (sum, sl) => sum + roundToNearestTen(sl.quantity * sl.product.price),
      0
    );
    setTotalSale(total);
    if (inputRef.current) inputRef.current.focus();
    setIsSearchResultsOpen(false);
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
      setIsSearchResultsOpen(false);
      setSearchQuery("");
      setQuantityInput(1);
      //if (onShortcutAdded) onShortcutAdded();
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (e.target.value == "") setIsSearchResultsOpen(false);
    else setIsSearchResultsOpen(true);
    let productToFind = "";
    let quantity = 1;
    const trimmedQuery = query.toLowerCase().trim();
    const match = query.match(/^(\d*[,.]?\d+)\s*[*]\s*(.*)/);
    if (match) {
      quantity = parseFloat(match[1].replace(",", "."));
      productToFind = match[2];
    } else {
      productToFind = trimmedQuery; // usamos el query tal cual si no hay x
    }
    setProcessedQuery(productToFind);
    setQuantityInput(quantity);
  };

  const handleSelectProduct = (product: Product, quantity?: number) => {
    const existingProduct = selectedProducts.find(
      (sp) => sp.product.id === product.id
    );

    const productQuantity = quantity ?? quantityInput;

    if (!existingProduct) {
      // Si no está en la lista, lo agregamos con cantidad 1
      setSelectedProducts([
        ...selectedProducts,
        { product, quantity: productQuantity },
      ]);
    } else {
      // Si ya está, aumentamos la cantidad
      setSelectedProducts((prev) =>
        prev.map((sp) =>
          sp.product.id === product.id
            ? { ...sp, quantity: sp.quantity + productQuantity }
            : sp
        )
      );
    }
    setFocusElement(-1);
  };

  const getUnitById = (id: number) => {
    const findunit = units?.find((u) => u.id === id);
    return findunit;
  };

  const handleRemoveProduct = (id: number) => {
    setSelectedProducts(selectedProducts.filter((sp) => sp.product.id !== id));
  };

  const handleAddProvisionalProduct = (productData: {
    name: string;
    price: number;
    quantity: number;
  }) => {
    const newProductToAdd: Product = {
      id: provisionalId,
      name: productData.name,
      category_id: null,
      group_id: null,
      price: productData.price,
      unit_id: null,
      quick_access: false,
      keyboard_shortcut: "",
    };
    setProvisionalId((prev) => prev - 1);
    handleSelectProduct(newProductToAdd, productData.quantity);
    if (inputRef.current) inputRef.current.focus();
  };

  if (!isOpen) return null;

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
                    {sp.product.id > 0 ? (
                      <h3 className="text-[#007566] font-medium text-lg">
                        CÓDIGO: {sp.product.id}
                      </h3>
                    ) : (
                      <h3 className="text-[#007566] font-medium text-lg">
                        CÓDIGO: PT{Math.abs(sp.product.id)}
                      </h3>
                    )}

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
                      {formatCurrencyChile(
                        roundToNearestTen(sp.quantity * sp.product.price)
                      )}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center mt-4">
              No hay productos ingresados
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
        focus={focusElement}
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
            autoFocus
            ref={inputRef}
            type="text"
            placeholder="Buscar por nombre o código..."
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleInputKeyPress}
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
        onProvisional={() => {
          setIsProvisionalProductModalOpen(true);
          setIsProductNotFoundModalOpen(false);
          setSearchQuery("");
        }}
      />

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onComplete={(isComplete) => {
          if (isComplete) {
            setSelectedProducts([]);
            setAlert({
              show: true,
              type: "success",
              message: "Venta generadacon exito",
              duration: 300,
            });
          } else
            setAlert({
              show: true,
              type: "error",
              message: `Error al agregar compra`,
              duration: 1000,
            });
        }}
        cartItems={selectedProducts}
      />
      {alert.show && (
        <AlertModal
          alertType={alert.type}
          message={alert.message}
          onClose={() => setAlert({ ...alert, show: false })}
          autoClose={true}
          duration={alert.duration}
        />
      )}

      <ProvisionalProductModal
        isOpen={isProvisionalProductModalOpen}
        onClose={() => setIsProvisionalProductModalOpen(false)}
        onAdd={handleAddProvisionalProduct}
      />
    </div>
  );
};

export default SalesCart;
