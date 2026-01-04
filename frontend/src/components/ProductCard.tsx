import { Link } from 'react-router-dom';
import { ShoppingCartIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useCartStore } from '../stores/cartStore';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  description?: string;
  category?: string;
  isAvailable: boolean;
  pulperia: {
    id: string;
    name: string;
    isOpen: boolean;
  };
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!product.pulperia.isOpen) {
      toast.error('Esta pulpería está cerrada');
      return;
    }

    if (!product.isAvailable) {
      toast.error('Producto no disponible');
      return;
    }

    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      pulperiaId: product.pulperia.id,
      pulperiaName: product.pulperia.name,
    });

    toast.success('Agregado al carrito');
  };

  return (
    <Link
      to={`/producto/${product.id}`}
      className="card-glow group block overflow-hidden"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden rounded-lg mb-3">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col space-y-1">
          {!product.isAvailable && (
            <span className="badge bg-red-500/80 text-white">Agotado</span>
          )}
          {!product.pulperia.isOpen && (
            <span className="badge bg-gray-500/80 text-white">Cerrado</span>
          )}
          {product.category && (
            <span className="badge bg-pulpe-dark/80 text-gray-300">{product.category}</span>
          )}
        </div>

        {/* Add to cart button */}
        {product.isAvailable && product.pulperia.isOpen && (
          <button
            onClick={handleAddToCart}
            className="absolute bottom-2 right-2 p-2 bg-pulpe-red rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
          >
            <PlusIcon className="w-5 h-5 text-white" />
          </button>
        )}
      </div>

      {/* Info */}
      <div>
        <h3 className="font-semibold text-white truncate group-hover:text-pulpe-red transition-colors">
          {product.name}
        </h3>
        <p className="text-sm text-gray-400 truncate">{product.pulperia.name}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-lg font-bold text-pulpe-gold">
            L{product.price.toFixed(2)}
          </span>
          <button
            onClick={handleAddToCart}
            disabled={!product.isAvailable || !product.pulperia.isOpen}
            className="flex items-center space-x-1 text-sm text-pulpe-red hover:text-red-400 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            <ShoppingCartIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Agregar</span>
          </button>
        </div>
      </div>
    </Link>
  );
}
