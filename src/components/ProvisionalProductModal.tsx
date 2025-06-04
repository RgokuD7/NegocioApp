import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import CurrencyInput from "./ui/currencyInput";
import useGlobalKeyPress from "../hooks/useGlobalKeyPress";

interface ProvisionalProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (product: { name: string; price: number; quantity: number }) => void;
}

const ProvisionalProductModal: React.FC<ProvisionalProductModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    price: "0",
    quantity: "1",
  });
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && nameInputRef.current) {
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 0);
    }
  }, [isOpen]);

  useGlobalKeyPress("Escape", () => {
    if (isOpen) {
      onClose();
    }
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      name: formData.name,
      price: Number(formData.price),
      quantity: Number(formData.quantity),
    });
    setFormData({
      name: "",
      price: "0",
      quantity: "1",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Registro provisional
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              ref={nameInputRef}
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#007566]"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cantidad
            </label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, quantity: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#007566]"
              required
              min="1"
            />
          </div>

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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#007566]"
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#007566] text-white rounded-lg hover:bg-[#006557]">
              Agregar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProvisionalProductModal;
