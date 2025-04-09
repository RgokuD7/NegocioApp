import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Product } from "../types";
import ToggleSwitch from "./ui/switch";

interface QuickAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuickAccesAdded: () => void;
}

const QuickAccessModal: React.FC<QuickAccessModalProps> = ({
  isOpen,
  onClose,
  onQuickAccesAdded,
}) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadData(); // Cargar los productos cuando el modal se abre
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const products = await window.electron.database.getProducts();
      setProducts(products);
    } catch (error) {
      console.error("Error cargando datos:", error);
      window.electron.dialog.showError(
        "Error al cargar las categorías y grupos"
      );
    }
  };

  // Actualizar el estado del producto cuando cambie el checkbox
  const handleCheckboxChange = (productId: number) => {
    setProducts((prevProducts) =>
      prevProducts.map((product) =>
        product.id === productId
          ? { ...product, quick_access: !product.quick_access }
          : product
      )
    );
  };

  const handleKeyDown = async (
    evento: React.KeyboardEvent<HTMLInputElement>,
    productId: number
  ) => {
    const tecla = evento!.key;
    console.log(`Se presionó la tecla: ${tecla}`);
    if (productId) {
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
          setProducts((prevProducts) =>
            prevProducts.map((product) =>
              product.id === productId
                ? { ...product, keyboard_shortcut: key }
                : product
            )
          );
        }
      } else {
        // Si la tecla no es válida, mostramos un mensaje de error
        window.electron.dialog.showError(
          "La tecla de acceso rápido debe ser de F1 a F12."
        );
      }
    }
  };

  // Guardar los cambios de quick_access en la base de datos
  const saveChanges = async () => {
    try {
      // Aquí puedes llamar a la función que guarda los productos con quick_access actualizado
      await Promise.all(
        products.map((product) =>
          window.electron.database.updateQuickAccess(
            product.id ?? 0,
            product.quick_access,
            product.keyboard_shortcut
          )
        )
      );

      if (onQuickAccesAdded) {
        onQuickAccesAdded();
      }

      onClose();
    } catch (error) {
      console.error("Error al guardar cambios:", error);
      window.electron.dialog.showError("Error al guardar los cambios." + error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Configurar Acceso Rápido
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Selecciona los productos que deseas mostrar en el panel de acceso
            rápido.
          </p>

          <div className="max-h-96 overflow-y-auto">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-gray-600">${product.price}</p>
                </div>
                <div className="flex items-center gap-2">
                  {product.quick_access != false && (
                    <div>
                      <input
                        type="text"
                        name="keyboard_shortcut"
                        id="keyboard_shortcut"
                        value={product.keyboard_shortcut ?? ""}
                        readOnly
                        onKeyDown={(e) => handleKeyDown(e, product.id)}
                        style={{ width: "50px" }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#007566]"
                      />
                    </div>
                  )}
                  <ToggleSwitch
                    checked={product.quick_access}
                    onChange={() => handleCheckboxChange(product.id)}
                    disabled={false}
                    name="quick_access"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              Cancelar
            </button>
            <button
              onClick={saveChanges}
              className="px-4 py-2 bg-[#007566] text-white rounded-lg hover:bg-[#006557]">
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickAccessModal;
