import { useState, useEffect, useCallback } from 'react';
import { orderApi } from '../../lib/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardDocumentListIcon,
  CheckIcon,
  XMarkIcon,
  TruckIcon,
  SparklesIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: 'Nueva', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  ACCEPTED: { label: 'En preparación', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  READY: { label: 'Lista', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  DELIVERED: { label: 'Entregada', color: 'text-gray-400', bgColor: 'bg-gray-500/20' },
  CANCELLED: { label: 'Cancelada', color: 'text-red-400', bgColor: 'bg-red-500/20' },
};

export default function PulperiaOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const fetchOrders = useCallback(async () => {
    try {
      const res = await orderApi.getPulperiaOrders(
        filter !== 'all' ? { status: filter } : undefined
      );
      setOrders(res.data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchOrders();
    // Poll for new orders every 30 seconds
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleAccept = async (orderId: string) => {
    try {
      await orderApi.accept(orderId);
      toast.success('Orden aceptada');
      fetchOrders();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleReady = async (orderId: string) => {
    try {
      await orderApi.ready(orderId);
      toast.success('Orden marcada como lista');
      fetchOrders();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelivered = async (orderId: string) => {
    try {
      await orderApi.delivered(orderId);
      toast.success('Orden entregada');
      fetchOrders();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleCancel = async (orderId: string) => {
    const reason = prompt('Razón de cancelación (opcional):');
    try {
      await orderApi.cancel(orderId, reason || undefined);
      toast.success('Orden cancelada');
      fetchOrders();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const pendingOrders = orders.filter((o) => o.status === 'PENDING');
  const activeOrders = orders.filter((o) => ['ACCEPTED', 'READY'].includes(o.status));
  const completedOrders = orders.filter((o) => ['DELIVERED', 'CANCELLED'].includes(o.status));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Órdenes</h1>
          <p className="text-gray-400">Gestiona los pedidos de tu pulpería</p>
        </div>

        {/* Filter */}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input max-w-xs"
        >
          <option value="all">Todas</option>
          <option value="PENDING">Pendientes</option>
          <option value="ACCEPTED">En preparación</option>
          <option value="READY">Listas</option>
          <option value="DELIVERED">Entregadas</option>
          <option value="CANCELLED">Canceladas</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="spinner" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardDocumentListIcon className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <h2 className="text-2xl font-bold mb-2">No hay órdenes</h2>
          <p className="text-gray-400">Las órdenes aparecerán aquí cuando las recibas</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Pending Orders - Game Style */}
          {pendingOrders.length > 0 && (
            <section>
              <div className="flex items-center space-x-2 mb-4">
                <SparklesIcon className="w-6 h-6 text-pulpe-gold animate-pulse" />
                <h2 className="text-xl font-bold text-pulpe-gold">
                  ¡Nuevas órdenes! ({pendingOrders.length})
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence>
                  {pendingOrders.map((order) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="order-card new rounded-xl p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="font-mono text-lg font-bold">
                            {order.orderNumber}
                          </span>
                          <p className="text-sm text-gray-400">
                            {new Date(order.createdAt).toLocaleTimeString('es-HN')}
                          </p>
                        </div>
                        <span className="text-2xl font-bold text-pulpe-gold">
                          L{order.totalAmount.toFixed(2)}
                        </span>
                      </div>

                      {/* Customer */}
                      <div className="flex items-center space-x-2 mb-3 text-sm">
                        <span className="text-gray-400">{order.customer.name}</span>
                        {order.customerPhone && (
                          <a
                            href={`tel:${order.customerPhone}`}
                            className="flex items-center space-x-1 text-pulpe-red"
                          >
                            <PhoneIcon className="w-4 h-4" />
                          </a>
                        )}
                      </div>

                      {/* Items */}
                      <div className="space-y-1 mb-4">
                        {order.items.map((item: any) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>
                              {item.quantity}x {item.product.name}
                            </span>
                            <span className="text-gray-400">
                              L{item.subtotal.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {order.customerNote && (
                        <p className="text-sm text-gray-400 italic mb-4">
                          "{order.customerNote}"
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAccept(order.id)}
                          className="flex-1 btn-primary flex items-center justify-center space-x-2"
                        >
                          <CheckIcon className="w-5 h-5" />
                          <span>Aceptar</span>
                        </button>
                        <button
                          onClick={() => handleCancel(order.id)}
                          className="btn-secondary px-4"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}

          {/* Active Orders */}
          {activeOrders.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-4">En proceso ({activeOrders.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeOrders.map((order) => {
                  const status = statusConfig[order.status];
                  return (
                    <div key={order.id} className="card">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="font-mono">{order.orderNumber}</span>
                          <span className={`ml-2 badge ${status.bgColor} ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                        <span className="font-bold text-pulpe-gold">
                          L{order.totalAmount.toFixed(2)}
                        </span>
                      </div>

                      <div className="space-y-1 mb-4 text-sm">
                        {order.items.map((item: any) => (
                          <div key={item.id} className="flex justify-between">
                            <span>
                              {item.quantity}x {item.product.name}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex space-x-2">
                        {order.status === 'ACCEPTED' && (
                          <button
                            onClick={() => handleReady(order.id)}
                            className="flex-1 btn-gold flex items-center justify-center space-x-2"
                          >
                            <TruckIcon className="w-5 h-5" />
                            <span>Lista para recoger</span>
                          </button>
                        )}
                        {order.status === 'READY' && (
                          <button
                            onClick={() => handleDelivered(order.id)}
                            className="flex-1 btn-primary flex items-center justify-center space-x-2"
                          >
                            <CheckIcon className="w-5 h-5" />
                            <span>Entregada</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleCancel(order.id)}
                          className="btn-secondary px-4"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Completed Orders */}
          {completedOrders.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-4">Completadas ({completedOrders.length})</h2>
              <div className="space-y-2">
                {completedOrders.slice(0, 10).map((order) => {
                  const status = statusConfig[order.status];
                  return (
                    <div
                      key={order.id}
                      className="card p-3 flex items-center justify-between opacity-60"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="font-mono text-sm">{order.orderNumber}</span>
                        <span className={`badge ${status.bgColor} ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <span className="text-sm">L{order.totalAmount.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
