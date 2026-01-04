import { useState, useEffect } from 'react';
import { jobApi } from '../../lib/api';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  BriefcaseIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  UserIcon,
  CheckIcon,
  XCircleIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline';

export default function PulperiaJobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [salary, setSalary] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await jobApi.getMyJobs();
      setJobs(res.data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSalary('');
    setEditingJob(null);
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (job: any) => {
    setEditingJob(job);
    setTitle(job.title);
    setDescription(job.description);
    setSalary(job.salary || '');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description) {
      toast.error('Título y descripción son requeridos');
      return;
    }

    setSubmitting(true);
    try {
      if (editingJob) {
        await jobApi.update(editingJob.id, { title, description, salary: salary || undefined });
        toast.success('Empleo actualizado');
      } else {
        await jobApi.create({ title, description, salary: salary || undefined });
        toast.success('Empleo publicado');
      }

      setShowForm(false);
      resetForm();
      fetchJobs();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm('¿Eliminar este empleo?')) return;

    try {
      await jobApi.delete(jobId);
      toast.success('Empleo eliminado');
      fetchJobs();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleToggleActive = async (job: any) => {
    try {
      await jobApi.update(job.id, { isActive: !job.isActive });
      fetchJobs();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleRespondApplication = async (applicationId: string, status: 'ACCEPTED' | 'REJECTED') => {
    const response = status === 'ACCEPTED'
      ? prompt('Mensaje para el aplicante (información de contacto, etc.):')
      : undefined;

    try {
      await jobApi.respond(applicationId, { status, response: response || undefined });
      toast.success(status === 'ACCEPTED' ? 'Aplicación aceptada' : 'Aplicación rechazada');
      fetchJobs();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Empleos</h1>
          <p className="text-gray-400">Publica ofertas de trabajo</p>
        </div>
        <button onClick={openCreateForm} className="btn-primary flex items-center space-x-2">
          <PlusIcon className="w-5 h-5" />
          <span>Publicar empleo</span>
        </button>
      </div>

      {/* Job Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-lg w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {editingJob ? 'Editar empleo' : 'Nuevo empleo'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Título *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Vendedor, Cajero..."
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Descripción *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe el puesto, requisitos, horarios..."
                  className="input min-h-[120px]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Salario (opcional)</label>
                <input
                  type="text"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  placeholder="Ej: L8,000 - L12,000 mensual"
                  className="input"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? <span className="spinner" /> : editingJob ? 'Guardar' : 'Publicar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Jobs List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="card animate-pulse h-32" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16">
          <BriefcaseIcon className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <h2 className="text-2xl font-bold mb-2">No has publicado empleos</h2>
          <p className="text-gray-400 mb-6">Publica tu primera oferta de trabajo</p>
          <button onClick={openCreateForm} className="btn-primary">
            Publicar empleo
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xl font-bold">{job.title}</h3>
                    <span
                      className={`badge ${
                        job.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {job.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  {job.salary && (
                    <p className="text-pulpe-gold">{job.salary}</p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openEditForm(job)}
                    className="p-2 text-gray-400 hover:text-white"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(job.id)}
                    className="p-2 text-red-400 hover:text-red-300"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <p className="text-gray-400 mb-4">{job.description}</p>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => handleToggleActive(job)}
                  className="text-sm text-pulpe-red hover:underline"
                >
                  {job.isActive ? 'Desactivar' : 'Activar'}
                </button>

                <button
                  onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}
                  className="flex items-center space-x-1 text-sm text-gray-400 hover:text-white"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>{job.applications.length} aplicaciones</span>
                </button>
              </div>

              {/* Applications */}
              {selectedJob?.id === job.id && job.applications.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
                  <h4 className="font-semibold">Aplicaciones</h4>
                  {job.applications.map((app: any) => (
                    <div key={app.id} className="p-3 bg-pulpe-dark/50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{app.user.name}</p>
                          <p className="text-sm text-gray-400">{app.user.email}</p>
                          {app.user.phone && (
                            <p className="text-sm text-gray-400">{app.user.phone}</p>
                          )}
                          {app.message && (
                            <p className="text-sm text-gray-300 mt-2 italic">"{app.message}"</p>
                          )}
                          {app.cvUrl && (
                            <a
                              href={app.cvUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-1 text-sm text-pulpe-red hover:underline mt-2"
                            >
                              <DocumentIcon className="w-4 h-4" />
                              <span>Ver CV</span>
                            </a>
                          )}
                        </div>

                        {app.status === 'PENDING' ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleRespondApplication(app.id, 'ACCEPTED')}
                              className="p-2 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30"
                              title="Aceptar"
                            >
                              <CheckIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleRespondApplication(app.id, 'REJECTED')}
                              className="p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                              title="Rechazar"
                            >
                              <XCircleIcon className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <span
                            className={`badge ${
                              app.status === 'ACCEPTED'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {app.status === 'ACCEPTED' ? 'Aceptado' : 'Rechazado'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
