import { useState, useEffect, useRef } from "react";
import { formatCurrencyChile, parseCurrencyInput } from "../../utils/utils";

interface CurrencyInputProps {
  name: string;
  value: number;
  onChange: (value: number) => void;
  onChangeFocus?: () => void;
  className?: string;
  isFocus?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
}

// Usamos forwardRef para exponer la ref del input interno
const CurrencyInput: React.FC<CurrencyInputProps> = ({
  name,
  value,
  onChange,
  onChangeFocus,
  className,
  isFocus = false, // Valor por defecto
  placeholder,
  min,
  max,
}) => {
  const [displayValue, setDisplayValue] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  // Efecto para manejar el focus cuando `isFocus` cambia
  useEffect(() => {
    if (isFocus && inputRef.current) {
      inputRef.current.focus();
      if (onChangeFocus) onChangeFocus;
    }
  }, [isFocus]);

  useEffect(() => {
    if (value == 0) {
      setDisplayValue("");
    } else setDisplayValue(formatCurrencyChile(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9$.]/g, "");
    setDisplayValue(rawValue);

    if (rawValue === "") {
      onChange(0);
      return;
    }

    if (/^[$\s0-9.,]*$/.test(rawValue)) {
      const parsedValue = parseCurrencyInput(rawValue);
      onChange(parsedValue);
    }
  };

  const handleBlur = () => {
    const parsed = parseCurrencyInput(displayValue);
    const formatted = formatCurrencyChile(parsed);
    setDisplayValue(formatted);
    onChange(parsed);
  };

  return (
    <input
      ref={inputRef} // <-- Ahora la ref apunta directamente al input
      type="text"
      name={name}
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
      placeholder={placeholder}
      min={min}
      max={max}
    />
  );
};

export default CurrencyInput;
