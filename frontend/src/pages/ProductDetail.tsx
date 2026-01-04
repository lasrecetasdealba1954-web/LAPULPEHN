import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productApi } from '../lib/api';
import { useCartStore } from '../stores/cartStore';
import toast from 'react-hot-toast';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';
import {
  ShoppingCartIcon,
  MinusIcon,
  PlusIcon,
  StarIcon,
  MapPinIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCartStore();

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await productApi.getOne(id!);
      setProduct(res.data);
    } catch (error) {
      toast.error('Error cargando producto');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product.pulperia.isOpen) {
      toast.error('Esta pulpería está cerrada');
      return;
    }

    if (!product.isAvailable) {
      toast.error('Producto no disponible');
      return;
    }

    for (let i = 0; i < quantity; i++) {
      addItem({
        productId: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        pulperiaId: product.pulperia.id,
        pulperiaName: product.pulperia.name,
      });
    }

    toast.success(`${quantity} x ${product.name} agregado al carrito`);
    setQuantity(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="spinner" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Producto no encontrado</p>
        <Link to="/explorar" className="text-pulpe-red hover:underline mt-2 inline-block">
          Volver a explorar
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => window.history.back()}
        className="flex items-center space-x-2 text-gray-400 hover:text-white"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        <span>Volver</span>
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="card p-4">
          <Zoom>
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full aspect-square object-contain rounded-lg cursor-zoom-in"
            />
          </Zoom>
        </div>

        {/* Info */}
        <div className="space-y-6">
          {/* Category */}
          {product.category && (
            <span className="badge bg-pulpe-red/20 text-pulpe-red">
              {product.category}
            </span>
          )}

          <h1 className="text-3xl font-bold">{product.name}</h1>

          {/* Price */}
          <div className="text-4xl font-bold text-pulpe-gold">
            L{product.price.toFixed(2)}
          </div>

          {/* Availability */}
          <div className="flex items-center space-x-4">
            <span
              className={`badge ${
                product.isAvailable
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {product.isAvailable ? 'Disponible' : 'Agotado'}
            </span>

            {product.stock !== null && (
              <span className="text-sm text-gray-400">
                {product.stock} unidades en stock
              </span>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div>
              <h3 className="font-semibold mb-2">Descripción</h3>
              <p className="text-gray-400">{product.description}</p>
            </div>
          )}

          {/* Quantity and Add to Cart */}
          <div className="card p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Cantidad</span>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 bg-pulpe-dark rounded-lg hover:bg-gray-700"
                >
                  <MinusIcon className="w-5 h-5" />
                </button>
                <span className="w-12 text-center text-lg font-semibold">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 bg-pulpe-dark rounded-lg hover:bg-gray-700"
                >
                  <PlusIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-lg">
              <span className="text-gray-400">Total</span>
              <span className="font-bold text-pulpe-gold">
                L{(product.price * quantity).toFixed(2)}
              </span>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!product.isAvailable || !product.pulperia.isOpen}
              className="btn-primary w-full flex items-center justify-center space-x-2 py-3"
            >
              <ShoppingCartIcon className="w-5 h-5" />
              <span>Agregar al carrito</span>
            </button>
          </div>

          {/* Pulperia Info */}
          <Link to={`/pulperia/${product.pulperia.id}`} className="card p-4 block hover:border-pulpe-red transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Vendido por</p>
                <h3 className="font-semibold">{product.pulperia.name}</h3>
                <div className="flex items-center space-x-2 mt-1 text-sm text-gray-400">
                  <StarIcon className="w-4 h-4 text-pulpe-gold" />
                  <span>{product.pulperia.rating?.toFixed(1) || '0.0'}</span>
                </div>
              </div>

              <div className="text-right">
                <span
                  className={`badge ${
                    product.pulperia.isOpen
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}
                >
                  {product.pulperia.isOpen ? 'Abierto' : 'Cerrado'}
                </span>
                <div className="flex items-center space-x-1 mt-2 text-sm text-gray-400">
                  <MapPinIcon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate max-w-[150px]">{product.pulperia.address}</span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
