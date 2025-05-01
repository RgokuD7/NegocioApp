import React, { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { Product, Supplier, SupplierCode } from "../types";
import AddSupplierModal from "./AddSupplierModal";
import AlertModal from "./AlertModal";
import useGlobalKeyPress from "../hooks/useGlobalKeyPress";

interface AddSupplierCodesModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number;
}

const AddSupplierCodesModal: React.FC<AddSupplierCodesModalProps> = ({
  isOpen,
  onClose,
  productId,
}) => {
  const [selectedSupplierId, setSelectedSupplierId] = useState<number>(0);
  const [newCode, setNewCode] = useState("");
  const [isAddingCode, setIsAddingCode] = useState(false);
  const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [productSupplierCodes, setProductSupplierCodes] = useState<
    SupplierCode[]
  >([]);
  const [supplierCodes, setSupplierCodes] = useState<SupplierCode[]>([]);
  const [alert, setAlert] = useState<{
    show: boolean;
    type: "error" | "success";
    message: string;
  }>({ show: false, type: "success", message: "" });

  useEffect(() => {
    if (isOpen) loadData();
  }, [isOpen]);

  const loadData = async () => {
    try {
      console.log(productId);
      const [
        suppliersData,
        productCodesSuppliersData,
        supplierCodesData,
        productsData,
      ] = await Promise.all([
        window.electron.database.getSuppliers(),
        window.electron.database.getSupplierCodesByProductId(productId),
        window.electron.database.getSupplierCodes(),
        window.electron.database.getProducts(),
      ]);
      setSuppliers(suppliersData);
      setProductSupplierCodes(productCodesSuppliersData);
      setSupplierCodes(supplierCodesData);
      setProducts(productsData);
      if (productCodesSuppliersData.length == 0) setIsAddingCode(true);
    } catch (error) {
      console.error("Error cargando datos:", error);
      window.electron.dialog.showError(
        "Error al cargar codigos de proveedores"
      );
    }
  };

  useGlobalKeyPress("Escape", () => {
    if (isOpen) {
      onClose();
    }
  });

  const handleAddCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSupplierId && newCode) {
      try {
        const currentSupplierCodes = supplierCodes.filter(
          (sc) => sc.supplier_id === selectedSupplierId
        );
        const findIfCodeExist = currentSupplierCodes.find(
          (sc) => sc.code == parseInt(newCode)
        );
        if (!findIfCodeExist) {
          const newSupplierCode =
            await window.electron.database.addSupplierCode(
              selectedSupplierId,
              productId,
              newCode
            );
          setProductSupplierCodes((prev) => [...prev, newSupplierCode]);
          setAlert({
            show: true,
            type: "success",
            message: "Código proveedor agregado correctamente",
          });
        } else {
          const findProductWhithCode = products.find(
            (p) => p.id === findIfCodeExist.product_id
          );
          const errorMsg = `Error al agreagr codigo proveedor: ${
            findIfCodeExist.code
          } ya existe en el producto ${findProductWhithCode!.name}`;
          setAlert({
            show: true,
            type: "error",
            message: errorMsg,
          });
          return;
        }
      } catch (e) {
        const errorMsg = `Error al agreagr codigo proveedor: ${e}`;
        setAlert({
          show: true,
          type: "error",
          message: errorMsg,
        });
        return;
      }
      setNewCode("");
      setIsAddingCode(false);
    }
  };

  const getSupplierName = (supplierId: number) => {
    return suppliers.find((s) => s.id === supplierId)?.name.toUpperCase() || "";
  };

  const handleAddSupplier = async (supplier: {
    id: number;
    name: string;
    rut?: string;
  }) => {
    try {
      setSuppliers([...suppliers, supplier]);
      setAlert({
        show: true,
        type: "success",
        message: "Proveedor agregado correctamente",
      });
    } catch (e) {
      const errorMsg = `Error al agreagr proveedor: ${e}`;
      setAlert({
        show: true,
        type: "error",
        message: errorMsg,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ">
      <div className="bg-white rounded-lg w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Códigos de Proveedores
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <button
              onClick={() => setIsAddSupplierModalOpen(true)}
              className="px-4 py-2 bg-[#007566] text-white rounded-lg hover:bg-[#006557] flex items-center gap-2">
              <Plus size={20} />
              Agregar Proveedor
            </button>
            <button
              onClick={() => setIsAddingCode(true)}
              className="px-4 py-2 border border-[#007566] text-[#007566] rounded-lg hover:bg-[#007566] hover:text-white flex items-center gap-2">
              <Plus size={20} />
              Agregar Código
            </button>
          </div>

          {isAddingCode && (
            <form
              onSubmit={handleAddCode}
              className="bg-gray-50 p-4 rounded-lg space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proveedor
                </label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) =>
                    setSelectedSupplierId(Number(e.target.value))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#007566]"
                  required>
                  <option value="">Seleccionar proveedor</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código
                </label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#007566]"
                  required
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddingCode(false)}
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
          )}

          <div className="space-y-2">
            <h3 className="font-medium text-gray-700">Códigos existentes</h3>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {productSupplierCodes.map((code) => (
                <div
                  key={code.id}
                  className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-medium">
                      {getSupplierName(code.supplier_id)}
                    </p>
                    <p className="text-sm text-gray-600">{code.code}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {alert.show && (
        <AlertModal
          alertType={alert.type}
          message={alert.message}
          onClose={() => setAlert({ ...alert, show: false })}
          autoClose={false}
          duration={alert.type === "success" ? 3000 : 5000}
        />
      )}
      <AddSupplierModal
        isOpen={isAddSupplierModalOpen}
        onClose={() => {
          setIsAddSupplierModalOpen(false);
        }}
        onAdd={(newSupplier) => handleAddSupplier(newSupplier)}
      />
    </div>
  );
};

export default AddSupplierCodesModal;
