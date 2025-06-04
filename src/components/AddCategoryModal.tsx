import React, { useState } from "react";
import { X } from "lucide-react";
import { Category } from "../types";
import useGlobalKeyPress from "../hooks/useGlobalKeyPress";

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryAdded: (category: Category) => void;
}

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  isOpen,
  onClose,
  onCategoryAdded,
}) => {
  const [categoryName, setCategoryName] = useState("");

  useGlobalKeyPress("Escape", () => {
    if (isOpen) {
      onClose();
    }
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryName) {
      alert("Por favor, ingresa un nombre para la categoría");
      return;
    }

    try {
      const category: string = categoryName.trim();

      const newCategory = await window.electron.database.addCategory(category);

      // Notificación de éxito
      window.electron.dialog.showSuccess("Categoria guardada correctamente");

      // Reset form
      setCategoryName("");

      onCategoryAdded(newCategory);

      onClose();
    } catch (error: any) {
      console.error("Error guardando categoria:", error);
      window.electron.dialog.showError(
        error.message || "Error al guardar categoria"
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Agregar Categoría
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
              Nombre de la Categoría
            </label>
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#007566]"
              placeholder="Ingrese el nombre de la categoría"
            />
          </div>

          <div className="flex justify-end gap-3">
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

export default AddCategoryModal;
