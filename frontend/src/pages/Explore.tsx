import { useState, useEffect } from 'react';
import { pulperiaApi, productApi } from '../lib/api';
import PulperiaCard from '../components/PulperiaCard';
import ProductCard from '../components/ProductCard';
import MiniMap from '../components/MiniMap';
import {
  MagnifyingGlassIcon,
  BuildingStorefrontIcon,
  ShoppingBagIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';

type TabType = 'pulperias' | 'products';

export default function Explore() {
  const [activeTab, setActiveTab] = useState<TabType>('pulperias');
  const [search, setSearch] = useState('');
  const [pulperias, setPulperias] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | undefined>();

  useEffect(() => {
    fetchData();
    getUserLocation();
  }, []);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      fetchData();
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [search, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'pulperias') {
        const res = await pulperiaApi.getAll({ search: search || undefined });
        setPulperias(res.data);
      } else {
        const res = await productApi.getAll({ search: search || undefined });
        setProducts(res.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          setUserLocation({ lat: 14.0723, lng: -87.1921 });
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Explorar</h1>
        <p className="text-gray-400">Descubre pulperías y productos cerca de ti</p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>

        {/* Tabs */}
        <div className="flex bg-pulpe-darker border border-gray-700 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('pulperias')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'pulperias'
                ? 'bg-pulpe-red text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <BuildingStorefrontIcon className="w-4 h-4" />
            <span>Pulperías</span>
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'products'
                ? 'bg-pulpe-red text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ShoppingBagIcon className="w-4 h-4" />
            <span>Productos</span>
          </button>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse h-64" />
          ))}
        </div>
      ) : activeTab === 'pulperias' ? (
        pulperias.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pulperias.map((pulperia) => (
              <PulperiaCard key={pulperia.id} pulperia={pulperia} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <BuildingStorefrontIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No se encontraron pulperías</p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-pulpe-red hover:underline mt-2"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        )
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <ShoppingBagIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No se encontraron productos</p>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-pulpe-red hover:underline mt-2"
            >
              Limpiar búsqueda
            </button>
          )}
        </div>
      )}

      {/* Mini Map */}
      {pulperias.length > 0 && <MiniMap pulperias={pulperias} userLocation={userLocation} />}
    </div>
  );
}
