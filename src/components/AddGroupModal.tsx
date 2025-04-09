import React, { useState } from "react";
import { X } from "lucide-react";

interface AddGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupAdded?: () => void;
}

const AddGroupModal: React.FC<AddGroupModalProps> = ({
  isOpen,
  onClose,
  onGroupAdded,
}) => {
  const [groupName, setGroupName] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
  
      if (!groupName) {
        alert('Por favor, ingresa un nombre para el grupo');
        return;
      }
  
      try {
        const category: string = groupName.trim();
  
        await window.electron.database.addGroup(category);
  
        // Notificación de éxito
        window.electron.dialog.showSuccess("Grupo guardada correctamente");
  
        // Reset form
        setGroupName("");
  
        // Notificar que se añadió un producto (para actualizar listas, etc.)
        if (onGroupAdded) {
          onGroupAdded();
        }
  
        onClose();
      } catch (error: any) {
        console.error("Error guardando grupo:", error);
        window.electron.dialog.showError(
          error.message || "Error al guardar grupo"
        );
      }
    };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Agregar Grupo</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Grupo
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#007566]"
              placeholder="Ingrese el nombre del grupo"
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

export default AddGroupModal;
