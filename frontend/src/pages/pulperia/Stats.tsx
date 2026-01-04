import { useState, useEffect } from 'react';
import { statsApi } from '../../lib/api';
import toast from 'react-hot-toast';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  ClipboardDocumentListIcon,
  StarIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

export default function PulperiaStats() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchStats();
  }, [dateRange]);

  const fetchStats = async () => {
    try {
      const params: any = {};
      if (dateRange.from) params.from = dateRange.from;
      if (dateRange.to) params.to = dateRange.to;

      const res = await statsApi.getPulperiaStats(Object.keys(params).length > 0 ? params : undefined);
      setStats(res.data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type: 'orders' | 'products' | 'reviews', format: 'json' | 'csv') => {
    setExporting(true);
    try {
      const res = await statsApi.exportData(type, format, dateRange);

      if (format === 'csv') {
        const blob = new Blob([res.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}-${Date.now()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}-${Date.now()}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }

      toast.success('Datos exportados');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <ChartBarIcon className="w-8 h-8 text-pulpe-gold" />
            <span>Centro de Mando</span>
          </h1>
          <p className="text-gray-400">Estadísticas detalladas de tu negocio</p>
        </div>

        {/* Date Range */}
        <div className="flex items-center space-x-2">
          <CalendarIcon className="w-5 h-5 text-gray-400" />
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            className="input py-1"
          />
          <span className="text-gray-400">-</span>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            className="input py-1"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 border-l-4 border-pulpe-gold">
          <div className="flex items-center space-x-3">
            <CurrencyDollarIcon className="w-8 h-8 text-pulpe-gold" />
            <div>
              <p className="text-sm text-gray-400">Ingresos Totales</p>
              <p className="text-2xl font-bold text-pulpe-gold">
                L{stats?.summary?.totalRevenue?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-4 border-l-4 border-pulpe-red">
          <div className="flex items-center space-x-3">
            <ClipboardDocumentListIcon className="w-8 h-8 text-pulpe-red" />
            <div>
              <p className="text-sm text-gray-400">Órdenes Completadas</p>
              <p className="text-2xl font-bold">{stats?.summary?.totalOrders || 0}</p>
            </div>
          </div>
        </div>

        <div className="card p-4 border-l-4 border-green-500">
          <div className="flex items-center space-x-3">
            <ShoppingBagIcon className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-400">Productos Activos</p>
              <p className="text-2xl font-bold">
                {stats?.summary?.availableProducts || 0} / {stats?.summary?.totalProducts || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-4 border-l-4 border-yellow-500">
          <div className="flex items-center space-x-3">
            <StarIcon className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="text-sm text-gray-400">Calificación</p>
              <p className="text-2xl font-bold">
                {stats?.summary?.rating?.toFixed(1) || '0.0'}
                <span className="text-sm text-gray-400 ml-1">
                  ({stats?.summary?.totalReviews || 0})
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Orders by Status */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Estado de Órdenes</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {stats?.ordersByStatus?.map((status: any) => (
            <div key={status.status} className="text-center p-4 bg-pulpe-dark/50 rounded-lg">
              <p className="text-2xl font-bold">{status.count}</p>
              <p className="text-sm text-gray-400">{status.status}</p>
              <p className="text-xs text-pulpe-gold mt-1">
                L{status.totalAmount?.toFixed(2) || '0.00'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Products */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Productos Más Vendidos</h2>
        {stats?.topProducts?.length > 0 ? (
          <div className="space-y-3">
            {stats.topProducts.map((item: any, index: number) => (
              <div
                key={item.product?.id || index}
                className="flex items-center space-x-4 p-3 bg-pulpe-dark/50 rounded-lg"
              >
                <span className="text-2xl font-bold text-pulpe-gold w-8">#{index + 1}</span>
                {item.product?.imageUrl && (
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <p className="font-semibold">{item.product?.name || 'Producto eliminado'}</p>
                  <p className="text-sm text-gray-400">
                    {item.totalSold} vendidos · {item.orderCount} órdenes
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-pulpe-gold">
                    L{item.totalRevenue?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">No hay ventas registradas</p>
        )}
      </div>

      {/* Reviews Distribution */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Distribución de Reseñas</h2>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count =
              stats?.reviews?.distribution?.find((r: any) => r.rating === rating)?.count || 0;
            const total = stats?.reviews?.total || 1;
            const percentage = (count / total) * 100;

            return (
              <div key={rating} className="flex items-center space-x-3">
                <div className="flex items-center space-x-1 w-16">
                  <span>{rating}</span>
                  <StarIcon className="w-4 h-4 text-pulpe-gold" />
                </div>
                <div className="flex-1 h-4 bg-pulpe-dark rounded-full overflow-hidden">
                  <div
                    className="h-full bg-pulpe-gold rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-400 w-12">{count}</span>
              </div>
            );
          })}
        </div>
        <p className="text-center text-gray-400 mt-4">
          Promedio: {stats?.reviews?.average?.toFixed(1) || '0.0'} ★
        </p>
      </div>

      {/* Export Options */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Exportar Datos</h2>
        <p className="text-gray-400 mb-4">
          Descarga tus datos en formato CSV (Excel) o JSON
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-pulpe-dark/50 rounded-lg">
            <h3 className="font-semibold mb-3">Órdenes</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => handleExport('orders', 'csv')}
                disabled={exporting}
                className="btn-secondary flex-1 text-sm"
              >
                <ArrowDownTrayIcon className="w-4 h-4 mr-1 inline" />
                CSV
              </button>
              <button
                onClick={() => handleExport('orders', 'json')}
                disabled={exporting}
                className="btn-secondary flex-1 text-sm"
              >
                <ArrowDownTrayIcon className="w-4 h-4 mr-1 inline" />
                JSON
              </button>
            </div>
          </div>

          <div className="p-4 bg-pulpe-dark/50 rounded-lg">
            <h3 className="font-semibold mb-3">Productos</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => handleExport('products', 'csv')}
                disabled={exporting}
                className="btn-secondary flex-1 text-sm"
              >
                <ArrowDownTrayIcon className="w-4 h-4 mr-1 inline" />
                CSV
              </button>
              <button
                onClick={() => handleExport('products', 'json')}
                disabled={exporting}
                className="btn-secondary flex-1 text-sm"
              >
                <ArrowDownTrayIcon className="w-4 h-4 mr-1 inline" />
                JSON
              </button>
            </div>
          </div>

          <div className="p-4 bg-pulpe-dark/50 rounded-lg">
            <h3 className="font-semibold mb-3">Reseñas</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => handleExport('reviews', 'csv')}
                disabled={exporting}
                className="btn-secondary flex-1 text-sm"
              >
                <ArrowDownTrayIcon className="w-4 h-4 mr-1 inline" />
                CSV
              </button>
              <button
                onClick={() => handleExport('reviews', 'json')}
                disabled={exporting}
                className="btn-secondary flex-1 text-sm"
              >
                <ArrowDownTrayIcon className="w-4 h-4 mr-1 inline" />
                JSON
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
