import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { pulperiaApi } from '../../lib/api';
import toast from 'react-hot-toast';
import {
  Cog6ToothIcon,
  PhotoIcon,
  MapPinIcon,
  ShareIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export default function PulperiaSettings() {
  const { user, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [shareLinks, setShareLinks] = useState<any>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (user?.pulperia) {
      loadPulperiaData();
      loadShareLinks();
    }
  }, [user?.pulperia?.id]);

  const loadPulperiaData = async () => {
    if (!user?.pulperia?.id) return;

    try {
      const res = await pulperiaApi.getOne(user.pulperia.id);
      const p = res.data;

      setName(p.name);
      setDescription(p.description || '');
      setAddress(p.address);
      setPhone(p.phone || '');
      setWhatsapp(p.whatsapp || '');
      setIsOpen(p.isOpen);
      setImagePreview(p.imageUrl);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const loadShareLinks = async () => {
    if (!user?.pulperia?.id) return;

    try {
      const res = await pulperiaApi.getShareLinks(user.pulperia.id);
      setShareLinks(res.data);
    } catch (error) {
      console.error('Error loading share links:', error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.pulperia?.id) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('address', address);
      formData.append('phone', phone);
      formData.append('whatsapp', whatsapp);
      formData.append('isOpen', isOpen.toString());
      if (imageFile) formData.append('image', imageFile);

      await pulperiaApi.update(user.pulperia.id, formData);
      toast.success('Configuración guardada');
      updateUser({ pulperia: { ...user.pulperia, name, imageUrl: imagePreview || undefined } });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (platform: string) => {
    if (!shareLinks) return;

    let url = '';
    switch (platform) {
      case 'copy':
        await navigator.clipboard.writeText(shareLinks.url);
        toast.success('Enlace copiado');
        return;
      case 'whatsapp':
        url = shareLinks.whatsapp;
        break;
      case 'facebook':
        url = shareLinks.facebook;
        break;
      case 'twitter':
        url = shareLinks.twitter;
        break;
      case 'native':
        if (navigator.share) {
          await navigator.share({
            title: name,
            text: shareLinks.text,
            url: shareLinks.url,
          });
          return;
        }
        break;
    }

    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleCloseBusiness = async (downloadData: boolean) => {
    if (!user?.pulperia?.id) return;

    const confirmMessage = downloadData
      ? '¿Estás seguro de cerrar tu pulpería? Tus datos serán descargados antes de cerrar.'
      : '¿Estás seguro de cerrar tu pulpería? Todos tus datos serán eliminados permanentemente.';

    if (!confirm(confirmMessage)) return;

    try {
      const res = await pulperiaApi.delete(user.pulperia.id, downloadData);

      if (downloadData && res.data.data) {
        // Download data as JSON
        const blob = new Blob([JSON.stringify(res.data.data, null, 2)], {
          type: 'application/json',
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pulperia-backup-${Date.now()}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }

      toast.success('Pulpería cerrada');
      updateUser({ userType: 'CUSTOMER', pulperia: undefined });
      navigate('/');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold flex items-center space-x-2">
          <Cog6ToothIcon className="w-8 h-8" />
          <span>Configuración</span>
        </h1>
        <p className="text-gray-400">Administra tu pulpería</p>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="card space-y-6">
        <h2 className="text-xl font-bold">Información General</h2>

        {/* Image */}
        <div>
          <label className="block text-sm font-medium mb-2">Imagen de la pulpería</label>
          <div className="flex items-center space-x-4">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Preview"
                className="w-24 h-24 object-cover rounded-lg"
              />
            ) : (
              <div className="w-24 h-24 bg-pulpe-dark rounded-lg flex items-center justify-center">
                <PhotoIcon className="w-8 h-8 text-gray-500" />
              </div>
            )}
            <label className="btn-secondary cursor-pointer">
              <span>Cambiar imagen</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Nombre *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input min-h-[80px]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Dirección *</label>
          <div className="relative">
            <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="input pl-10"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Teléfono</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">WhatsApp</label>
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="504XXXXXXXX"
              className="input"
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-pulpe-dark/50 rounded-lg">
          <div>
            <p className="font-medium">Estado de la pulpería</p>
            <p className="text-sm text-gray-400">
              {isOpen ? 'Abierto - Recibiendo órdenes' : 'Cerrado - No recibe órdenes'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isOpen ? 'bg-green-500' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isOpen ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? <span className="spinner" /> : 'Guardar cambios'}
        </button>
      </form>

      {/* Share Links */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
          <ShareIcon className="w-6 h-6" />
          <span>Compartir mi pulpería</span>
        </h2>
        <p className="text-gray-400 mb-4">Comparte tu pulpería en redes sociales</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button onClick={() => handleShare('copy')} className="btn-secondary text-sm">
            Copiar enlace
          </button>
          <button onClick={() => handleShare('whatsapp')} className="btn-secondary text-sm bg-green-600 border-green-600 hover:bg-green-700">
            WhatsApp
          </button>
          <button onClick={() => handleShare('facebook')} className="btn-secondary text-sm bg-blue-600 border-blue-600 hover:bg-blue-700">
            Facebook
          </button>
          <button onClick={() => handleShare('twitter')} className="btn-secondary text-sm bg-sky-500 border-sky-500 hover:bg-sky-600">
            Twitter/X
          </button>
        </div>

        {navigator.share && (
          <button onClick={() => handleShare('native')} className="btn-primary w-full mt-4">
            Compartir
          </button>
        )}
      </div>

      {/* Danger Zone */}
      <div className="card border-red-500/50">
        <h2 className="text-xl font-bold mb-4 flex items-center space-x-2 text-red-400">
          <ExclamationTriangleIcon className="w-6 h-6" />
          <span>Zona de peligro</span>
        </h2>

        <p className="text-gray-400 mb-4">
          Cerrar tu pulpería eliminará permanentemente tu negocio y todos los datos asociados.
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => handleCloseBusiness(true)}
            className="btn-secondary text-red-400 border-red-400 hover:bg-red-400/10 flex items-center justify-center space-x-2"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            <span>Descargar datos y cerrar</span>
          </button>
          <button
            onClick={() => handleCloseBusiness(false)}
            className="btn-secondary text-red-400 border-red-400 hover:bg-red-400/10 flex items-center justify-center space-x-2"
          >
            <TrashIcon className="w-5 h-5" />
            <span>Cerrar sin descargar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
