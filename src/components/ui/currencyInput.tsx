import { useState, useEffect } from "react";
import { formatCurrencyChile, parseCurrencyInput } from "../../utils/utils";

interface CurrencyInputProps {
  name: string;
  value: number; // Cambiado a number para consistencia
  onChange: (value: number) => void; // Mejor tipo para el manejador
  className?: string;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({
  name,
  value,
  onChange,
  className,
}) => {
  const [displayValue, setDisplayValue] = useState("");

  // Efecto para sincronizar el valor inicial y cambios externos
  useEffect(() => {
    setDisplayValue(formatCurrencyChile(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9$.]/g, "");
    setDisplayValue(rawValue);

    // Permitir campo vacío temporalmente
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
      type="text"
      name={name}
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
    />
  );
};

export default CurrencyInput;
