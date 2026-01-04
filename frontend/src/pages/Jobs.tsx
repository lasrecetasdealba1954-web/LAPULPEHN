import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobApi, catalogApi } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';
import {
  BriefcaseIcon,
  BuildingStorefrontIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

type TabType = 'jobs' | 'services';

export default function Jobs() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('jobs');
  const [search, setSearch] = useState('');
  const [jobs, setJobs] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab, search]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'jobs') {
        const res = await jobApi.getAll({ search: search || undefined });
        setJobs(res.data);
      } else {
        const res = await catalogApi.getAll({ search: search || undefined });
        setServices(res.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Empleos y Servicios</h1>
          <p className="text-gray-400">Encuentra trabajo o ofrece tus servicios</p>
        </div>

        {user && (
          <Link to="/mis-catalogos" className="btn-primary">
            Ofrecer mis servicios
          </Link>
        )}
      </div>

      {/* Search and Tabs */}
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

        <div className="flex bg-pulpe-darker border border-gray-700 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'jobs'
                ? 'bg-pulpe-red text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <BriefcaseIcon className="w-4 h-4" />
            <span>Empleos</span>
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'services'
                ? 'bg-pulpe-red text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <WrenchScrewdriverIcon className="w-4 h-4" />
            <span>Servicios</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse h-48" />
          ))}
        </div>
      ) : activeTab === 'jobs' ? (
        jobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map((job) => (
              <Link
                key={job.id}
                to={`/empleo/${job.id}`}
                className="card-glow block"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-pulpe-red/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BriefcaseIcon className="w-6 h-6 text-pulpe-red" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{job.title}</h3>

                    <div className="flex items-center space-x-2 text-sm text-gray-400 mt-1">
                      <BuildingStorefrontIcon className="w-4 h-4" />
                      <span>{job.pulperia.name}</span>
                    </div>

                    {job.pulperia.address && (
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <MapPinIcon className="w-4 h-4" />
                        <span className="truncate">{job.pulperia.address}</span>
                      </div>
                    )}

                    {job.salary && (
                      <div className="flex items-center space-x-2 text-sm text-pulpe-gold mt-2">
                        <CurrencyDollarIcon className="w-4 h-4" />
                        <span>{job.salary}</span>
                      </div>
                    )}

                    <p className="text-sm text-gray-400 mt-2 line-clamp-2">
                      {job.description}
                    </p>

                    <p className="text-xs text-gray-500 mt-2">
                      {job._count.applications} aplicaciones
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <BriefcaseIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay empleos disponibles</p>
          </div>
        )
      ) : services.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((catalog) => (
            <Link
              key={catalog.id}
              to={`/catalogo/${catalog.id}`}
              className="card-glow block"
            >
              {/* Images Preview */}
              {catalog.images.length > 0 && (
                <div className="grid grid-cols-3 gap-1 mb-3">
                  {catalog.images.slice(0, 3).map((img: any, i: number) => (
                    <div key={i} className="aspect-square rounded overflow-hidden">
                      <img
                        src={img.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-start space-x-3">
                {catalog.user.photoUrl ? (
                  <img
                    src={catalog.user.photoUrl}
                    alt={catalog.user.name}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 bg-pulpe-red/20 rounded-full flex items-center justify-center">
                    <span className="text-pulpe-red font-bold">
                      {catalog.user.name[0]}
                    </span>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{catalog.profession}</h3>
                  <p className="text-sm text-gray-400">{catalog.user.name}</p>
                  {catalog.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {catalog.description}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <WrenchScrewdriverIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No hay servicios disponibles</p>
        </div>
      )}
    </div>
  );
}
