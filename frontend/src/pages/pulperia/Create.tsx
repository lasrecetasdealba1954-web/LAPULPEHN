import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { pulperiaApi } from '../../lib/api';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  BuildingStorefrontIcon,
  PhotoIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

function LocationPicker({ position, setPosition }: { position: [number, number]; setPosition: (pos: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} /> : null;
}

export default function CreatePulperia() {
  const { user, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [position, setPosition] = useState<[number, number]>([14.0723, -87.1921]);

  // Redirect if already has pulperia
  useEffect(() => {
    if (user?.pulperia) {
      navigate('/mi-pulperia');
    }
  }, [user?.pulperia, navigate]);

  // Get user location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {
          // Default to Tegucigalpa
        }
      );
    }
  }, []);

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

    if (!name || !address) {
      toast.error('Nombre y dirección son requeridos');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('address', address);
      formData.append('latitude', position[0].toString());
      formData.append('longitude', position[1].toString());
      if (phone) formData.append('phone', phone);
      if (whatsapp) formData.append('whatsapp', whatsapp);
      if (imageFile) formData.append('image', imageFile);

      const res = await pulperiaApi.create(formData);

      // Update user state
      updateUser({
        userType: 'PULPERIA',
        pulperia: {
          id: res.data.id,
          name: res.data.name,
          imageUrl: res.data.imageUrl,
        },
      });

      toast.success('¡Pulpería creada exitosamente!');
      navigate('/mi-pulperia');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <div className="w-20 h-20 bg-pulpe-cream rounded-2xl flex items-center justify-center mx-auto mb-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-6 bg-pulpe-red rounded-t-2xl" />
          <div className="w-6 h-8 bg-pulpe-brown rounded-t-full mt-3" />
        </div>
        <h1 className="text-3xl font-bold">Crear mi Pulpería</h1>
        <p className="text-gray-400 mt-2">
          Registra tu negocio y empieza a vender en línea
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
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
              <span>Subir imagen</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-1">Opcional, máximo 10MB</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Nombre de la pulpería *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Pulpería Don Juan"
            className="input"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe tu negocio brevemente..."
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
              placeholder="Colonia, calle, referencia..."
              className="input pl-10"
              required
            />
          </div>
        </div>

        {/* Map */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Ubicación en el mapa *
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Haz clic en el mapa para marcar la ubicación de tu pulpería
          </p>
          <div className="h-64 rounded-lg overflow-hidden border border-gray-700">
            <MapContainer
              center={position}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <LocationPicker position={position} setPosition={setPosition} />
            </MapContainer>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Lat: {position[0].toFixed(6)}, Lng: {position[1].toFixed(6)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Teléfono</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+504 9999-9999"
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

        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          {loading ? (
            <span className="spinner" />
          ) : (
            <span className="flex items-center justify-center space-x-2">
              <BuildingStorefrontIcon className="w-5 h-5" />
              <span>Crear mi Pulpería</span>
            </span>
          )}
        </button>
      </form>
    </div>
  );
}
