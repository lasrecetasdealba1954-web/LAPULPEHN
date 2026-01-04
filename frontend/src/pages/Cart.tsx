import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../stores/cartStore';
import { useAuthStore } from '../stores/authStore';
import { orderApi } from '../lib/api';
import toast from 'react-hot-toast';
import {
  TrashIcon,
  MinusIcon,
  PlusIcon,
  ShoppingCartIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';

export default function Cart() {
  const { items, removeItem, updateQuantity, clearCart, getTotal, getItemsByPulperia } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [phone, setPhone] = useState(user?.phone || '');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const itemsByPulperia = getItemsByPulperia();
  const total = getTotal();

  const handleCheckout = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!phone) {
      toast.error('Por favor ingresa tu número de teléfono');
      return;
    }

    setSubmitting(true);
    try {
      const orderItems = items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      const res = await orderApi.create({
        items: orderItems,
        customerPhone: phone,
        customerNote: note || undefined,
      });

      toast.success('¡Orden enviada!');
      clearCart();
      navigate('/mis-ordenes');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <ShoppingCartIcon className="w-16 h-16 mx-auto text-gray-600 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Tu carrito está vacío</h2>
        <p className="text-gray-400 mb-6">Agrega productos para comenzar</p>
        <Link to="/explorar" className="btn-primary inline-block">
          Explorar productos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Carrito de compras</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-6">
          {Object.entries(itemsByPulperia).map(([pulperiaId, pulperiaItems]) => (
            <div key={pulperiaId} className="card">
              {/* Pulperia Header */}
              <div className="flex items-center space-x-2 pb-4 border-b border-gray-700 mb-4">
                <BuildingStorefrontIcon className="w-5 h-5 text-pulpe-red" />
                <Link
                  to={`/pulperia/${pulperiaId}`}
                  className="font-semibold hover:text-pulpe-red transition-colors"
                >
                  {pulperiaItems[0].pulperiaName}
                </Link>
              </div>

              {/* Items */}
              <div className="space-y-4">
                {pulperiaItems.map((item) => (
                  <div key={item.productId} className="flex items-center space-x-4">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />

                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{item.name}</h3>
                      <p className="text-pulpe-gold font-semibold">
                        L{item.price.toFixed(2)}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="p-1 bg-pulpe-dark rounded hover:bg-gray-700"
                      >
                        <MinusIcon className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="p-1 bg-pulpe-dark rounded hover:bg-gray-700"
                      >
                        <PlusIcon className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold">
                        L{(item.price * item.quantity).toFixed(2)}
                      </p>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Subtotal */}
              <div className="pt-4 border-t border-gray-700 mt-4 flex justify-between text-sm">
                <span className="text-gray-400">Subtotal</span>
                <span className="font-semibold">
                  L{pulperiaItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card sticky top-24">
            <h2 className="text-xl font-bold mb-4">Resumen del pedido</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Teléfono de contacto *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+504 9999-9999"
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Nota (opcional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Instrucciones especiales..."
                  className="input min-h-[80px]"
                />
              </div>
            </div>

            <div className="border-t border-gray-700 pt-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Artículos ({items.length})</span>
                <span>L{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-pulpe-gold">L{total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={submitting || items.length === 0}
              className="btn-primary w-full mt-6"
            >
              {submitting ? (
                <span className="spinner" />
              ) : user ? (
                'Realizar pedido'
              ) : (
                'Iniciar sesión para ordenar'
              )}
            </button>

            <p className="text-xs text-gray-500 mt-4 text-center">
              Las órdenes se enviarán a cada pulpería por separado
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
