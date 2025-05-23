import React, { useEffect, useRef, useState } from "react";
import { Product } from "../types";
import { formatCurrencyChile } from "../utils/utils";

interface SearchResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  focus?: number;
  onSelectProduct: (product: Product) => void;
}

const SearchResultsModal: React.FC<SearchResultsModalProps> = ({
  isOpen,
  onClose,
  products,
  focus,
  onSelectProduct,
}) => {
  const [focusElement, setFocusElement] = useState<number>(-1);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setFocusElement(focus ?? -1);
  }, [focus]);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      setTimeout(() => {
        buttonRef.current?.focus();
      }, 0);
    }
  }, [isOpen, products, focusElement]);

  if (!isOpen) return null;

  return (
    <div className="rounded-lg w-full">
      <div className="max-h-[80vh] overflow-y-auto">
        {products.length > 0 ? (
          <div className="grid gap-4">
            {products.map((product, index) => (
              <button
                ref={index === focusElement ? buttonRef : null}
                key={product.id}
                onClick={() => {
                  onSelectProduct(product);
                  onClose();
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault(); // Evita comportamiento por defecto (como mover el cursor)
                    if (focusElement == products.length - 1) setFocusElement(0);
                    else setFocusElement((prev) => prev + 1);
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault(); // Evita comportamiento por defecto (como mover el cursor)
                    if (focusElement == 0) setFocusElement(products.length + 1);
                    else setFocusElement((prev) => prev - 1);
                  }
                }}
                className="w-full text-left bg-white hover:bg-gray-50 rounded-lg p-4 shadow-sm border border-gray-200 transition-colors duration-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-lg">{product.name}</h3>
                  </div>
                  <div className="text-right text-lg text-gray-500">
                    <p className="text-gray-600">
                      {formatCurrencyChile(product.price)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div></div>
        )}
      </div>
    </div>
  );
};

export default SearchResultsModal;
