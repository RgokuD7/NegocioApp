import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Product, Sale, SaleItem } from "../types";
import { formatCurrencyChile, roundToNearestTen } from "../utils/utils";
import CurrencyInput from "./ui/currencyInput";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (isComplete: boolean) => void;
  cartItems: { product: Product; quantity: number }[];
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  cartItems,
}) => {
  const [payment, setPayment] = useState<number | string>("0");
  const [change, setChange] = useState(0);
  const [totalSale, setTotalSale] = useState<number>(0);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    const total = cartItems.reduce(
      (sum, sl) => sum + roundToNearestTen(sl.product.price * sl.quantity),
      0
    );
    setTotalSale(total);
  }, [isOpen]);

  useEffect(() => {
    const parsedPayment = parseInt(payment.toString());
    if (parsedPayment > totalSale) {
      setChange(parsedPayment - totalSale);
    }
  }, [payment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(cartItems);
    try {
      const sale: Sale = {
        id: 0,
        total: totalSale,
        payment_method: "",
        created_at: ""
      };
      const saleId = await window.electron.database.addSale(sale);

      console.log(saleId);

      for (const cartItem of cartItems) {
        const subTotal = roundToNearestTen(
          cartItem.quantity * cartItem.product.price
        );

        const saleItem: SaleItem = {
          id: 0, // Auto-generado
          sale_id: saleId,
          product_id: cartItem.product.id > 0 ? cartItem.product.id : null,
          quantity: cartItem.quantity,
          price: cartItem.product.price,
          subtotal: subTotal,
        };

        await window.electron.database.addSaleItem(saleItem);
        console.log("Item agregado:", saleItem);
      }

      onComplete(true);
    } catch (error) {
      console.log("err", error);
      onComplete(false);
    }
    setPayment("0");
    setChange(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Pago</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total a pagar
            </label>
            <div className="text-3xl font-bold text-[#007566]">
              {formatCurrencyChile(totalSale)}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pago recibido
            </label>
            <CurrencyInput
              name="price"
              value={parseInt(payment.toString())}
              onChange={(value: number) => {
                setPayment(value);
              }}
              placeholder={formatCurrencyChile(totalSale)}
              isFocus={true}
              className="w-full text-red-600 font-bold text-3xl rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>

          <div>
            <label className="block text-lg font-medium text-gray-700 mb-1">
              Vuelto
            </label>
            <div
              className={`text-3xl font-bold ${
                change >= 0 ? "text-green-600" : "text-red-600"
              }`}>
              {formatCurrencyChile(change)}
            </div>
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
              className="px-4 py-2 bg-[#007566] text-white rounded-lg hover:bg-[#006557]"
              disabled={change < 0}>
              Completar venta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
