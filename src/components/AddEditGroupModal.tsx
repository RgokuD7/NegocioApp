import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Group } from "../types";
import useGlobalKeyPress from "../hooks/useGlobalKeyPress";
import AlertModal from "./AlertModal";
import ConfirmModal from "./ConfirmModal";
import CurrencyInput from "./ui/currencyInput";
import { set } from "date-fns";

interface AddEditGroupModalProps {
  groupId?: number;
  isOpen: boolean;
  onClose: () => void;
  onGroupAdded?: (group: Group) => void;
  onGroupEdited?: (group: Group) => void;
  onGroupDeleted?: (groupId: number) => void;
}

const AddEditGroupModal: React.FC<AddEditGroupModalProps> = ({
  groupId,
  isOpen,
  onClose,
  onGroupAdded,
  onGroupEdited,
  onGroupDeleted,
}) => {
  const [groupName, setGroupName] = useState("");
  const [price, setPrice] = useState<number | string>("0");
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    danger: boolean;
    onConfirm?: () => void;
  }>({
    show: false,
    title: "¿Estás seguro?",
    message: "",
    confirmText: "Eliminar",
    cancelText: "Cancelar",
    danger: true,
    onConfirm: () => {},
  });
  const [alert, setAlert] = useState<{
    show: boolean;
    type: "error" | "success";
    message: string;
  }>({ show: false, type: "success", message: "" });

  useGlobalKeyPress("Escape", () => {
    if (isOpen) {
      onClose();
    }
  });

  useEffect(() => {
    loadData();
  }, [isOpen]);

  const loadData = async () => {
    try {
      const groupsData = await window.electron.database.getGroups();
      if (groupId) {
        const group = groupsData.find((g) => g.id === groupId);
        if (group) {
          setGroupName(group.name);
          setPrice(group.price.toString());
        }
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
      window.electron.dialog.showError("Error al cargar datos");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!groupName) {
      setAlert({
        show: true,
        type: "error",
        message: "Por favor, ingresa un nombre para el grupo",
      });
      return;
    }
    if (!price || isNaN(parseInt(price.toString()))) {
      setAlert({
        show: true,
        type: "error",
        message: "Por favor, ingresa un precio válido",
      });
      return;
    }

    try {
      const group: string = groupName.trim();
      const priceValue: number = parseInt(price.toString());

      if (groupId) {
        // Editar grupo existente
        const updatedGroup = await window.electron.database.updateGroup(
          groupId,
          group,
          priceValue
        );
        if (onGroupEdited) onGroupEdited(updatedGroup);
      } else {
        const newGroup = await window.electron.database.addGroup(
          group,
          priceValue
        );
        if (onGroupAdded) onGroupAdded(newGroup);
      }

      // Reset form
      setGroupName("");
      setPrice("0");

      onClose();
    } catch (error: any) {
      console.error("Error guardando grupo:", error);
      const errorMessage = error.message || "Error al guardar grupo";
      setAlert({
        show: true,
        type: "error",
        message: errorMessage,
      });
    }
  };

  const handleDeleteGroup = async () => {
    if (groupId && onGroupDeleted) {
      try {
        await window.electron.database.deleteGroup(groupId);
        onGroupDeleted(groupId);
        onClose();
      } catch (error) {
        console.error("Error eliminando grupo:", error);
        setAlert({
          show: true,
          type: "error",
          message: "Error al eliminar el grupo",
        });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            {groupId ? "Editar " : "Agregar"} Grupo
          </h2>
          <button
            onClick={() => {
              onClose();
              // Reset form
              setGroupName("");
              setPrice("0");
            }}
            className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Grupo
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#007566]"
                placeholder="Nombre del grupo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio
              </label>
              <CurrencyInput
                name="price"
                value={parseInt(price.toString())}
                onChange={(value: number) => setPrice(value.toString())}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#007566]"
                placeholder="Precio del grupo"
              />
            </div>
          </div>

          <div className="flex justify-between gap-3">
            {groupId && (
              <button
                type="button"
                onClick={() => {
                  setConfirmModal({
                    show: true,
                    title: "Eliminar Grupo",
                    message: "¿Estás seguro de que deseas eliminar este grupo?",
                    confirmText: "Eliminar",
                    cancelText: "Cancelar",
                    danger: true,
                    onConfirm: handleDeleteGroup,
                  });
                }}
                className=" bg-white text-[#007566] border border-[#007566] hover:bg-red-700 hover:text-white hover:border-red-700 disabled:bg-gray-400 transition-colors duration-200 py-3 px-6 rounded-lg flex items-center justify-center gap-2 font-medium no-drag">
                Eliminar
              </button>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  // Reset form
                  setGroupName("");
                  setPrice("0");
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-4 py-2 bg-[#007566] text-white rounded-lg hover:bg-[#006557]">
                {groupId ? "Editar " : "Agregar"}
              </button>
            </div>
          </div>
        </form>
      </div>

      <AlertModal
        isOpen={alert.show}
        alertType={alert.type}
        message={alert.message}
        onClose={() => {
          setAlert({ ...alert, show: false });
        }}
        autoClose={false}
        duration={alert.type === "success" ? 3000 : 5000}
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
        onCancel={() => setConfirmModal({ ...confirmModal, show: false })}
      />
    </div>
  );
};

export default AddEditGroupModal;
