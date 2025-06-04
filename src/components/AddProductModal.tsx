import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Save,
  Search,
  Trash,
} from "lucide-react";
import {
  Product,
  Category,
  Group,
  Barcode,
  Unit,
  SupplierCode,
  Supplier,
} from "../types";
import AddCategoryModal from "./AddCategoryModal";
import AddEditGroupModal from "./AddEditGroupModal";
import { Combobox } from "./ui/combobox";
import ToggleSwitch from "./ui/switch";
import AlertModal from "./AlertModal";
import SearchResultsModal from "./SearchResultsModal";
import CurrencyInput from "./ui/currencyInput";
import { BarcodesCombobox } from "./ui/barcodesCombobox";
import ConfirmModal from "./ConfirmModal";
import AddSupplierCodesModal from "./AddSupplierCodesModal";
import { GroupCombobox } from "./ui/gruopCombobox";

interface AddProductModalProps {
  isOpen: boolean;
  onProductAdded?: () => void; // Callback opcional para cuando se añade un producto
}

const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onProductAdded,
}) => {
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [isAddSupplierCodesModalOpen, setIsAddSupplierCodesModalOpen] =
    useState(false);
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [availableIds, setAvailableIds] = useState<number[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [idInput, setIdInput] = useState<string>("");
  const [barcodeInput, setBarcodeInput] = useState<string | number>("");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierCodes, setSupplierCodes] = useState<SupplierCode[]>([]);
  const [barcodes, setBarcodes] = useState<Barcode[]>([]);
  const [productBarcodes, setProductBarcodes] = useState<Barcode[]>([]);
  const [focusPrice, setFocusPrice] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchResultsOpen, setIsSearchResultsOpen] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [supplierFilter, setSupplierFilter] = useState(false);
  const [supplierSelected, setSupplierSelected] = useState(0);
  const [formData, setFormData] = useState<{
    id: number;
    name: string;
    category_id: number | null | string;
    group_id: number | null | string;
    price: number | string;
    unit_id: number | null | string;
    quick_access: boolean;
    keyboard_shortcut: string | null;
  }>({
    id: 0,
    name: "",
    category_id: 0,
    group_id: 0,
    price: "",
    unit_id: 0,
    quick_access: false,
    keyboard_shortcut: "",
  });
  const [alert, setAlert] = useState<{
    show: boolean;
    type: "error" | "success";
    message: string;
  }>({ show: false, type: "success", message: "" });

  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    danger: boolean;
    onConfirm?: () => void;
    onCancel?: () => void;
  }>({
    show: false,
    title: "¿Estás seguro?",
    message: "",
    confirmText: "Eliminar",
    cancelText: "Cancelar",
    danger: true,
    onConfirm: () => {},
    onCancel: () => {},
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [isOpen]);

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
        suppliersData,
        supplierCodesData,
      ] = await Promise.all([
        window.electron.database.getCategories(),
        window.electron.database.getGroups(),
        window.electron.database.getProducts(),
        window.electron.database.getBarcodes(),
        window.electron.database.getUnits(),
        window.electron.database.getSuppliers(),
        window.electron.database.getSupplierCodes(),
      ]);
      setCategories(categoriesData);
      setGroups(groupsData);
      setProducts(productsData);
      setBarcodes(barcodesData);
      setUnits(unitsData);
      setSuppliers(suppliersData);
      setSupplierCodes(supplierCodesData);
      setProductData(id ? id : productsData[0].id); // Cargar el producto por ID o por defecto al primero
    } catch (error) {
      console.error("Error cargando datos:", error);
      window.electron.dialog.showError("Error al cargar datos");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e!.preventDefault();

    if (parseInt(formData.price.toString()) > 70000) {
      setConfirmModal({
        show: true,
        title: "Confirmar acción",
        message:
          "El precio del producto es muy alto. ¿Estás seguro de que deseas continuar?",
        confirmText: "No, cancelar",
        cancelText: "Sí, continuar",
        danger: false,
        onConfirm: () => {
          return;
        },
        onCancel: async () => {
          await saveProduct();
        },
      });
    } else {
      await saveProduct();
    }
  };

  const saveProduct = async () => {
    try {
      setIsLoading(true);

      //console.table(formData.category_id);

      const productData: Product = {
        id: parseInt(idInput),
        name: formData.name,
        category_id: parseInt(formData.category_id?.toString() ?? "") || null,
        group_id: parseInt(formData.group_id?.toString() ?? "") || null,
        price: parseInt(formData.price.toString()) || 0,
        unit_id: parseInt(formData.unit_id?.toString() ?? "") || null,
        quick_access: formData.quick_access,
        keyboard_shortcut: formData.keyboard_shortcut || "",
      };

      console.table(productData);

      let foundProductBarcode;

      if (typeof barcodeInput == "number")
        foundProductBarcode = productBarcodes.find(
          (barcode) => barcode.id === barcodeInput
        );
      else
        foundProductBarcode = productBarcodes.find(
          (barcode) => barcode.barcode === parseInt(barcodeInput.toString())
        );

      const foundIfBarcodeExist = barcodes.find(
        (barcode) => barcode.barcode === parseInt(barcodeInput.toString())
      );
      const foundProductOfExistingBarcode = foundIfBarcodeExist
        ? await window.electron.database.searchProductsByBarcode(
            foundIfBarcodeExist.barcode
          )
        : "";

      const foundProduct = products.find((p) => p.id === productData.id);

      if (foundProduct) {
        if (!foundProductBarcode && barcodeInput != "") {
          if (foundIfBarcodeExist) {
            setAlert({
              show: true,
              type: "error",
              message: `Este código de barras ya está en uso por ${foundProductOfExistingBarcode[0].name}`,
            });
            return;
          } else {
            await window.electron.database.addBarcode(
              productData.id,
              barcodeInput.toString()
            );
          }
        }
        await window.electron.database.updateProduct(productData);
      } else {
        // Asignar un nuevo ID
        if (foundIfBarcodeExist) {
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
            parseInt(idInput),
            barcodeInput.toString()
          );
      }

      // Notificación de éxito
      const action = foundProduct ? "actualizado" : "agregado";
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
      setProducts((prev) => [...prev, productData]);
      setProductData(productData.id);
    } catch (error: any) {
      console.error("Error guardando producto:", error);
      const errorMsg = `Error guardando producto: ${error}`;
      setAlert({
        show: true,
        type: "error",
        message: errorMsg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Función para encontrar huecos en los IDs
  const findAvailableIds = (products: Product[]): number[] => {
    if (products.length === 0) return [1];

    const ids = products.map((p) => p.id).sort((a, b) => a - b);
    const gaps: number[] = [];
    let expectedId = 1;

    ids.forEach((id) => {
      while (expectedId < id) {
        gaps.push(expectedId);
        expectedId++;
      }
      expectedId = id + 1;
    });

    return gaps;
  };

  // Actualizar availableIds cuando cambien los productos
  useEffect(() => {
    setAvailableIds(findAvailableIds(products));
  }, [products]);

  const handleIdChange = async (data: number, btn?: number) => {
    const currentIndex = products.findIndex((p) => p.id === data);
    setProductBarcodes([]); // Limpiar los códigos de barras al cambiar de producto
    let newProductId: number;
    if (currentIndex === -1) {
      if (data == -1) return;
      else if (data == 0) {
        newProductId =
          btn == 1 ? products[0].id : products[products.length - 1].id;
      } else if (data == products[products.length - 1].id + 1) {
        if (btn) newProductId = products[products.length - 1].id + 1 + btn;
        else newProductId = products[products.length - 1].id + 1;
      } else if (data == products[products.length - 1].id + 2) {
        newProductId = 1;
      } else if (data > 0 && data < products[products.length - 1].id) {
        if (btn) {
          newProductId = data + btn;
        } else newProductId = data;
      } else {
        setAlert({
          show: true,
          type: "error",
          message: "No se encontró ningún producto con ese ID",
        });
        newProductId = products.length;
      }
    } else {
      if (btn) {
        if (currentIndex == 0) {
          newProductId =
            btn == 1 ? products[1].id : products[products.length - 1].id + 1;
        } else if (currentIndex == products.length - 1) {
          newProductId =
            btn == 1
              ? products[products.length - 1].id + 1
              : products[currentIndex - 1].id;
        } else newProductId = products[currentIndex + btn].id;
      } else newProductId = products[currentIndex].id;
    }
    setProductData(newProductId);
  };

  const setProductData = async (id: number) => {
    const productsList = await window.electron.database.getProducts();
    const newProduct = productsList.find((p) => p.id === id);
    if (id == productsList[productsList.length - 1].id + 1) {
      setFormData({
        id: 0,
        name: "",
        category_id: null,
        group_id: null,
        price: "0",
        unit_id: 1,
        quick_access: false,
        keyboard_shortcut: "",
      });
      setIdInput(id.toString());
      setBarcodeInput("");
      return;
    }
    if (!newProduct) {
      setFormData({
        id: id,
        name: "",
        category_id: null,
        group_id: null,
        price: "0",
        unit_id: 1,
        quick_access: false,
        keyboard_shortcut: "",
      });
      setIdInput(id.toString());
      setBarcodeInput("");
      return;
    } else {
      const productBarcodesData =
        await window.electron.database.getBarcodeByProductId(newProduct.id);
      if (productBarcodesData) {
        setProductBarcodes(productBarcodesData);
        setBarcodeInput(productBarcodesData[0]?.barcode.toString() || "");
      }
      setFormData(newProduct);
      setIdInput(newProduct.id.toString()); // Actualizamos el input con el nuevo ID
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

    if (name === "id") {
      const numericValue = value.replace(/[^0-9]/g, ""); // elimina todo lo que no sea dígito (0-9)

      if (parseInt(value) > products.length + 2) {
        setIdInput(products.length.toString());
        handleIdChange(products.length);
        setAlert({
          show: true,
          type: "error",
          message: "No se encontró ningún producto con ese ID",
        });
      } else if (value == "") {
        setIdInput("");
        handleIdChange(-1);
      } else {
        setIdInput(numericValue);
        handleIdChange(parseInt(numericValue));
      }
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

  const handleGroupChange = (id: number | string) => {
    setFormData((prev) => ({
      ...prev,
      group_id: id,
    }));
    if (typeof id == "number") {
      const foundGroup = groups.find((group) => {
        return group.id == id;
      });
      if (foundGroup) {
        setFormData((prev) => ({
          ...prev,
          price: foundGroup.price.toString(),
        }));
      }
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
      if (supplierFilter) {
        const matchedSupplierCode = supplierCodes.find(
          (sc) =>
            sc.code === parseInt(searchQuery) &&
            sc.supplier_id === supplierSelected
        );
        if (matchedSupplierCode) {
          const findProductOfCode = products.find(
            (product) => product.id === matchedSupplierCode.product_id
          );
          if (findProductOfCode) {
            setIdInput(findProductOfCode.id.toString());
            handleIdChange(findProductOfCode.id);
            setFocusPrice(true);
            setIsSearchResultsOpen(false);
          }
        }
      } else if (matchedBarcode) {
        const foundProduct = products.find(
          (p) => p.id === matchedBarcode.product_id
        );
        if (foundProduct) {
          setIdInput(foundProduct.id.toString());
          handleIdChange(foundProduct.id);
          setFocusPrice(true);
          setIsSearchResultsOpen(false);
        }
      } else if (matchedId) {
        setIdInput(matchedId.id.toString());
        handleIdChange(matchedId.id);
        setIsSearchResultsOpen(false);
        setFocusPrice(true);
      } else {
        const foundPrducts = products.filter((p) =>
          p.name.toLowerCase().includes(searchQuery)
        );
        setFilteredProducts(foundPrducts);
        if (foundPrducts.length == 0) {
          setIsSearchResultsOpen(false);
          setFocusPrice(false);
          setAlert({
            show: true,
            type: "error",
            message: "No se encontró ningún producto",
          });
        }
      }
      setSearchQuery("");
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    const foundPrducts = products.filter((p) =>
      p.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredProducts(foundPrducts);
    if (foundPrducts.length == 0) {
      return;
    }
    if (query != "") setIsSearchResultsOpen(true);
    else {
      setIsSearchResultsOpen(false);
      setFocusPrice(false);
    }
  };

  const handleSelectProduct = (product: Product) => {
    const existingProduct = products.find((p) => p.id === product.id);
    if (existingProduct) {
      setIdInput(product.id.toString());
      handleIdChange(product.id);
      setIsSearchResultsOpen(false);
    }
  };

  const handleConfirmDelete = async () => {
    const id = parseInt(idInput);
    const existingProduct = products.find((p) => p.id === id);
    if (existingProduct) {
      try {
        await window.electron.database.deleteProduct(id);
        const filtered = products.filter((product) => product.id !== id);
        setProducts(filtered);
        handleIdChange(id, -1);
        setAlert({
          show: true,
          type: "success",
          message: "Producto elimiando correctamente",
        });
      } catch (e) {
        const errorMsg = `Error al eliminar producto: ${e}`;
        setAlert({
          show: true,
          type: "error",
          message: errorMsg,
        });
      }
    } else {
      setAlert({
        show: true,
        type: "error",
        message: "Error al eliminar producto",
      });
    }
  };

  return (
    <div className="w-2/3 bg-[#007566] p-6 flex flex-col justify-between">
      {!isSearchResultsOpen && (
        <div className=" bg-white rounded-lg w-full p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">PRODUCTOS</h2>
            <button
              type="button"
              onClick={() => {
                setIdInput((products[products.length - 1].id + 1).toString());
                handleIdChange(products[products.length - 1].id + 1);
              }}
              className="border border-gray-300 mt-auto bg-white text-[#007566] hover:bg-gray-100 transition-colors duration-200 py-3 px-6 rounded-lg flex items-center justify-center gap-2 font-medium no-drag"
              disabled={isLoading}>
              <Plus size={20} /> Agregar Nuevo
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault(); // Evita que haga submit al presionar Enter
              }
            }}
            ref={formRef}>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleIdChange(formData.id, -1);
                    }}
                    className="px-3 py-2 bg-[#007566] text-white rounded-lg hover:bg-[#006557]">
                    <ChevronLeft size={20} />
                  </button>
                  <input
                    type="text"
                    name="id"
                    value={idInput} // Aquí usamos `idInput` en lugar de `formData.id`
                    onChange={handleChange} // Actualizamos el valor de `idInput`
                    onBlur={() => handleIdChange(parseInt(idInput))} // Confirmar cambio cuando el campo pierde el foco (puedes usar "onChange" para más interactividad)
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#007566]"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      handleIdChange(formData.id, 1);
                    }}
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
                    value={formData.category_id ?? ""}
                    onChange={(id) => {
                      setFormData((prev) => ({
                        ...prev,
                        category_id: id ?? "",
                      }));
                    }}
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
                  <GroupCombobox
                    name="group_id"
                    value={formData.group_id ?? ""}
                    onChange={(id) => {
                      handleGroupChange(id);
                    }}
                    onGroupEdited={(group) => {
                      setGroups((prev) =>
                        prev.map((g) =>
                          g.id === group.id
                            ? { ...g, name: group.name, price: group.price }
                            : g
                        )
                      );
                      if (formData.group_id === group.id) {
                        setFormData((prev) => ({
                          ...prev,
                          group_id: group.id,
                          price: group.price.toString(),
                        }));
                      }
                      setAlert({
                        show: true,
                        type: "success",
                        message: "Grupo guardado correctamente",
                      });
                    }}
                    onGroupDeleted={(id) => {
                      setGroups(groups.filter((group) => group.id !== id));
                      if (formData.group_id === id) {
                        setFormData((prev) => ({
                          ...prev,
                          group_id: null,
                        }));
                      }
                      setAlert({
                        show: true,
                        type: "success",
                        message: "Grupo eliminado correctamente",
                      });
                    }}
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
                  Códigos de barra
                </label>
                <div className="flex gap-2">
                  <BarcodesCombobox
                    value={barcodeInput}
                    onChange={(barcode) => {
                      setBarcodeInput(barcode);
                    }}
                    barcodes={productBarcodes}
                    product_id={formData.id}
                    onBarcodeAdded={(barcode) => {
                      setBarcodes((prev) => [...prev, barcode]);
                      setProductBarcodes((prev) => [...prev, barcode]);
                    }}
                    onBarcodeDeleted={(id) => {
                      setBarcodes(
                        barcodes.filter((barcode) => barcode.id !== id)
                      );
                      setProductBarcodes(
                        productBarcodes.filter((barcode) => barcode.id !== id)
                      );
                      setBarcodeInput("");
                    }}
                  />
                </div>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Códigos Proveedores
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddSupplierCodesModalOpen(true)}
                  className="px-3 py-2 bg-[#007566] text-white w-full rounded-lg hover:bg-[#006557]">
                  Códigos Proveedores
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio
                </label>
                <CurrencyInput
                  name="price"
                  value={parseInt(formData.price.toString())}
                  onChange={(value: number) => {
                    setFormData((prev) => ({
                      ...prev,
                      price: value.toString(),
                    }));
                  }}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      parseInt(formData.price.toString()) < 70000
                    ) {
                      if (formRef.current) formRef.current.requestSubmit();
                    }
                  }}
                  isFocus={focusPrice}
                  onChangeFocus={() => setFocusPrice(false)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#007566]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unidad de medida
                </label>
                <Combobox
                  name="unit_id"
                  value={formData.unit_id ?? ""}
                  onChange={(id) => {
                    setFormData((prev) => ({
                      ...prev,
                      unit_id: id ?? "",
                    }));
                  }}
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

              {/* {formData.quick_access == true && (
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
              )} */}
            </div>
            <div className="flex justify-between gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setConfirmModal({
                    show: true,
                    title: "Confirmar Eliminación",
                    message:
                      "¿Estás seguro de que quieres eliminar este producto?",
                    confirmText: "Eliminar",
                    cancelText: "Cancelar",
                    danger: true,
                    onConfirm: handleConfirmDelete,
                  });
                }}
                className=" bg-white text-[#007566] border border-[#007566] hover:bg-red-700 hover:text-white hover:border-red-700 disabled:bg-gray-400 transition-colors duration-200 py-3 px-6 rounded-lg flex items-center justify-center gap-2 font-medium no-drag"
                disabled={isLoading}>
                <Trash size={20} />
                Eliminar
              </button>
              <button
                type="submit"
                className=" bg-[#007566] text-white hover:bg-[#006557] disabled:bg-gray-400 transition-colors duration-200 py-3 px-6 rounded-lg flex items-center justify-center gap-2 font-medium no-drag"
                disabled={isLoading}>
                <Save size={20} />
                {isLoading ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      )}

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
      </div>

      {/* Search bar at the bottom */}
      <div>
        <form onSubmit={handleSearch} className="mt-4 flex flex-col gap-1">
          <div className="flex gap-1">
            <div className="bg-white w-max rounded-lg flex justify-center p-1">
              <ToggleSwitch
                checked={supplierFilter}
                onChange={() => setSupplierFilter((prev) => !prev)}
                disabled={false}
                name="supplier-filter"
                label="Busqueda por proveedor"
              />
            </div>
            {supplierFilter && (
              <div className="bg-white w-max rounded-lg flex justify-center p-1">
                <select
                  name="suppliers"
                  id="suppliers"
                  onChange={(e) => {
                    setSupplierSelected(parseInt(e.target.value));
                    if (inputRef.current) inputRef.current.focus();
                  }}>
                  <option value={0}>Proveedor</option>
                  {suppliers.map((supplier) => (
                    <option value={supplier.id}>{supplier.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="relative">
            <input
              ref={inputRef}
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
          </div>
        </form>
      </div>
      <AddCategoryModal
        isOpen={isAddCategoryModalOpen}
        onClose={() => setIsAddCategoryModalOpen(false)}
        onCategoryAdded={(category) =>
          setCategories((prev) => [...prev, category])
        }
      />

      <AddEditGroupModal
        isOpen={isAddGroupModalOpen}
        onClose={() => setIsAddGroupModalOpen(false)}
        onGroupAdded={(group) => {
          setGroups((prev) => [...prev, group]);
          setAlert({
            show: true,
            type: "success",
            message: "Grupo agregado correctamente",
          });
        }}
      />
      <ConfirmModal
        isOpen={confirmModal.show}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        danger={confirmModal.danger}
        onConfirm={() => {
          setConfirmModal({ ...confirmModal, show: false });
          confirmModal.onConfirm?.();
        }}
        onCancel={() => {
          setConfirmModal({ ...confirmModal, show: false });
          confirmModal.onCancel?.();
        }}
      />

      <AlertModal
        isOpen={alert.show}
        alertType={alert.type}
        message={alert.message}
        onClose={() => {
          setAlert({ ...alert, show: false });
          if (inputRef.current) inputRef.current.focus();
        }}
        autoClose={false}
        duration={alert.type === "success" ? 3000 : 5000}
      />

      <AddSupplierCodesModal
        productId={parseInt(idInput)}
        isOpen={isAddSupplierCodesModalOpen}
        onClose={() => setIsAddSupplierCodesModalOpen(false)}
        onSupplierAdd={(supplier) =>
          setSuppliers((prev) => [...prev, supplier])
        }
        onSupplierCodeAdd={(supplierCode) => {
          setSupplierCodes((prev) => [...prev, supplierCode]);
        }}
      />
    </div>
  );
};

export default AddProductModal;
