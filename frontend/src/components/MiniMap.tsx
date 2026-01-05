import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
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

const pulperiaIcon = L.icon({
  iconUrl: 'data:image/svg+xml,' + encodeURIComponent(`

`),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const userIcon = L.icon({
  iconUrl: 'data:image/svg+xml,' + encodeURIComponent(`

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

{/* Header */}

Mapa

setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-gray-700 rounded"
            >
              {isExpanded ? (
                
              ) : (
                
              )}

{/* Map */}

{/* User location */}
            {userLocation && (
              <>
                <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                  <Popup>Tu ubicación</Popup>
                </Marker>
                <Circle center={[userLocation.lat, userLocation.lng]} radius={radius * 1000} pathOptions={{ color: 'blue', fillColor: '#f03', fillOpacity: 0.5 }} />
              </>
            )}

            {/* Pulperias */}
            {filteredPulperias.map((pulperia) => (
              <Marker key={pulperia.id} position={[pulperia.latitude, pulperia.longitude]} icon={pulperiaIcon}>
                <Popup>
                  <div className="min-w-[200px]">
                    <h3 className="font-bold">{pulperia.name}</h3>
                    <p className="text-sm">{pulperia.address}</p>
                    <p className="text-sm">★ {pulperia.rating.toFixed(1)}</p>
                    <Link to={`/pulperia/${pulperia.id}`} className="text-blue-500 text-sm">
                      Ver más
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}

{/* Footer */}

{filteredPulperias.length} pulpería{filteredPulperias.length !== 1 ? 's' : ''} cerca

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
