import React from "react";
import { X, Trash2, AlertTriangle } from "lucide-react";
import useGlobalKeyPress from "../hooks/useGlobalKeyPress";

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean; // Para estilos de advertencia
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title = "¿Estás seguro?",
  message,
  confirmText = "Eliminar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  danger = true,
}) => {
  const bgColor = danger ? "bg-red-50" : "bg-gray-50";
  const borderColor = danger ? "border-red-200" : "border-gray-200";
  const iconColor = danger ? "text-red-500" : "text-gray-500";
  const buttonConfirmColor = danger
    ? "bg-red-600 hover:bg-red-700 text-white"
    : "bg-gray-600 hover:bg-gray-700 text-white";

  useGlobalKeyPress("Escape", () => {
    if (isOpen) {
      onCancel();
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[1000]">
      <div
        className={`${bgColor} ${borderColor} border rounded-xl shadow-lg max-w-md w-full p-4 animate-fade-in`}>
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            {danger ? (
              <AlertTriangle className={`${iconColor} w-5 h-5`} />
            ) : (
              <Trash2 className={`${iconColor} w-5 h-5`} />
            )}
          </div>

          <div className="flex-1">
            <div className="flex justify-between items-start">
              <h3 className="font-medium text-gray-900">{title}</h3>
              <button
                onClick={onCancel}
                className="text-gray-400 hover:text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-600">{message}</p>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-3 py-1.5 text-sm rounded-md ${buttonConfirmColor}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
