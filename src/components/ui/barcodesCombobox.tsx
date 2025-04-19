import React, { useEffect, useState } from "react";
import { ChevronDown, Save, Search, Trash } from "lucide-react"; // Si usas lucide-react para los íconos
import { Barcode } from "../../types";
import AlertModal from "../AlertModal";

interface BarcodesComboboxProps {
  value: string | number; // Este valor es el nombre de la opción seleccionada
  onChange: (barcode: string | number) => void;
  barcodes: Barcode[];
  product_id: number;
  className?: string;
  onBarcodeAdded: (barcode: Barcode) => void;
  onBarcodeDeleted: (id: number) => void;
}

const BarcodesCombobox: React.FC<BarcodesComboboxProps> = ({
  value,
  onChange,
  barcodes,
  product_id,
  className,
  onBarcodeAdded,
  onBarcodeDeleted,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [isDisabled, setIsDisabled] = useState(false);
  const [alert, setAlert] = useState<{
    show: boolean;
    type: "error" | "success";
    message: string;
  }>({ show: false, type: "success", message: "" });
  // Actualizar el inputValue cuando el valor cambia desde los props
  useEffect(() => {
    if (typeof value == "number") {
      const findDispplayBarcode = barcodes.find((bar) => {
        return bar.id === value;
      });
      if (findDispplayBarcode) {
        setInputValue(findDispplayBarcode.barcode.toString());
      }
    } else {
      setInputValue(value);
    }
  }, [value, barcodes]);

  useEffect(() => {
    const checkProduct = async () => {
      const products = await window.electron.database.getProducts();
      setIsDisabled(products.some((product) => product.id === product_id));
    };
    checkProduct();
  }, [product_id]);

  // Manejo del cambio en el input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setInputValue(query); // Actualiza el valor del input
    const find = barcodes.find((barcode) => {
      return barcode.barcode.toString() == query;
    });
    if (find) {
      onChange(find.id);
      setIsOpen(false);
    } else onChange(query);
  };

  const barcodeExist = () => {
    const find = barcodes.find((barcode) => {
      return barcode.barcode.toString() == inputValue;
    });

    if (find) return true;
    else return false;
  };

  // Manejo de selección de una opción
  const handleOptionSelect = (barcode: Barcode) => {
    onChange(barcode.id);
    setIsOpen(false);
  };

  const handleAddBarcode = async () => {
    const allBarcodes = await window.electron.database.getBarcodes();
    const findIfExist = allBarcodes.find((barcode) => {
      return barcode.barcode == inputValue;
    });
    if (!findIfExist) {
      try {
        const newBarcode = await window.electron.database.addBarcode(
          product_id,
          inputValue.toString()
        );
        if (onBarcodeAdded) {
          onBarcodeAdded(newBarcode);
        }
        setAlert({
          show: true,
          type: "success",
          message: "Código de barras agregado con exito",
        });
      } catch {
        setAlert({
          show: true,
          type: "error",
          message: "No se pudo agregar el código d ebarras",
        });
      }
    } else {
      const foundProductOfExistingBarcode =
        await window.electron.database.searchProductsByBarcode(
          findIfExist.barcode
        );
      setAlert({
        show: true,
        type: "error",
        message: `Este código de barras ya está en uso por ${foundProductOfExistingBarcode[0].name}`,
      });
    }
  };

  const handleDeleteBarcode = async () => {
    const find = barcodes.find((barcode) => {
      return barcode.barcode.toString() == inputValue;
    });
    if (find) {
      try {
        await window.electron.database.deleteBarcode(find.id);
        if (onBarcodeDeleted) {
          onBarcodeDeleted(find.id);
        }
        setInputValue("");
        setAlert({
          show: true,
          type: "success",
          message: "Código de barras borrado con exito",
        });
      } catch {
        setAlert({
          show: true,
          type: "error",
          message: "No se pudo borrar el código d ebarras",
        });
      }
    }
  };

  return (
    <div className="relative w-full flex gap-2">
      <div className="relative w-full">
        <input
          id="barcode"
          name="barcode"
          value={inputValue} // El valor del input es controlado por el nombre de la opción
          onChange={handleInputChange}
          className={`w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#007566] ${className}`}
          onFocus={() => setIsOpen(true)} // Abre el dropdown cuando el campo está enfocado
          onBlur={() => setTimeout(() => setIsOpen(false), 200)} // Cierra el dropdown después de perder el foco
        />
        <ChevronDown
          className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer pointer-events-none text-gray-500"
          size={16}
        />
        {isOpen && barcodes.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            <ul>
              {barcodes.map((barcode) => (
                <li
                  key={barcode.id}
                  onClick={() => handleOptionSelect(barcode)} // Selecciona la opción y actualiza el nombre
                  className="px-3 py-2 cursor-pointer hover:bg-[#007566] hover:text-white">
                  {barcode.barcode} {/* Muestra el nombre de la opción */}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {barcodeExist() ? (
        <button
          type="button"
          onClick={handleDeleteBarcode}
          className="px-3 py-2 bg-[#007566] text-white rounded-lg hover:bg-[#006557]">
          <Trash size={20} />
        </button>
      ) : (
        <button
          type="button"
          onClick={handleAddBarcode}
          disabled={inputValue == "" || !isDisabled}
          className="px-3 py-2 bg-[#007566] text-white rounded-lg hover:bg-[#006557] disabled:bg-gray-400">
          <Save size={20} />
        </button>
      )}
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

export { BarcodesCombobox };
