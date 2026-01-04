import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Link } from 'react-router-dom';
import { ChevronUpIcon, ChevronDownIcon, MapPinIcon } from '@heroicons/react/24/outline';
import 'leaflet/dist/leaflet.css';

interface Pulperia {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  imageUrl?: string;
  rating: number;
  isOpen: boolean;
}

interface MiniMapProps {
  pulperias: Pulperia[];
  userLocation?: { lat: number; lng: number };
}

const pulperiaIcon = new Icon({
  iconUrl: 'data:image/svg+xml,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#e63946" width="32" height="32">
      <path d="M19 2H5C3.89 2 3 2.89 3 4V18C3 19.1 3.9 20 5 20H9L12 23L15 20H19C20.1 20 21 19.1 21 18V4C21 2.89 20.1 2 19 2Z"/>
      <rect x="7" y="6" width="4" height="4" fill="#1a1a2e"/>
      <rect x="13" y="6" width="4" height="4" fill="#1a1a2e"/>
      <rect x="10" y="12" width="4" height="6" rx="2" fill="#8b4513"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const userIcon = new Icon({
  iconUrl: 'data:image/svg+xml,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ffd700" width="24" height="24">
      <circle cx="12" cy="12" r="8" stroke="#1a1a2e" stroke-width="2"/>
    </svg>
  `),
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function MiniMap({ pulperias, userLocation }: MiniMapProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [radius, setRadius] = useState(5);

  // Default to Tegucigalpa if no location
  const defaultCenter: [number, number] = [14.0723, -87.1921];
  const center: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : defaultCenter;

  const filteredPulperias = pulperias.filter((p) => {
    if (!userLocation) return true;

    const distance = getDistance(
      userLocation.lat,
      userLocation.lng,
      p.latitude,
      p.longitude
    );
    return distance <= radius;
  });

  return (
    <div
      className={`fixed bottom-4 right-4 z-40 transition-all duration-300 ${
        isExpanded ? 'w-80 h-96' : 'w-64 h-48'
      }`}
    >
      <div className="bg-pulpe-darker border border-gray-700 rounded-xl overflow-hidden h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-2 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <MapPinIcon className="w-4 h-4 text-pulpe-red" />
            <span className="text-sm font-medium">Mapa</span>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="text-xs bg-pulpe-dark border border-gray-700 rounded px-2 py-1"
            >
              <option value={1}>1 km</option>
              <option value={3}>3 km</option>
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
              <option value={25}>25 km</option>
            </select>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-gray-700 rounded"
            >
              {isExpanded ? (
                <ChevronDownIcon className="w-4 h-4" />
              ) : (
                <ChevronUpIcon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1">
          <MapContainer
            center={center}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <ChangeView center={center} zoom={13} />
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            {/* User location */}
            {userLocation && (
              <>
                <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                  <Popup>Tu ubicación</Popup>
                </Marker>
                <Circle
                  center={[userLocation.lat, userLocation.lng]}
                  radius={radius * 1000}
                  pathOptions={{
                    color: '#e63946',
                    fillColor: '#e63946',
                    fillOpacity: 0.1,
                  }}
                />
              </>
            )}

            {/* Pulperias */}
            {filteredPulperias.map((pulperia) => (
              <Marker
                key={pulperia.id}
                position={[pulperia.latitude, pulperia.longitude]}
                icon={pulperiaIcon}
              >
                <Popup>
                  <div className="text-center">
                    <p className="font-semibold text-white">{pulperia.name}</p>
                    <p className="text-xs text-gray-400">{pulperia.address}</p>
                    <div className="flex items-center justify-center space-x-1 mt-1">
                      <span className="text-pulpe-gold">★</span>
                      <span className="text-sm">{pulperia.rating.toFixed(1)}</span>
                    </div>
                    <Link
                      to={`/pulperia/${pulperia.id}`}
                      className="inline-block mt-2 text-xs text-pulpe-red hover:underline"
                    >
                      Ver más
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-gray-700 text-center">
          <span className="text-xs text-gray-400">
            {filteredPulperias.length} pulpería{filteredPulperias.length !== 1 ? 's' : ''} cerca
          </span>
        </div>
      </div>
    </div>
  );
}

// Haversine formula to calculate distance between two points
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
