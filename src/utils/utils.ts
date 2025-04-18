import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const formatCurrencyChile = (number: number): string => {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0, // Para no mostrar decimales en CLP
    maximumFractionDigits: 0,
  }).format(number);
};

export const parseCurrencyInput = (formattedValue: string): number => {
  // Eliminar símbolos y separadores de miles
  const cleanValue = formattedValue
    .replace(/[^0-9]/g, "") // Elimina todo excepto números
    .trim();

  return parseInt(cleanValue) || 0; // Convertir a número, default 0
};
