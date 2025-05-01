import React, { useState } from 'react';
import { BarChart3, TrendingUp, Package, DollarSign, Calendar, ChevronDown } from 'lucide-react';
import { Sale, Product } from '../types';

interface ProductStat {
  product: Product;
  quantity: number;
  total: number;
}

const SalesStatsTab = () => {
  const [dateFilter, setDateFilter] = useState<'day' | 'month' | 'year'>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const sales: Sale[] = []; // Aquí se cargarían las ventas según el filtro

  // Estadísticas calculadas
  const totalRevenue = sales.reduce((acc, sale) => acc + sale.total, 0);
  const averageSale = sales.length > 0 ? totalRevenue / sales.length : 0;
  const largestSale = sales.reduce((max, sale) => Math.max(max, sale.total), 0);

  const formatDate = (date: Date) => {
    switch (dateFilter) {
      case 'day':
        return date.toLocaleDateString();
      case 'month':
        return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      case 'year':
        return date.getFullYear().toString();
    }
  };

  const handlePreviousDate = () => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      switch (dateFilter) {
        case 'day':
          newDate.setDate(prev.getDate() - 1);
          break;
        case 'month':
          newDate.setMonth(prev.getMonth() - 1);
          break;
        case 'year':
          newDate.setFullYear(prev.getFullYear() - 1);
          break;
      }
      return newDate;
    });
  };

  const handleNextDate = () => {
    setSelectedDate(prev => {
      const newDate = new Date(prev);
      switch (dateFilter) {
        case 'day':
          newDate.setDate(prev.getDate() + 1);
          break;
        case 'month':
          newDate.setMonth(prev.getMonth() + 1);
          break;
        case 'year':
          newDate.setFullYear(prev.getFullYear() + 1);
          break;
      }
      return newDate;
    });
  };

  // Productos más vendidos
  const productStats: ProductStat[] = [];
  sales.forEach(sale => {
/*     salesItems.forEach(item => {
      const existingStat = productStats.find(stat => stat.product.id === item.id);
      if (existingStat) {
        existingStat.quantity += item.quantity;
        existingStat.total += item.subtotal;
      } else {
        productStats.push({
          product: item,
          quantity: item.quantity,
          total: item.subtotal
        });
      }
    }); */
  });

  const topProducts = [...productStats]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const topRevenueProducts = [...productStats]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white/10 p-4 rounded-lg">
        <div className="flex items-center gap-4">
          <Calendar size={24} className="text-white/80" />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as 'day' | 'month' | 'year')}
            className="bg-transparent text-white border border-white/20 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-white/30"
          >
            <option value="day" className="text-gray-900">Por día</option>
            <option value="month" className="text-gray-900">Por mes</option>
            <option value="year" className="text-gray-900">Por año</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreviousDate}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronDown size={20} className="rotate-90" />
          </button>
          <span className="text-lg font-medium min-w-[150px] text-center">
            {formatDate(selectedDate)}
          </span>
          <button
            onClick={handleNextDate}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronDown size={20} className="-rotate-90" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/10 p-6 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <BarChart3 size={24} className="text-white/80" />
            <h3 className="text-lg font-medium">Ingresos totales</h3>
          </div>
          <p className="text-3xl font-bold">${totalRevenue.toFixed(2)}</p>
        </div>

        <div className="bg-white/10 p-6 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp size={24} className="text-white/80" />
            <h3 className="text-lg font-medium">Venta promedio</h3>
          </div>
          <p className="text-3xl font-bold">${averageSale.toFixed(2)}</p>
        </div>

        <div className="bg-white/10 p-6 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <Package size={24} className="text-white/80" />
            <h3 className="text-lg font-medium">Total productos</h3>
          </div>
          <p className="text-3xl font-bold">
{/*             {sales.reduce((acc, sale) => acc + sale.items.reduce((sum, item) => sum + item.quantity, 0), 0)} */}
          </p>
        </div>

        <div className="bg-white/10 p-6 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <DollarSign size={24} className="text-white/80" />
            <h3 className="text-lg font-medium">Venta más alta</h3>
          </div>
          <p className="text-3xl font-bold">${largestSale.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white/10 p-6 rounded-lg">
          <h3 className="text-xl font-medium mb-4">Productos más vendidos</h3>
          <div className="space-y-4">
            {topProducts.map((stat, index) => (
              <div key={stat.product.id} className="flex items-center gap-4">
                <span className="text-2xl font-bold text-white/50">#{index + 1}</span>
                <div className="flex-1">
                  <p className="font-medium">{stat.product.name}</p>
                  <p className="text-sm text-white/70">{stat.quantity} unidades</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/10 p-6 rounded-lg">
          <h3 className="text-xl font-medium mb-4">Mayor ingreso</h3>
          <div className="space-y-4">
            {topRevenueProducts.map((stat, index) => (
              <div key={stat.product.id} className="flex items-center gap-4">
                <span className="text-2xl font-bold text-white/50">#{index + 1}</span>
                <div className="flex-1">
                  <p className="font-medium">{stat.product.name}</p>
                  <p className="text-sm text-white/70">${stat.total.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesStatsTab;