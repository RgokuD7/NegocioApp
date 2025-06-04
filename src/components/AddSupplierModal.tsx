import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import AlertModal from "./AlertModal";
import { Supplier } from "../types";

interface AddSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (supplier: Supplier) => void;
}

const AddSupplierModal: React.FC<AddSupplierModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    rut: "",
  });
  const [alert, setAlert] = useState<{
    show: boolean;
    type: "error" | "success";
    message: string;
  }>({ show: false, type: "success", message: "" });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const suppliersData = await window.electron.database.getSuppliers();
      setSuppliers(suppliersData);
    } catch (error) {
      console.error("Error cargando datos:", error);
      window.electron.dialog.showError("Error al cargar proveedores");
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const finIfSupplierExist = suppliers.find(
        (sup) => sup.name.toLowerCase() === formData.name.toLowerCase().trim()
      );
      const findIfRutExist = suppliers.find((sup) => sup.rut === formData.rut);
      if (!finIfSupplierExist) {
        if (!findIfRutExist) {
          const newSupplier = await window.electron.database.addSupplier(
            formData.rut || "",
            formData.name.toLocaleUpperCase().trim()
          );
          onAdd({
            id: newSupplier.id,
            name: newSupplier.name,
            rut: newSupplier.rut,
          });
        } else {
          const errorMsg = `Error al agreagr proveedor: ${
            findIfRutExist!.rut
          } ya existe en el proveedor ${findIfRutExist!.name}`;
          setAlert({
            show: true,
            type: "error",
            message: errorMsg,
          });
          return;
        }
      } else {
        const errorMsg = `Error al agregar proveedor: ${formData.name} ya existe`;
        setAlert({
          show: true,
          type: "error",
          message: errorMsg,
        });
        return;
      }
    } catch (e) {
      const errorMsg = `Error al agregar proveedor: ${e}`;
      setAlert({
        show: true,
        type: "error",
        message: errorMsg,
      });
      return;
    }
    setFormData({ name: "", rut: "" });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Agregar Proveedor
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
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#007566]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              RUT
            </label>
            <input
              type="text"
              value={formData.rut}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, rut: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#007566]"
              placeholder="Opcional"
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

      <AlertModal
        isOpen={alert.show}
        alertType={alert.type}
        message={alert.message}
        onClose={() => setAlert({ ...alert, show: false })}
        autoClose={false}
        duration={alert.type === "success" ? 3000 : 5000}
      />
    </div>
  );
};

export default AddSupplierModal;
