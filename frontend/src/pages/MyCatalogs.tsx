import { useState, useEffect } from 'react';
import { catalogApi } from '../lib/api';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  TrashIcon,
  PhotoIcon,
  FolderIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export default function MyCatalogs() {
  const [catalogs, setCatalogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProfession, setNewProfession] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);

  useEffect(() => {
    fetchCatalogs();
  }, []);

  const fetchCatalogs = async () => {
    try {
      const res = await catalogApi.getMyCatalogs();
      setCatalogs(res.data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfession.trim()) {
      toast.error('Ingresa una profesión');
      return;
    }

    setCreating(true);
    try {
      await catalogApi.create({
        profession: newProfession.trim(),
        description: newDescription.trim() || undefined,
      });
      toast.success('Catálogo creado');
      setShowCreateForm(false);
      setNewProfession('');
      setNewDescription('');
      fetchCatalogs();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setCreating(false);
    }
  };

  const handleAddImage = async (catalogId: string, file: File) => {
    setUploadingImage(catalogId);
    try {
      const formData = new FormData();
      formData.append('image', file);

      await catalogApi.addImage(catalogId, formData);
      toast.success('Imagen agregada');
      fetchCatalogs();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploadingImage(null);
    }
  };

  const handleDeleteImage = async (catalogId: string, imageId: string) => {
    if (!confirm('¿Eliminar esta imagen?')) return;

    try {
      await catalogApi.deleteImage(catalogId, imageId);
      toast.success('Imagen eliminada');
      fetchCatalogs();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteCatalog = async (catalogId: string) => {
    if (!confirm('¿Eliminar este catálogo y todas sus imágenes?')) return;

    try {
      await catalogApi.delete(catalogId);
      toast.success('Catálogo eliminado');
      fetchCatalogs();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mis Catálogos</h1>
          <p className="text-gray-400">Muestra tu trabajo a clientes potenciales</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Nuevo catálogo</span>
        </button>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Nuevo Catálogo</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Profesión / Servicio *
                </label>
                <input
                  type="text"
                  value={newProfession}
                  onChange={(e) => setNewProfession(e.target.value)}
                  placeholder="Ej: Carpintero, Electricista, Diseñador..."
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Descripción (opcional)
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe brevemente tus servicios..."
                  className="input min-h-[80px]"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button type="submit" disabled={creating} className="btn-primary flex-1">
                  {creating ? <span className="spinner" /> : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Catalogs */}
      {catalogs.length === 0 ? (
        <div className="text-center py-16">
          <FolderIcon className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <h2 className="text-2xl font-bold mb-2">No tienes catálogos</h2>
          <p className="text-gray-400 mb-6">
            Crea un catálogo para mostrar tu trabajo y atraer clientes
          </p>
          <button onClick={() => setShowCreateForm(true)} className="btn-primary">
            Crear mi primer catálogo
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {catalogs.map((catalog) => (
            <div key={catalog.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold">{catalog.profession}</h3>
                  {catalog.description && (
                    <p className="text-gray-400 mt-1">{catalog.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteCatalog(catalog.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Images Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {catalog.images.map((image: any) => (
                  <div key={image.id} className="relative group aspect-square">
                    <img
                      src={image.imageUrl}
                      alt=""
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      onClick={() => handleDeleteImage(catalog.id, image.id)}
                      className="absolute top-1 right-1 p-1 bg-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XMarkIcon className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}

                {/* Add Image Button */}
                {catalog.images.length < 6 && (
                  <label className="aspect-square border-2 border-dashed border-gray-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-pulpe-red transition-colors">
                    {uploadingImage === catalog.id ? (
                      <div className="spinner" />
                    ) : (
                      <>
                        <PhotoIcon className="w-8 h-8 text-gray-500" />
                        <span className="text-xs text-gray-500 mt-1">
                          {6 - catalog.images.length} restantes
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleAddImage(catalog.id, file);
                      }}
                      className="hidden"
                      disabled={uploadingImage === catalog.id}
                    />
                  </label>
                )}
              </div>

              <p className="text-xs text-gray-500 mt-4">
                Máximo 6 imágenes por catálogo. Las imágenes deben mostrar tu mejor trabajo.
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
