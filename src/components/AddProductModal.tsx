import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Plus, Save, Search } from "lucide-react";
import { Product, Category, Group, Barcode, Unit } from "../types";
import AddCategoryModal from "./AddCategoryModal";
import AddGroupModal from "./AddGroupModal";
import { Combobox } from "./ui/combobox";
import ToggleSwitch from "./ui/switch";
import { formatCurrencyChile } from "../utils/utils";
import AlertModal from "./alertModal";
import SearchResultsModal from "./SearchResultsModal";

interface AddProductModalProps {
  isOpen: boolean;
  onProductAdded?: () => void; // Callback opcional para cuando se añade un producto
}

const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onProductAdded,
}) => {
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [idInput, setIdInput] = useState<string>("");
  const [barcodeInput, setBarcodeInput] = useState<string>("");
  const [supplierCodeInput, setSupplierCodeInput] = useState<string>("");
  const [categoryInput, setCategoryInput] = useState<string>("");
  const [groupInput, setGroupInput] = useState<string>("");
  const [unitInput, setUnitInput] = useState<string>("");
  const [barcodes, setBarcodes] = useState<Barcode[]>([]);
  const [productBarcodes, setProductBarcodes] = useState<Barcode[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchResultsOpen, setIsSearchResultsOpen] = useState(false);
  const [isProductNotFoundModalOpen, setIsProductNotFoundModalOpen] =
    useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState<Product>({
    id: 0,
    name: "",
    category_id: 0,
    group_id: 0,
    price: 0,
    unit_id: 0,
    quick_access: false,
    keyboard_shortcut: "",
  });
  const [alert, setAlert] = useState<{
    show: boolean;
    type: "error" | "success";
    message: string;
  }>({ show: false, type: "success", message: "" });

  const priceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (key.startsWith("F") && !isNaN(Number(key.slice(1)))) {
        const keyNumber = Number(key.slice(1));
        if (keyNumber >= 1 && keyNumber <= 12) {
          e.preventDefault(); // Previene la acción por defecto del navegador
          console.log(`Se presionó F${keyNumber}`);
          // Aquí puedes agregar la lógica que desees para cada tecla
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // Limpieza del efecto
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const loadData = async (id?: number) => {
    try {
      setIsLoading(true);
      const [
        categoriesData,
        groupsData,
        productsData,
        barcodesData,
        unitsData,
      ] = await Promise.all([
        window.electron.database.getCategories(),
        window.electron.database.getGroups(),
        window.electron.database.getProducts(),
        window.electron.database.getBarcodes(),
        window.electron.database.getUnits(),
      ]);
      setCategories(categoriesData);
      setGroups(groupsData);
      setProducts(productsData);
      setBarcodes(barcodesData);
      setUnits(unitsData);
      setProductData(id ? id : 1); // Cargar el producto por ID o por defecto al primero
    } catch (error) {
      console.error("Error cargando datos:", error);
      window.electron.dialog.showError(
        "Error al cargar las categorías y grupos"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent, id?: number) => {
    e!.preventDefault();

    try {
      setIsLoading(true);

      //console.table(formData.category_id);

      const productData: Product = {
        id: formData.id,
        name: formData.name,
        category_id: parseInt(categoryInput) ?? null,
        group_id: parseInt(groupInput) ?? null,
        price: formData.price || 0,
        unit_id: parseInt(unitInput) || null,
        quick_access: formData.quick_access,
        keyboard_shortcut: formData.keyboard_shortcut || "",
      };

      console.table(productData);

      const foundProductBarcode = productBarcodes.find(
        (barcode) => barcode.barcode === parseInt(barcodeInput)
      );
      const foundIfBarcodeExist = barcodes.find(
        (barcode) => barcode.barcode === parseInt(barcodeInput)
      );
      const foundProductOfExistingBarcode = foundIfBarcodeExist
        ? await window.electron.database.searchProductsByBarcode(
            foundIfBarcodeExist.barcode
          )
        : "";

      const foundProduct = products.find((p) => p.id === id);

      if (foundProduct) {
        if (!foundProductBarcode && barcodeInput != "") {
          if (foundIfBarcodeExist) {
            /* window.electron.dialog.showError(
              `Este código de barras ya está en uso por ${foundProductOfExistingBarcode[0].name}`
            ); */
            setAlert({
              show: true,
              type: "error",
              message: `Este código de barras ya está en uso por ${foundProductOfExistingBarcode[0].name}`,
            });
            return;
          } else {
            await window.electron.database.addBarcode(
              productData.id,
              barcodeInput
            );
          }
        }
        await window.electron.database.updateProduct(productData);
      } else {
        // Asignar un nuevo ID
        if (foundIfBarcodeExist) {
          /* window.electron.dialog.showError(
            `Este código de barras ya está en uso por ${foundProductOfExistingBarcode[0].name}`
          ); */
          setAlert({
            show: true,
            type: "error",
            message: `Este código de barras ya está en uso por ${foundProductOfExistingBarcode[0].name}`,
          });
          return;
        }
        await window.electron.database.addProduct(productData);
        if (barcodeInput != "")
          await window.electron.database.addBarcode(
            productData.id,
            barcodeInput
          );
      }

      // Notificación de éxito
      const action = id ? "actualizado" : "agregado";
      const message = `Producto ${action} correctamente`;
      //window.electron.dialog.showSuccess(`Producto ${action} correctamente`);
      setAlert({
        show: true,
        type: "success",
        message: message,
      });

      // Notificar que se añadió un producto (para actualizar listas, etc.)
      if (onProductAdded) {
        onProductAdded();
      }
      loadData(parseInt(idInput));
      return;
    } catch (error: any) {
      console.error("Error guardando producto:", error);
      /* window.electron.dialog.showError(
        error.message || "Error al guardar el producto"
      ); */
      setAlert({
        show: true,
        type: "error",
        message: "Error guardando producto",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleIdChange = async (data: string) => {
    const currentIndex = products.findIndex((p) => p.id === parseInt(data));
    setProductBarcodes([]); // Limpiar los códigos de barras al cambiar de producto
    let newProductId: number;

    if (currentIndex === -1) {
      if (data == "") {
        return;
      }
      if (parseInt(data) == products.length + 1) {
        newProductId = products.length + 1;
      } else if (parseInt(data) == products.length + 2) {
        newProductId = 1;
      } else if (parseInt(data) == 0) {
        newProductId = products.length + 1;
      } else {
        newProductId = products.length;
        /* window.electron.dialog.showError(
          "No se encontró ningún producto con ese ID."
        ); */
        setAlert({
          show: true,
          type: "error",
          message: "No se encontró ningún producto con ese ID",
        });
      }
    } // Por seguridad
    else {
      newProductId = currentIndex + 1;
    }
    setProductData(newProductId);
  };

  const setProductData = async (id: number) => {
    const productsList = await window.electron.database.getProducts();
    if (id == productsList.length + 1) {
      setFormData({
        id: 0,
        name: "",
        category_id: 0,
        group_id: 0,
        price: 0,
        unit_id: 0,
        quick_access: false,
        keyboard_shortcut: "",
      });
      setIdInput(id.toString());

      setBarcodeInput("");
      setCategoryInput("");
      setGroupInput("");
      setUnitInput("");
      return;
    }
    const categoriesList = await window.electron.database.getCategories();
    const groupsList = await window.electron.database.getGroups();
    const unitsList = await window.electron.database.getUnits();
    const newProduct = productsList.find((p) => p.id === id);
    if (newProduct) {
      const productBarcodesData =
        await window.electron.database.getBarcodeByProductId(newProduct.id);
      if (productBarcodesData) {
        setProductBarcodes(productBarcodesData);
        setBarcodeInput(productBarcodesData[0]?.barcode || "");
      }
      const foundCategory = categoriesList.find(
        (category) => category.id === newProduct.category_id
      );
      const foundGroup = groupsList.find(
        (group) => group.id === newProduct.group_id
      );
      const foundUnit = unitsList.find(
        (unit) => unit.id === newProduct.unit_id
      );
      if (foundCategory) setCategoryInput(foundCategory.name);
      else setCategoryInput("");
      if (foundGroup) setGroupInput(foundGroup.name);
      else setGroupInput("");
      if (foundUnit) setUnitInput(foundUnit.unit);
      else setUnitInput("");
      setFormData(newProduct);
      setIdInput(newProduct.id.toString()); // Actualizamos el input con el nuevo ID
    }
  };

  const updateIdInput = (delta: number) => {
    const newValue = (parseInt(idInput) + delta).toString();
    setIdInput(newValue);

    // Simulamos el evento que espera handleChange
    const fakeEvent = {
      target: {
        name: "id",
        value: newValue,
      },
    } as React.ChangeEvent<HTMLInputElement>;

    handleChange(fakeEvent);
  };

  const handleCheckboxChange = () => {
    setFormData((prev) => ({
      ...prev,
      quick_access: !prev.quick_access, // Guardamos la tecla de acceso rápido
    }));
  };

  const handleChange = async (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    //console.log("checked", checked);
    //console.log("value", value);
    //console.log("name", name);
    //console.log("type", type);
    /*   if (value == "") {
      setFormData((prev) => ({
        ...prev,
        [name]: null,
      }));
      return;
    } */
    if (name === "id") {
      const numericValue = value.replace(/\D/g, ""); // elimina todo lo que no sea dígito (0-9)
      setIdInput(numericValue);
      handleIdChange(numericValue);
      if (parseInt(value) > products.length + 2) {
        setIdInput(products.length.toString());
        handleIdChange(products.length.toString());
      }
      return;
    }

    if (name == "barcode") {
      setBarcodeInput(value);
      return;
    }
    if (name == "category_id") {
      setCategoryInput(value);
    }
    if (name == "group_id") {
      setGroupInput(value);
      const foundGroup = groups.find((group) => group.id === parseInt(value));
      if (foundGroup) {
        setFormData((prev) => ({
          ...prev,
          price: foundGroup.price,
        }));
      }
    }
    if (name == "unit_id") {
      setUnitInput(value);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleKeyDown = async (
    evento: React.KeyboardEvent<HTMLInputElement>
  ) => {
    const tecla = evento.key;
    console.log(`Se presionó la tecla: ${tecla}`);
    if (formData.quick_access) {
      const key = tecla.toUpperCase();

      // Verificamos que la tecla sea de tipo F1 a F12
      if (
        key.startsWith("F") &&
        parseInt(key.slice(1)) >= 1 &&
        parseInt(key.slice(1)) <= 12
      ) {
        // Verificamos si la tecla ya está en uso
        const isKeyInUse = await window.electron.database.checkQuickAccessKey(
          key
        );

        console.log("isKeyInUse", isKeyInUse);

        if (isKeyInUse) {
          // Si la tecla ya está en uso, mostramos un mensaje de error
          window.electron.dialog.showError(
            "La tecla de acceso rápido ya está en uso."
          );
        } else {
          // Si la tecla no está en uso, la asignamos al estado
          setFormData((prev) => ({
            ...prev,
            keyboard_shortcut: key, // Guardamos la tecla de acceso rápido
          }));
        }
      }
    }
  };

  const handleSearchByBarcode = async () => {
    const newProduct = await window.electron.database.searchProductsByBarcode(
      parseInt(barcodeInput)
    );
    if (newProduct.length) {
      setFormData(newProduct[0]);
      setIdInput(newProduct[0].id.toString());
      const productBarcodesData =
        await window.electron.database.getBarcodeByProductId(newProduct[0].id);
      if (productBarcodesData) {
        setProductBarcodes(productBarcodesData);
        setBarcodeInput(productBarcodesData[0]?.barcode || "");
      }
    } else {
      window.electron.dialog.showError(
        "No se encontró ningún producto con ese código de barras."
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
          setIdInput(foundProduct.id.toString());
          handleIdChange(foundProduct.id.toString());
          if (priceInputRef.current) priceInputRef.current.focus();
        }
      } else if (matchedId) {
        setIdInput(matchedId.id.toString());
        handleIdChange(matchedId.id.toString());
        if (priceInputRef.current) priceInputRef.current.focus();
      } else {
        const foundPrducts = products.filter((p) =>
          p.name.toLowerCase().includes(searchQuery)
        );
        setFilteredProducts(foundPrducts);
        if (foundPrducts.length == 0) {
          return;
        }
      }
      setSearchQuery("");
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
  const handleSelectProduct = (product: Product) => {
    const existingProduct = products.find((p) => p.id === product.id);
    if (existingProduct) {
      setIdInput(product.id.toString());
      handleIdChange(product.id.toString());
    }
  };

  return (
    <div className="w-2/3 bg-[#8FC1B5] p-6 flex flex-col justify-between">
      <div className=" bg-white rounded-lg w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">PRODUCTOS</h2>
          <button
            type="button"
            onClick={() => {
              setIdInput((products.length + 1).toString());
              handleIdChange((products.length + 1).toString());
            }}
            className="border border-gray-300 mt-auto bg-white text-[#007566] hover:bg-gray-100 transition-colors duration-200 py-3 px-6 rounded-lg flex items-center justify-center gap-2 font-medium no-drag"
            disabled={isLoading}>
            <Plus size={20} /> Agregar Nuevo
          </button>
        </div>

        <form
          onSubmit={(e: React.FormEvent) => handleSubmit(e, formData.id)}
          className="space-y-4"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault(); // Evita que haga submit al presionar Enter
            }
          }}>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => updateIdInput(-1)}
                  className="px-3 py-2 bg-[#007566] text-white rounded-lg hover:bg-[#006557]">
                  <ChevronLeft size={20} />
                </button>
                <input
                  type="number"
                  name="id"
                  value={idInput} // Aquí usamos `idInput` en lugar de `formData.id`
                  onChange={handleChange} // Actualizamos el valor de `idInput`
                  onBlur={() => handleIdChange(idInput)} // Confirmar cambio cuando el campo pierde el foco (puedes usar "onChange" para más interactividad)
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#007566]"
                />

                <button
                  type="button"
                  onClick={() => updateIdInput(1)}
                  className="px-3 py-2 bg-[#007566] text-white rounded-lg hover:bg-[#006557]">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#007566]"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría
              </label>
              <div className="flex gap-2">
                <Combobox
                  name="category_id"
                  value={categoryInput}
                  onChange={handleChange}
                  options={categories.map((category) => ({
                    id: category.id,
                    value: category.name,
                  }))}
                />

                <button
                  type="button"
                  onClick={() => setIsAddCategoryModalOpen(true)}
                  className="px-3 py-2 bg-[#007566] text-white rounded-lg hover:bg-[#006557]">
                  <Plus size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grupo
              </label>
              <div className="flex gap-2">
                <Combobox
                  name="group_id"
                  value={groupInput}
                  onChange={handleChange}
                  options={groups.map((group) => ({
                    id: group.id,
                    value: group.name,
                  }))}
                />
                <button
                  type="button"
                  onClick={() => setIsAddGroupModalOpen(true)}
                  className="px-3 py-2 bg-[#007566] text-white rounded-lg hover:bg-[#006557]">
                  <Plus size={20} />
                </button>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Codigos de barra
              </label>
              <div className="flex gap-2">
                <Combobox
                  name="barcode"
                  value={barcodeInput}
                  onChange={handleChange}
                  options={productBarcodes.map((barcode) => ({
                    id: barcode.id,
                    value: barcode.barcode,
                  }))}
                />

                <button
                  type="button"
                  onClick={handleSearchByBarcode}
                  className="px-3 py-2 bg-[#007566] text-white rounded-lg hover:bg-[#006557]">
                  <Search size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Coidgos prooveddor
              </label>
              <div className="flex gap-2">
                <Combobox
                  name="suplier_code"
                  value={supplierCodeInput}
                  onChange={handleChange}
                  options={groups.map((group) => ({
                    id: group.id,
                    value: group.name,
                  }))}
                />
                <button
                  type="button"
                  onClick={() => setIsAddGroupModalOpen(true)}
                  className="px-3 py-2 bg-[#007566] text-white rounded-lg hover:bg-[#006557]">
                  <Search size={20} />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio
              </label>
              <input
                ref={priceInputRef}
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#007566]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unidad de medida
              </label>
              <Combobox
                name="unit_id"
                value={unitInput}
                onChange={handleChange}
                options={units.map((unit) => ({
                  id: unit.id,
                  value: unit.unit,
                }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <ToggleSwitch
                checked={formData.quick_access}
                onChange={() => handleCheckboxChange()}
                disabled={false}
                name="quick_access"
                label="Acceso rapido"
              />
            </div>

            {formData.quick_access == true && (
              <div>
                <input
                  type="text"
                  name="keyboard_shortcut"
                  id="keyboard_shortcut"
                  value={formData.keyboard_shortcut ?? ""}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  style={{ width: "50px" }}
                  readOnly
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#007566]"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="submit"
              className=" bg-[#007566] text-white hover:bg-[#006557] disabled:bg-gray-400 transition-colors duration-200 py-3 px-6 rounded-lg flex items-center justify-center gap-2 font-medium no-drag"
              disabled={isLoading}>
              <Save size={20} />
              {isLoading ? "Guardando..." : "Guardar Producto"}
            </button>
          </div>
        </form>
      </div>

      {/* Search bar at the bottom */}
      <div>
        <SearchResultsModal
          isOpen={isSearchResultsOpen}
          onClose={() => {
            setIsSearchResultsOpen(false);
            setSearchQuery("");
          }}
          products={filteredProducts}
          onSelectProduct={handleSelectProduct}
        />
        <form onSubmit={handleSearch} className="mt-4 relative">
          <input
            id="search"
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
      <AddCategoryModal
        isOpen={isAddCategoryModalOpen}
        onClose={() => setIsAddCategoryModalOpen(false)}
        onCategoryAdded={loadData}
      />

      <AddGroupModal
        isOpen={isAddGroupModalOpen}
        onClose={() => setIsAddGroupModalOpen(false)}
        onGroupAdded={loadData}
      />
      {alert.show && (
        <AlertModal
          alertType={alert.type}
          message={alert.message}
          onClose={() => setAlert({ ...alert, show: false })}
          autoClose={false}
          duration={alert.type === "success" ? 3000 : 5000}
        />
      )}
    </div>
  );
};

export default AddProductModal;
