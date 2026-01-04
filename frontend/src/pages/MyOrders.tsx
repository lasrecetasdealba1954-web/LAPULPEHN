import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderApi } from '../lib/api';
import toast from 'react-hot-toast';
import {
  ClipboardDocumentListIcon,
  BuildingStorefrontIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: 'Pendiente', color: 'badge-pending', icon: ClockIcon },
  ACCEPTED: { label: 'Aceptada', color: 'badge-accepted', icon: CheckCircleIcon },
  PREPARING: { label: 'En preparación', color: 'badge-accepted', icon: ClockIcon },
  READY: { label: 'Lista', color: 'badge-ready', icon: TruckIcon },
  DELIVERED: { label: 'Entregada', color: 'badge-delivered', icon: CheckCircleIcon },
  CANCELLED: { label: 'Cancelada', color: 'badge-cancelled', icon: XCircleIcon },
};

export default function MyOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await orderApi.getMyOrders();
      setOrders(res.data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (orderId: string) => {
    if (!confirm('¿Estás seguro de cancelar esta orden?')) return;

    try {
      await orderApi.cancel(orderId);
      toast.success('Orden cancelada');
      fetchOrders();
    } catch (error: any) {
      toast.error(error.message);
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
      <h1 className="text-3xl font-bold">Mis Ordenes</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardDocumentListIcon className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <h2 className="text-2xl font-bold mb-2">No tienes órdenes</h2>
          <p className="text-gray-400 mb-6">Explora productos y haz tu primera compra</p>
          <Link to="/explorar" className="btn-primary inline-block">
            Explorar productos
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = statusConfig[order.status];
            const StatusIcon = status.icon;

            return (
              <div key={order.id} className="card">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-gray-700 mb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-lg">{order.orderNumber}</span>
                      <span className={`badge ${status.color}`}>
                        <StatusIcon className="w-4 h-4 mr-1" />
                        {status.label}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-400 mt-1">
                      <BuildingStorefrontIcon className="w-4 h-4" />
                      <Link
                        to={`/pulperia/${order.pulperia.id}`}
                        className="hover:text-pulpe-red"
                      >
                        {order.pulperia.name}
                      </Link>
                    </div>
                  </div>

                  <div className="text-right mt-2 sm:mt-0">
                    <p className="text-2xl font-bold text-pulpe-gold">
                      L{order.totalAmount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleString('es-HN')}
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2 mb-4">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="flex items-center space-x-3">
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1">
                        <span className="text-sm">{item.product.name}</span>
                        <span className="text-gray-500 text-sm ml-2">x{item.quantity}</span>
                      </div>
                      <span className="text-sm">L{item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                {['PENDING', 'ACCEPTED'].includes(order.status) && (
                  <div className="pt-4 border-t border-gray-700 flex justify-end">
                    <button
                      onClick={() => handleCancel(order.id)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Cancelar orden
                    </button>
                  </div>
                )}

                {/* Status Timeline */}
                {order.status !== 'CANCELLED' && (
                  <div className="pt-4 border-t border-gray-700 mt-4">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className={order.status !== 'CANCELLED' ? 'text-green-400' : ''}>
                        <ClockIcon className="w-4 h-4 mx-auto mb-1" />
                        <span>Recibida</span>
                      </div>
                      <div className="flex-1 h-px bg-gray-700 mx-2" />
                      <div className={['ACCEPTED', 'READY', 'DELIVERED'].includes(order.status) ? 'text-green-400' : ''}>
                        <CheckCircleIcon className="w-4 h-4 mx-auto mb-1" />
                        <span>Aceptada</span>
                      </div>
                      <div className="flex-1 h-px bg-gray-700 mx-2" />
                      <div className={['READY', 'DELIVERED'].includes(order.status) ? 'text-green-400' : ''}>
                        <TruckIcon className="w-4 h-4 mx-auto mb-1" />
                        <span>Lista</span>
                      </div>
                      <div className="flex-1 h-px bg-gray-700 mx-2" />
                      <div className={order.status === 'DELIVERED' ? 'text-green-400' : ''}>
                        <CheckCircleIcon className="w-4 h-4 mx-auto mb-1" />
                        <span>Entregada</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
