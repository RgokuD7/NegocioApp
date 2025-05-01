import { useEffect, useState } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar } from "lucide-react";
import { Sale } from "../types";
import { useDateRange } from "../context/DateRangeContext";

import { es } from "date-fns/locale/es";
import {
  formatCurrencyChile,
  formatRelativeDate,
  parseSaleItems,
  utcToLocal,
} from "../utils/utils";
registerLocale("es", es);

const DailySalesTab = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const { dateRange, setDateRange } = useDateRange();
  const [startDate, endDate] = dateRange;

  useEffect(() => {
    if (dateRange[0] && dateRange[1]) {
      fetchSales();
    }
  }, [dateRange]);

  const totalSales = sales.reduce((acc, sale) => acc + sale.total, 0);

  const fetchSales = async () => {
    try {
      const startOfDayLocal = startDate;
      startOfDayLocal!.setHours(0, 0, 0, 0);
      const endOfDayLocal = endDate;
      endOfDayLocal!.setHours(23, 59, 59, 999);

      console.log("inicio", startOfDayLocal!.toISOString());
      console.log("fin", endOfDayLocal!.toISOString());

      const salesData: Sale[] = await window.electron.database.getSales(
        startOfDayLocal!.toISOString(),
        endOfDayLocal!.toISOString()
      );

      const adjustedSales = salesData.map((sale: Sale) => {
        const utcDate = new Date(sale.created_at);

        const localDate = utcToLocal(utcDate);

        return {
          ...sale,
          created_at: localDate.toLocaleString(),
          items: parseSaleItems(sale.items!.toString()),
        };
      });

      setSales(adjustedSales);
      console.log(adjustedSales);
    } catch (error) {
      console.error("Error al obtener ventas:", error);
      // Opcional: Mostrar notificación al usuario
      alert("Error al cargar ventas. Intente nuevamente.");
    }
  };

  return (
    <div className="w-2/3 bg-[#007566] p-6 flex flex-col justify-between">
      <div className=" bg-white/10 rounded-lg w-full p-6 flex flex-col gap-3">
        <div className="flex items-center justify-between bg-white/10 p-4 rounded-lg">
          <div className="flex items-center gap-4 w-full">
            <Calendar size={24} className="text-white/80" />
            <DatePicker
              selectsRange={true}
              startDate={startDate}
              endDate={endDate}
              onChange={(dateRange) => {
                setDateRange(dateRange);
              }}
              maxDate={new Date()} // Máximo hoy
              locale={"es"}
              isClearable={true}
              showMonthDropdown={true}
              showYearDropdown={true}
              dropdownMode={"select"}
              className="bg-transparent w-full text-white border border-white/20 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-white/30"
              dateFormat="dd/MM/yyyy"
              placeholderText="Seleccionar fechas"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 p-6 rounded-lg">
            <h3 className="text-lg text-white font-medium mb-2">
              Total ventas
            </h3>
            <p className="text-3xl text-white font-bold">
              {formatCurrencyChile(totalSales)}
            </p>
          </div>
          <div className="bg-white/10 p-6 rounded-lg">
            <h3 className="text-lg text-white font-medium mb-2">
              Cantidad de ventas
            </h3>
            <p className="text-3xl text-white font-bold">{sales.length}</p>
          </div>
          <h3 className="text-xl text-white font-medium">Ventas</h3>
        </div>

        <div className="space-y-4 max-h-[50vh] overflow-y-auto">
          {sales.map((sale) => (
            <div key={sale.id} className="bg-white/10 p-4 rounded-lg space-y-2">
              <div className="flex text-white justify-between items-start">
                <span className="font-medium">
                  {formatRelativeDate(sale.created_at)}
                </span>
                <span className="text-lg font-semibold">
                  {formatCurrencyChile(sale.total)}
                </span>
              </div>
              <div className="text-sm text-white/80">
                {sale.items?.length}{" "}
                {sale.items?.length == 1 ? "producto" : "productos"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DailySalesTab;
