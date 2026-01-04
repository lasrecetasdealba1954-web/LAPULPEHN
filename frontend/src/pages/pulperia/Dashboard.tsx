import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { statsApi, orderApi } from '../../lib/api';
import toast from 'react-hot-toast';
import {
  ShoppingBagIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  StarIcon,
  ChartBarIcon,
  BriefcaseIcon,
  Cog6ToothIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

export default function PulperiaDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        statsApi.getPulperiaStats(),
        orderApi.getPulperiaOrders(),
      ]);
      setStats(statsRes.data);
      setRecentOrders(ordersRes.data.slice(0, 5));
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
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
          <h1 className="text-3xl font-bold">Mi Pulpería</h1>
          <p className="text-gray-400">Bienvenido, {user?.name}</p>
        </div>
        <Link to="/mi-pulperia/configuracion" className="btn-secondary flex items-center space-x-2">
          <Cog6ToothIcon className="w-5 h-5" />
          <span>Configuración</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-pulpe-gold/20 rounded-lg flex items-center justify-center">
              <CurrencyDollarIcon className="w-5 h-5 text-pulpe-gold" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Ingresos</p>
              <p className="text-xl font-bold text-pulpe-gold">
                L{stats?.summary?.totalRevenue?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-pulpe-red/20 rounded-lg flex items-center justify-center">
              <ClipboardDocumentListIcon className="w-5 h-5 text-pulpe-red" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Órdenes</p>
              <p className="text-xl font-bold">{stats?.summary?.totalOrders || 0}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <ShoppingBagIcon className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Productos</p>
              <p className="text-xl font-bold">{stats?.summary?.totalProducts || 0}</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <StarIcon className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Calificación</p>
              <p className="text-xl font-bold">{stats?.summary?.rating?.toFixed(1) || '0.0'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/mi-pulperia/ordenes"
          className="card p-6 flex items-center justify-between group hover:border-pulpe-red"
        >
          <div className="flex items-center space-x-4">
            <ClipboardDocumentListIcon className="w-8 h-8 text-pulpe-red" />
            <div>
              <h3 className="font-semibold">Órdenes</h3>
              <p className="text-sm text-gray-400">Gestiona tus pedidos</p>
            </div>
          </div>
          <ArrowRightIcon className="w-5 h-5 text-gray-500 group-hover:text-pulpe-red transition-colors" />
        </Link>

        <Link
          to="/mi-pulperia/productos"
          className="card p-6 flex items-center justify-between group hover:border-pulpe-red"
        >
          <div className="flex items-center space-x-4">
            <ShoppingBagIcon className="w-8 h-8 text-green-500" />
            <div>
              <h3 className="font-semibold">Productos</h3>
              <p className="text-sm text-gray-400">Administra tu inventario</p>
            </div>
          </div>
          <ArrowRightIcon className="w-5 h-5 text-gray-500 group-hover:text-pulpe-red transition-colors" />
        </Link>

        <Link
          to="/mi-pulperia/centro-de-mando"
          className="card p-6 flex items-center justify-between group hover:border-pulpe-red"
        >
          <div className="flex items-center space-x-4">
            <ChartBarIcon className="w-8 h-8 text-pulpe-gold" />
            <div>
              <h3 className="font-semibold">Centro de Mando</h3>
              <p className="text-sm text-gray-400">Estadísticas detalladas</p>
            </div>
          </div>
          <ArrowRightIcon className="w-5 h-5 text-gray-500 group-hover:text-pulpe-red transition-colors" />
        </Link>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Órdenes Recientes</h2>
          <Link to="/mi-pulperia/ordenes" className="text-pulpe-red hover:underline text-sm">
            Ver todas
          </Link>
        </div>

        {recentOrders.length > 0 ? (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 bg-pulpe-dark/50 rounded-lg"
              >
                <div>
                  <span className="font-mono text-sm">{order.orderNumber}</span>
                  <p className="text-sm text-gray-400">{order.customer.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-pulpe-gold">
                    L{order.totalAmount.toFixed(2)}
                  </p>
                  <span
                    className={`badge text-xs ${
                      order.status === 'PENDING'
                        ? 'badge-pending'
                        : order.status === 'ACCEPTED'
                        ? 'badge-accepted'
                        : order.status === 'READY'
                        ? 'badge-ready'
                        : order.status === 'DELIVERED'
                        ? 'badge-delivered'
                        : 'badge-cancelled'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">No hay órdenes recientes</p>
        )}
      </div>
    </div>
  );
}
