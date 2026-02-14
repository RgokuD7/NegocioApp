import { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Package,
  DollarSign,
  Calendar,
} from "lucide-react";

import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Product, Sale, Unit } from "../types";
import { useDateRange } from "../context/DateRangeContext";
import { startOfDay, endOfDay } from "date-fns";

import { es } from "date-fns/locale/es";
import {
  formatCurrencyChile,
  parseSaleItems,
  utcToLocal,
} from "../utils/utils";
registerLocale("es", es);

interface ProductStat {
  product?: Product;
  productName?: string;
  quantity: number;
  total: number;
}

const SalesStatsTab = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const { dateRange, setDateRange } = useDateRange();
  const [startDate, endDate] = dateRange;
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

  const fetchSales = async () => {
    try {
      const startOfDayLocal = startOfDay(startDate!);
      const endOfDayLocal = endOfDay(endDate!);

      console.log("inicio", startOfDayLocal!.toISOString());
      console.log("fin", endOfDayLocal!.toISOString());

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

      setSales(adjustedSales);
      console.log(adjustedSales);
    } catch (error) {
      console.error("Error al obtener ventas:", error);
      // Opcional: Mostrar notificación al usuario
      alert("Error al cargar ventas. Intente nuevamente.");
    }
  };

  // Estadísticas calculadas
  const totalSales = sales.reduce((acc, sale) => acc + sale.total, 0);
  const averageSale = sales.length > 0 ? totalSales / sales.length : 0;
  const largestSale = sales.reduce((max, sale) => Math.max(max, sale.total), 0);

  // Productos más vendidos
  const productStats: ProductStat[] = [];
  sales.forEach((sale) => {
    sale.items.forEach((item) => {
      const existingStat = productStats.find(
        (stat) =>
          stat.product?.id === item.product_id ||
          stat.productName === item.product_name
      );
      if (existingStat) {
        existingStat.quantity += item.quantity;
        existingStat.total += item.subtotal;
      } else {
        productStats.push({
          product: getProductWithId(item.product_id ?? 0),
          productName: item.product_name,
          quantity: item.quantity,
          total: item.subtotal,
        });
      }
    });
  });

  const topProducts = [...productStats]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const topRevenueProducts = [...productStats]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return (
    <div className="w-2/3 bg-[#007566] p-6 flex flex-col justify-between overflow-y-auto">
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

        <div className="grid grid-cols-2 gap-4 text-white">
          <div className="bg-white/10 p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <BarChart3 size={24} />
              <h3 className="text-lg font-medium">Ingresos totales</h3>
            </div>
            <p className="text-3xl font-bold">
              {formatCurrencyChile(totalSales)}
            </p>
          </div>

          <div className="bg-white/10 p-6 rounded-l">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp size={24} />
              <h3 className="text-lg font-medium">Venta promedio</h3>
            </div>
            <p className="text-3xl font-bold">
              {formatCurrencyChile(averageSale)}
            </p>
          </div>

          <div className="bg-white/10 p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Package size={24} />
              <h3 className="text-lg font-medium">Total productos</h3>
            </div>
            <p className="text-3xl font-bold">
              {sales.reduce(
                (acc, sale) =>
                  acc +
                  sale.items.reduce((sum, item) => sum + item.quantity, 0),
                0
              )}
            </p>
          </div>

          <div className="bg-white/10 p-6 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <DollarSign size={24} />
              <h3 className="text-lg font-medium">Venta más alta</h3>
            </div>
            <p className="text-3xl font-bold">
              {formatCurrencyChile(largestSale)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 text-white">
          <div className="bg-white/10 p-6 rounded-lg">
            <h3 className="text-xl font-medium mb-4">Productos más vendidos</h3>
            <div className="space-y-4">
              {topProducts.map((stat, index) => (
                <div key={index} className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-white/50">
                    #{index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">
                      {stat.productName ||
                        stat.product?.name ||
                        "Producto Temporal"}
                    </p>
                    <p className="text-sm text-white/70">
                      {`${stat.quantity} ${stat.quantity > 1 ? "unidades" : "unidad"
                        }`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/10 p-6 rounded-lg">
            <h3 className="text-xl font-medium mb-4">Mayor ingreso</h3>
            <div className="space-y-4">
              {topRevenueProducts.map((stat, index) => (
                <div key={index} className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-white/50">
                    #{index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">
                      {stat.productName ||
                        stat.product?.name ||
                        "Producto Temporal"}
                    </p>
                    <p className="text-sm text-white/70">
                      {formatCurrencyChile(stat.total)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesStatsTab;
