import React from "react";
import { Product } from "../types";
import { formatCurrencyChile } from "../utils/utils";

interface SearchResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

const SearchResultsModal: React.FC<SearchResultsModalProps> = ({
  isOpen,
  onClose,
  products,
  onSelectProduct,
}) => {
  
  if (!isOpen) return null;

  return (
    <div className="rounded-lg w-full">
      <div className="max-h-[20vh] overflow-y-auto">
        {products.length > 0 ? (
          <div className="grid gap-4">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => {
                  onSelectProduct(product);
                  onClose();
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
