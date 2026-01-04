import { Link } from 'react-router-dom';
import { StarIcon, MapPinIcon } from '@heroicons/react/24/solid';
import { ShoppingBagIcon } from '@heroicons/react/24/outline';

interface Pulperia {
  id: string;
  name: string;
  description?: string;
  address: string;
  imageUrl?: string;
  rating: number;
  totalReviews: number;
  isOpen: boolean;
  _count?: {
    products: number;
    reviews: number;
  };
}

interface PulperiaCardProps {
  pulperia: Pulperia;
}

export default function PulperiaCard({ pulperia }: PulperiaCardProps) {
  return (
    <Link
      to={`/pulperia/${pulperia.id}`}
      className="card-glow group block overflow-hidden"
    >
      {/* Image */}
      <div className="relative h-40 overflow-hidden rounded-lg mb-3">
        {pulperia.imageUrl ? (
          <img
            src={pulperia.imageUrl}
            alt={pulperia.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-pulpe-red/20 to-pulpe-gold/20 flex items-center justify-center">
            <div className="w-16 h-16 bg-pulpe-cream rounded-lg flex items-center justify-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-4 bg-pulpe-red rounded-t-lg" />
              <div className="w-4 h-5 bg-pulpe-brown rounded-t-full mt-2" />
            </div>
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-2 right-2">
          <span
            className={`badge ${
              pulperia.isOpen ? 'bg-green-500/80 text-white' : 'bg-gray-500/80 text-white'
            }`}
          >
            {pulperia.isOpen ? 'Abierto' : 'Cerrado'}
          </span>
        </div>
      </div>

      {/* Info */}
      <div>
        <h3 className="font-semibold text-white truncate group-hover:text-pulpe-red transition-colors">
          {pulperia.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center space-x-1 mt-1">
          <StarIcon className="w-4 h-4 text-pulpe-gold" />
          <span className="text-sm font-medium">{pulperia.rating.toFixed(1)}</span>
          <span className="text-xs text-gray-500">
            ({pulperia._count?.reviews || pulperia.totalReviews} reviews)
          </span>
        </div>

        {/* Address */}
        <div className="flex items-center space-x-1 mt-1 text-gray-400">
          <MapPinIcon className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm truncate">{pulperia.address}</span>
        </div>

        {/* Products count */}
        {pulperia._count?.products !== undefined && (
          <div className="flex items-center space-x-1 mt-1 text-gray-500">
            <ShoppingBagIcon className="w-4 h-4" />
            <span className="text-sm">{pulperia._count.products} productos</span>
          </div>
        )}

        {/* Description */}
        {pulperia.description && (
          <p className="text-sm text-gray-400 mt-2 line-clamp-2">{pulperia.description}</p>
        )}
      </div>
    </Link>
  );
}
