import { useEffect, useState } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar, ChevronDown } from "lucide-react";
import { Product, Sale, Unit } from "../types";
import { useDateRange } from "../context/DateRangeContext";
import { AnimatePresence, motion } from "framer-motion";
import { startOfDay, endOfDay } from "date-fns";

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
  const [expandedSaleIds, setExpandedSaleIds] = useState<number[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  useEffect(() => {
    if (dateRange[0] && dateRange[1]) {
      fetchSales();
    }
  }, [dateRange]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const productsData = await window.electron.database.getProducts();
      const unitsData = await window.electron.database.getUnits();
      setProducts(productsData);
      setUnits(unitsData);
    } catch (error) {
      console.error("Error cargando datos:", error);
      window.electron.dialog.showError("Error al cargar productos");
    }
  };

  const getProductWithId = (id: number) => {
    return products.find((product) => product.id === id);
  };

  const totalSales = sales.reduce((acc, sale) => acc + sale.total, 0);

  const fetchSales = async () => {
    try {
      console.log("Fetching sales for range:", startDate, endDate);
      const startOfDayLocal = startOfDay(startDate!);
      const endOfDayLocal = endOfDay(endDate!);

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
          items: parseSaleItems(sale.items.toString()),
        };
      });

      console.log(adjustedSales);

      setSales(adjustedSales);
    } catch (error) {
      console.error("Error al obtener ventas:", error);
      // Opcional: Mostrar notificación al usuario
      alert("Error al cargar ventas. Intente nuevamente.");
    }
  };

  const toggleSale = (saleId: number) => {
    setExpandedSaleIds(
      (prev) =>
        prev.includes(saleId)
          ? prev.filter((id) => id !== saleId) // Remover si ya está
          : [...prev, saleId] // Agregar si no está
    );
  };

  const getUnitById = (id: number) => {
    return units.find((u) => u.id === id);
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
            <button
              className="bg-white/10 text-white p-3 rounded-lg hover:bg-white/20 transition-colors duration-200 flex flex-col items-center justify-center no-drag"
              onClick={() => {
                const today = new Date();
                setDateRange([today, today]);
              }}>
              HOY
            </button>
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
            <div
              key={sale.id}
              className="bg-white/10 p-4 rounded-lg space-y-2"
              onClick={() => toggleSale(sale.id)}>
              <div className="flex text-white justify-between items-start">
                <span className="font-medium">{sale.created_at}</span>
                <span className="text-lg font-semibold">
                  {formatCurrencyChile(sale.total)}
                </span>
                <ChevronDown
                  className={`transform transition-transform ${
                    expandedSaleIds.includes(sale.id) ? "rotate-180" : ""
                  }`}
                  size={20}
                />
              </div>
              <div className="text-sm text-white/80">
                {sale.items.length}{" "}
                {sale.items.length == 1 ? "producto" : "productos"}
              </div>
              <AnimatePresence>
                {expandedSaleIds.includes(sale.id) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }} // Afecta todas las animaciones
                    className="mt-2 ml-4 space-y-2 border-l-2 border-white/20 pl-4">
                    {sale.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-white/80 text-sm">
                        <span>
                          {item.quantity}
                          {" x "}
                          {getProductWithId(item.product_id ?? 0)?.name ??
                            "Producto Temporal"}
                          {` (${formatCurrencyChile(item.price)}${
                            getProductWithId(item.product_id ?? 0)?.unit_id
                              ? getUnitById(
                                  getProductWithId(item.product_id ?? 0)
                                    ?.unit_id ?? 0
                                )?.price_unit || ""
                              : ""
                          })`}
                        </span>
                        <span>{formatCurrencyChile(item.subtotal)}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DailySalesTab;
