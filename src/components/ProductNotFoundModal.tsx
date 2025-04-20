import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface ProductNotFoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onConfirm: () => void;
  onProvisional: () => void;
}

const ProductNotFoundModal: React.FC<ProductNotFoundModalProps> = ({
  isOpen,
  onClose,
  searchQuery,
  onConfirm,
  onProvisional,
}) => {
  const provisionalButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && provisionalButtonRef.current) {
      setTimeout(() => {
        provisionalButtonRef.current?.focus();
      }, 0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Producto no encontrado
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              No se encontró ningún producto con "{searchQuery}"
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="flex justify-between gap-3">
          <button
            ref={provisionalButtonRef}
            onClick={onProvisional}
            className="px-4 py-2 bg-[#007566] text-white rounded-lg hover:bg-[#006557]">
            Registro Provisional
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-[#007566] text-white rounded-lg hover:bg-[#006557]">
            Agregar Producto
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductNotFoundModal;
