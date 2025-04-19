import React, { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react"; // Si usas lucide-react para los íconos

interface ComboboxProps {
  name: string;
  value: string | number; // Este valor es el nombre de la opción seleccionada
  onChange: (id: number | string) => void;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  options: Array<{ id: number; value: string | number }>;
  label?: string;
  className?: string;
}

const Combobox: React.FC<ComboboxProps> = ({
  name,
  value,
  onChange,
  options,
  label,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [inputValue, setInputValue] = useState(value); // Esto debe ser el nombre de la opción seleccionada

  // Actualizar el inputValue cuando el valor cambia desde los props
  useEffect(() => {
    if (!value) {
      setInputValue("");
      setFilteredOptions(options);
    } else if (typeof value == "number") {
      const findInputValue = options.find((option) => {
        return option.id === value;
      });
      if (findInputValue) setInputValue(findInputValue.value.toString());
      setFilteredOptions(options);
    } else {
      setInputValue(value);
    }
  }, [value, options]);

  // Manejo del cambio en el input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setInputValue(query); // Actualiza el valor del input
    const find = options.find((option) => {
      return option.value.toString().toLowerCase() === query.toLowerCase();
    });
    setFilteredOptions(
      options.filter(
        (option) =>
          option.value.toString().toLowerCase().includes(query.toLowerCase()) // Filtra las opciones según el texto escrito
      )
    );
    if (find) {
      onChange(find.id);
      setIsOpen(false);
    } else onChange(query);
  };

  // Manejo de selección de una opción
  const handleOptionSelect = (option: {
    id: number;
    value: string | number;
  }) => {
    onChange(option.id);
    setIsOpen(false); // Cierra el dropdown al seleccionar una opción
    setInputValue(option.value.toString()); // Establece el nombre como el valor del input
  };

  return (
    <div className="relative w-full">
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={name}
          name={name}
          value={inputValue} // El valor del input es controlado por el nombre de la opción
          onChange={handleInputChange}
          className={`w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#007566] ${className}`}
          onFocus={() => setIsOpen(true)} // Abre el dropdown cuando el campo está enfocado
          onBlur={() => setTimeout(() => setIsOpen(false), 200)} // Cierra el dropdown después de perder el foco
        />
        <ChevronDown
          className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer pointer-events-none text-gray-500"
          size={16}
        />
        {isOpen && filteredOptions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            <ul>
              {filteredOptions.map((option) => (
                <li
                  key={option.id}
                  onClick={() => handleOptionSelect(option)} // Selecciona la opción y actualiza el nombre
                  className="px-3 py-2 cursor-pointer hover:bg-[#007566] hover:text-white">
                  {option.value} {/* Muestra el nombre de la opción */}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export { Combobox };
