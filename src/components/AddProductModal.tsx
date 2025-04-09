import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Search,
  X,
} from "lucide-react";
import { Product, Category, Group, Barcode } from "../types";
import AddCategoryModal from "./AddCategoryModal";
import AddGroupModal from "./AddGroupModal";
import { Combobox } from "./ui/combobox";
import ToggleSwitch from "./ui/switch";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded?: () => void; // Callback opcional para cuando se añade un producto
}

const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onProductAdded,
}) => {
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [idInput, setIdInput] = useState<string>("1");
  const [barcodeInput, setBarcodeInput] = useState<string>("");
  const [barcodes, setBarcodes] = useState<Barcode[]>([]);
  const [productBarcodes, setProductBarcodes] = useState<Barcode[]>([]);
  const [formData, setFormData] = useState<{
    id: number;
    name: string;
    category_id: number | null;
    group_id: number | null;
    supplier_code: string | null;
    price: number;
    unit: string | null;
    quick_access: boolean;
    keyboard_shortcut: string;
  }>({
    id: 0,
    name: "",
    category_id: 0,
    group_id: 0,
    supplier_code: "",
    price: 0,
    unit: "",
    quick_access: false,
    keyboard_shortcut: "",
  });

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
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
  }, [isOpen]);

  const loadData = async (id?: number) => {
    try {
      setIsLoading(true);
      const [categoriesData, groupsData, productsData, barcodesData] =
        await Promise.all([
          window.electron.database.getCategories(),
          window.electron.database.getGroups(),
          window.electron.database.getProducts(),
          window.electron.database.getBarcodes(),
        ]);
      setCategories(categoriesData);
      setGroups(groupsData);
      setProducts(productsData);
      setBarcodes(barcodesData);
      let found;
      if (id) found = productsData.find((p) => p.id === id);
      else found = productsData.find((p) => p.id === 1);
      if (found) {
        setFormData(found);
        const productBarcodesData =
          await window.electron.database.getBarcodeByProductId(found.id);
        if (productBarcodesData) {
          setProductBarcodes(productBarcodesData);
          setBarcodeInput(productBarcodesData[0]?.barcode || "");
        }
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);

      console.log("formData", formData);

      const productData: Product = {
        id: formData.id,
        name: formData.name,
        category_id: formData.category_id,
        group_id: formData.group_id ?? null,
        supplier_code: formData.supplier_code || null,
        price: formData.price || 0,
        unit: formData.unit || null,
        quick_access: formData.quick_access,
        keyboard_shortcut: formData.keyboard_shortcut || "",
      };

      const found = products.find((p) => p.id === productData.id);

      if (found) await window.electron.database.updateProduct(productData);
      else await window.electron.database.addProduct(productData);

      // Notificación de éxito
      window.electron.dialog.showSuccess("Producto guardado correctamente");

      // Notificar que se añadió un producto (para actualizar listas, etc.)
      if (onProductAdded) {
        onProductAdded();
      }
      loadData(productData.id);
      return;
    } catch (error: any) {
      console.error("Error guardando producto:", error);
      window.electron.dialog.showError(
        error.message || "Error al guardar el producto"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleIdChange = async (data: string) => {
    const currentIndex = products.findIndex((p) => p.id === formData.id);
    setProductBarcodes([]); // Limpiar el estado de los códigos de barras al cambiar de producto

    if (currentIndex === -1) return; // Por seguridad

    // Al cambiar entre productos con "+" o "-", no se necesita modificar el input
    let newProductId;
    let newProduct;
    if (data === "-") {
      const prevIndex =
        currentIndex === 0 || currentIndex === -1
          ? products.length - 1
          : currentIndex - 1;
      newProduct = products[prevIndex];
      newProductId = products[prevIndex].id.toString();
    } else if (data === "+") {
      const nextIndex =
        currentIndex === products.length - 1 || currentIndex === -1
          ? 0
          : currentIndex + 1;
      newProduct = products[nextIndex];
      newProductId = products[nextIndex].id.toString();
    } else if (data) {
      // Si el valor es un número válido, lo aplicamos al `formData`
      const parsedId = parseInt(data);
      const found = products.find((p) => p.id === parsedId);
      if (found) {
        newProduct = found;
        newProductId = parsedId.toString();
      } else {
        newProductId = (products.length - 1).toString();
        newProduct = products[products.length - 1];
        window.electron.dialog.showError(
          "No se encontró ningún producto con ese Código."
        );
      }
    }
    if (newProduct && newProductId) {
      setFormData(newProduct);
      setIdInput(newProductId); // Actualizamos el input con el nuevo ID
      const productBarcodesData =
        await window.electron.database.getBarcodeByProductId(newProduct.id);
      if (productBarcodesData) {
        setProductBarcodes(productBarcodesData);
        setBarcodeInput(productBarcodesData[0]?.barcode || "");
      }
    }
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
    if (value == "") {
      setFormData((prev) => ({
        ...prev,
        [name]: null,
      }));
      return;
    }
    if (name == "barcode") {
      setBarcodeInput(value);
      return;
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
      console.log("newProduct", newProduct);
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

  return (
    <div className="w-full rounded-lg bg-white bg-opacity-50 flex items-center justify-center">
      <div className=" bg-white rounded-lg w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">
            Agregar Producto
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
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
                  onClick={() => handleIdChange("-")}
                  className="px-3 py-2 bg-[#007566] text-white rounded-lg hover:bg-[#006557]">
                  <ChevronLeft size={20} />
                </button>
                <input
                  type="text"
                  name="name"
                  value={idInput} // Aquí usamos `idInput` en lugar de `formData.id`
                  onChange={(event) => setIdInput(event.target.value)} // Actualizamos el valor de `idInput`
                  onBlur={() => handleIdChange(idInput)} // Confirmar cambio cuando el campo pierde el foco (puedes usar "onChange" para más interactividad)
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#007566]"
                />

                <button
                  type="button"
                  onClick={() => handleIdChange("+")}
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
                {/*                 <select
                  name="category_id"
                  value={formData.category_id?.toString()}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#007566]">
                  <option value="">Seleccionar categoría</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select> */}
                <Combobox
                  name="category_id"
                  value={formData.category_id?.toString() ?? ""}
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
                {/* <select
                  name="group_id"
                  value={formData.group_id?.toString() ?? ""}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#007566]">
                  <option value="">Seleccionar grupo</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select> */}
                <Combobox
                  name="group_id"
                  value={formData.group_id?.toString() ?? ""}
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
                  name="grup_id"
                  value={formData.group_id?.toString() ?? ""}
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
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                step="0.01"
                min="0"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#007566]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unidad de medida
              </label>
              <input
                type="text"
                name="unit"
                value={formData.unit?.toString() ?? ""}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#007566]"
              />
            </div>

            <div className="flex items-center gap-2">
              <ToggleSwitch
                checked={formData.quick_access}
                onChange={() => handleCheckboxChange()}
                disabled={false}
                name="quick_access"
              />
            </div>

            {formData.quick_access && (
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
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={isLoading}>
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#007566] text-white rounded-lg hover:bg-[#006557] disabled:bg-gray-400"
              disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar Producto"}
            </button>
          </div>
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
    </div>
  );
};

export default AddProductModal;
