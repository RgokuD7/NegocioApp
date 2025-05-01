import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  format,
  isToday,
  isYesterday,
  isThisYear,
  differenceInCalendarDays,
} from "date-fns";
import { es } from "date-fns/locale";
import { SaleItem } from "../types";

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

export const roundToNearestTen = (num: number): number => {
  return Math.round(num / 10) * 10;
};

// Función para ajustar una fecha local a UTC considerando el offset local
export const utcToLocal = (date: Date) => {
  // Obtener la zona horaria local del sistema en minutos de offset con respecto a UTC
  const localOffsetMinutes = new Date().getTimezoneOffset();

  const utcMilliseconds = date.getTime() - localOffsetMinutes * 60 * 1000;

  return new Date(utcMilliseconds);
};

export const formatRelativeDate = (date: Date | string) => {
  const now = new Date();
  const inputDate = new Date(date);

  // Time formatting options
  const timeFormat = "HH:mm"; // 24-hour format

  // Check for special cases
  if (isToday(inputDate)) {
    return `Hoy ${format(inputDate, timeFormat)}`;
  }

  if (isYesterday(inputDate)) {
    return `Ayer ${format(inputDate, timeFormat)}`;
  }

  const daysDifference = differenceInCalendarDays(now, inputDate);
  if (daysDifference === 2) {
    return `Antes de ayer ${format(inputDate, timeFormat)}`;
  }

  // Current year cases
  if (isThisYear(inputDate)) {
    const formatted = format(inputDate, "EEEE d 'de' MMMM HH:mm", { locale: es });
    
    return formatted
      .replace(/^\w/, c => c.toUpperCase()) // Capitaliza el día de la semana
      .replace(/(\sde\s)(\w)/g, (_, pre, letra) => `${pre}${letra.toUpperCase()}`);
  }

  // Default case for older dates
  return format(inputDate, "dd/MM/yyyy HH:mm");
};


export const parseSaleItems = (itemsJson: string): SaleItem[] => {
  try {
    const parsedItems = JSON.parse(itemsJson) as any[];
    
    return parsedItems.map(item => ({
      id: Number(item.id),
      sale_id: Number(item.sale_id || 0), // Asignar valor por defecto si falta
      product_id: item.product_id ? Number(item.product_id) : null,
      quantity: parseFloat(item.quantity),
      price: parseFloat(item.price),
      subtotal: parseFloat(item.subtotal)
    })).filter(item => !isNaN(item.id)); // Filtrar items inválidos

  } catch (error) {
    console.error('Error parsing sale items:', error);
    return [];
  }
};