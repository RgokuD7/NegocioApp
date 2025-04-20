import React, { useEffect } from "react";
import { X, CheckCircle, AlertTriangle } from "lucide-react";

interface AlertModalProps {
  alertType: "error" | "success";
  message: string;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number; // en milisegundos
}

const AlertModal: React.FC<AlertModalProps> = ({
  alertType,
  message,
  onClose,
  autoClose = true,
  duration = 3000,
}) => {
  const bgColor = alertType === "error" ? "bg-red-50" : "bg-green-50";
  const borderColor =
    alertType === "error" ? "border-red-200" : "border-green-200";

  useEffect(() => {
    if (!autoClose) return;

    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [autoClose, duration, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[1000]">
      <div
        className={`${bgColor} ${borderColor} border rounded-xl shadow-lg max-w-md w-full p-4 animate-fade-in`}>
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            {alertType === "error" ? (
              <AlertTriangle className="text-red-500 w-5 h-5" />
            ) : (
              <CheckCircle className="text-green-500 w-5 h-5" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex justify-between items-start">
              <h3 className="font-medium text-gray-900">
                {alertType === "error" ? "Error" : "Éxito"}
              </h3>
              <button
                id="close"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-600">{message}</p>
          </div>
        </div>

        {!autoClose && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={onClose}
              className={`px-3 py-1.5 text-sm rounded-md ${
                alertType === "error"
                  ? "bg-red-100 text-red-700 hover:bg-red-200"
                  : "bg-green-100 text-green-700 hover:bg-green-200"
              }`}>
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertModal;
