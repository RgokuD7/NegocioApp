import React from 'react';
import { X } from 'lucide-react';
import { Product } from '../types';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Productos Encontrados</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {products.length > 0 ? (
            <div className="grid gap-4">
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => {
                    onSelectProduct(product);
                    onClose();
                  }}
                  className="w-full text-left bg-white hover:bg-gray-50 rounded-lg p-4 shadow-sm border border-gray-200 transition-colors duration-200"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg">{product.name}</h3>
                      <p className="text-gray-600">${product.price}</p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p>Código: {product.id}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center">No se encontraron productos</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchResultsModal;