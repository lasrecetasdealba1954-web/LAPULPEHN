import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { jobApi } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';
import {
  BriefcaseIcon,
  BuildingStorefrontIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ArrowLeftIcon,
  DocumentArrowUpIcon,
} from '@heroicons/react/24/outline';

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [message, setMessage] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);

  useEffect(() => {
    if (id) {
      fetchJob();
    }
  }, [id]);

  const fetchJob = async () => {
    try {
      const res = await jobApi.getOne(id!);
      setJob(res.data);
    } catch (error) {
      toast.error('Error cargando empleo');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Debes iniciar sesión para aplicar');
      return;
    }

    setApplying(true);
    try {
      const formData = new FormData();
      formData.append('message', message);
      if (cvFile) {
        formData.append('cv', cvFile);
      }

      await jobApi.apply(id!, formData);
      toast.success('Aplicación enviada');
      setShowApplicationForm(false);
      setMessage('');
      setCvFile(null);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="spinner" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Empleo no encontrado</p>
        <Link to="/empleos" className="text-pulpe-red hover:underline mt-2 inline-block">
          Volver a empleos
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => window.history.back()}
        className="flex items-center space-x-2 text-gray-400 hover:text-white"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        <span>Volver</span>
      </button>

      {/* Job Card */}
      <div className="card">
        <div className="flex items-start space-x-4 mb-6">
          <div className="w-16 h-16 bg-pulpe-red/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <BriefcaseIcon className="w-8 h-8 text-pulpe-red" />
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-bold">{job.title}</h1>

            <Link
              to={`/pulperia/${job.pulperia.id}`}
              className="flex items-center space-x-2 text-gray-400 hover:text-pulpe-red mt-2"
            >
              <BuildingStorefrontIcon className="w-5 h-5" />
              <span>{job.pulperia.name}</span>
            </Link>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {job.pulperia.address && (
            <div className="flex items-center space-x-2 text-gray-400">
              <MapPinIcon className="w-5 h-5" />
              <span>{job.pulperia.address}</span>
            </div>
          )}

          {job.salary && (
            <div className="flex items-center space-x-2 text-pulpe-gold">
              <CurrencyDollarIcon className="w-5 h-5" />
              <span className="font-semibold">{job.salary}</span>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="prose prose-invert max-w-none">
          <h3 className="text-lg font-semibold mb-3">Descripción</h3>
          <p className="text-gray-300 whitespace-pre-wrap">{job.description}</p>
        </div>

        {/* Apply Button */}
        {user && user.userType === 'CUSTOMER' && (
          <div className="mt-8 pt-6 border-t border-gray-700">
            {!showApplicationForm ? (
              <button
                onClick={() => setShowApplicationForm(true)}
                className="btn-primary w-full sm:w-auto"
              >
                Aplicar a este empleo
              </button>
            ) : (
              <form onSubmit={handleApply} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Mensaje (opcional)
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Preséntate brevemente..."
                    className="input min-h-[100px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    CV / Currículum (opcional)
                  </label>
                  <div className="flex items-center space-x-3">
                    <label className="btn-secondary cursor-pointer">
                      <DocumentArrowUpIcon className="w-5 h-5 mr-2" />
                      <span>{cvFile ? cvFile.name : 'Subir CV'}</span>
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                    {cvFile && (
                      <button
                        type="button"
                        onClick={() => setCvFile(null)}
                        className="text-red-400 text-sm"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF o imagen, máximo 5MB
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowApplicationForm(false)}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button type="submit" disabled={applying} className="btn-primary">
                    {applying ? <span className="spinner" /> : 'Enviar aplicación'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {!user && (
          <div className="mt-8 pt-6 border-t border-gray-700 text-center">
            <p className="text-gray-400 mb-4">Inicia sesión para aplicar a este empleo</p>
            <Link to="/login" className="btn-primary inline-block">
              Iniciar sesión
            </Link>
          </div>
        )}
      </div>

      {/* Contact Info */}
      <div className="card">
        <h3 className="font-semibold mb-4">Información de contacto</h3>
        <div className="space-y-2 text-gray-400">
          {job.pulperia.phone && (
            <p>
              Teléfono:{' '}
              <a href={`tel:${job.pulperia.phone}`} className="text-pulpe-red hover:underline">
                {job.pulperia.phone}
              </a>
            </p>
          )}
          <p className="text-sm text-gray-500">
            La comunicación será directamente con la pulpería
          </p>
        </div>
      </div>
    </div>
  );
}
