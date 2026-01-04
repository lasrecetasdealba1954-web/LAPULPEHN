import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { pulperiaApi, productApi } from '../lib/api';
import PulperiaCard from '../components/PulperiaCard';
import ProductCard from '../components/ProductCard';
import MiniMap from '../components/MiniMap';
import {
  MagnifyingGlassIcon,
  BuildingStorefrontIcon,
  ShoppingBagIcon,
  BriefcaseIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

export default function Home() {
  const [pulperias, setPulperias] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | undefined>();

  useEffect(() => {
    fetchData();
    getUserLocation();
  }, []);

  const fetchData = async () => {
    try {
      const [pulperiasRes, productsRes] = await Promise.all([
        pulperiaApi.getAll(),
        productApi.getAll(),
      ]);
      setPulperias(pulperiasRes.data.slice(0, 6));
      setProducts(productsRes.data.slice(0, 8));
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
          // Default to Tegucigalpa
          setUserLocation({ lat: 14.0723, lng: -87.1921 });
        }
      );
    }
  };

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative py-16 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-pulpe-cream rounded-2xl flex items-center justify-center relative overflow-hidden shadow-lg shadow-pulpe-red/20 animate-float">
              <div className="absolute top-0 left-0 right-0 h-6 bg-pulpe-red rounded-t-2xl" />
              <div className="w-6 h-8 bg-pulpe-brown rounded-t-full mt-3" />
              <div className="absolute -top-2 -right-2">
                <SparklesIcon className="w-8 h-8 text-pulpe-gold animate-pulse" />
              </div>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-white">La</span>{' '}
            <span className="text-pulpe-red">Pulpería</span>
          </h1>

          <p className="text-xl text-gray-300 mb-2">¿Qué deseaba?</p>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Tu marketplace hondureño de confianza. Encuentra productos locales,
            servicios y empleos cerca de ti.
          </p>

          {/* Search Bar */}
          <div className="max-w-md mx-auto">
            <Link
              to="/explorar"
              className="flex items-center space-x-3 bg-pulpe-darker border border-gray-700 rounded-xl px-4 py-3 text-gray-400 hover:border-pulpe-red transition-colors"
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
              <span>Buscar productos, pulperías...</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/explorar"
          className="card-glow p-6 text-center group"
        >
          <div className="w-12 h-12 bg-pulpe-red/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-pulpe-red/30 transition-colors">
            <BuildingStorefrontIcon className="w-6 h-6 text-pulpe-red" />
          </div>
          <h3 className="font-semibold mb-2">Pulperías</h3>
          <p className="text-sm text-gray-400">
            Descubre tiendas locales cerca de ti
          </p>
        </Link>

        <Link
          to="/explorar"
          className="card-glow p-6 text-center group"
        >
          <div className="w-12 h-12 bg-pulpe-gold/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-pulpe-gold/30 transition-colors">
            <ShoppingBagIcon className="w-6 h-6 text-pulpe-gold" />
          </div>
          <h3 className="font-semibold mb-2">Productos</h3>
          <p className="text-sm text-gray-400">
            Todo lo que necesitas a un click
          </p>
        </Link>

        <Link
          to="/empleos"
          className="card-glow p-6 text-center group"
        >
          <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-green-500/30 transition-colors">
            <BriefcaseIcon className="w-6 h-6 text-green-500" />
          </div>
          <h3 className="font-semibold mb-2">Empleos</h3>
          <p className="text-sm text-gray-400">
            Encuentra oportunidades de trabajo
          </p>
        </Link>
      </section>

      {/* Featured Pulperias */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Pulperías Destacadas</h2>
          <Link to="/explorar" className="text-pulpe-red hover:underline text-sm">
            Ver todas
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card animate-pulse h-64" />
            ))}
          </div>
        ) : pulperias.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pulperias.map((pulperia) => (
              <PulperiaCard key={pulperia.id} pulperia={pulperia} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <BuildingStorefrontIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay pulperías disponibles aún</p>
          </div>
        )}
      </section>

      {/* Featured Products */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Productos Populares</h2>
          <Link to="/explorar" className="text-pulpe-red hover:underline text-sm">
            Ver todos
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card animate-pulse h-48" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <ShoppingBagIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay productos disponibles aún</p>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="card-glow p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">¿Tienes una pulpería?</h2>
        <p className="text-gray-400 mb-6 max-w-md mx-auto">
          Únete a La Pulpería y lleva tu negocio al siguiente nivel. Vende productos,
          recibe órdenes y haz crecer tu negocio.
        </p>
        <Link to="/crear-pulperia" className="btn-primary inline-block">
          Registrar mi Pulpería
        </Link>
      </section>

      {/* Mini Map */}
      {pulperias.length > 0 && (
        <MiniMap pulperias={pulperias} userLocation={userLocation} />
      )}
    </div>
  );
}
