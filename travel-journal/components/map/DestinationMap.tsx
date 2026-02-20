'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Destination } from '@/lib/types';
import { Star } from 'lucide-react';
import Link from 'next/link';

// Fix za Leaflet marker ikone u Next.js
// (default ikone ne rade jer webpack menja putanje)
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Custom marker sa bojom prema oceni
function getRatingColor(rating: number): string {
  if (rating >= 4.5) return '#16a34a'; // zelena
  if (rating >= 3.5) return '#2563eb'; // plava
  if (rating >= 2.5) return '#f59e0b'; // žuta
  if (rating > 0) return '#ef4444'; // crvena
  return '#6b7280'; // siva (bez ocena)
}

function createCustomIcon(rating: number): L.DivIcon {
  const color = getRatingColor(rating);
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="
          transform: rotate(45deg);
          color: white;
          font-weight: bold;
          font-size: 12px;
        ">${rating > 0 ? rating.toFixed(1) : '?'}</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

// Komponenta za auto-fit svih markera
function FitBounds({ destinations }: { destinations: Destination[] }) {
  const map = useMap();

  useEffect(() => {
    const validDestinations = destinations.filter(
      (d) => d.latitude && d.longitude
    );

    if (validDestinations.length === 0) return;

    if (validDestinations.length === 1) {
      map.setView(
        [validDestinations[0].latitude!, validDestinations[0].longitude!],
        10
      );
      return;
    }

    const bounds = L.latLngBounds(
      validDestinations.map((d) => [d.latitude!, d.longitude!])
    );
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [destinations, map]);

  return null;
}

interface DestinationMapProps {
  destinations: Destination[];
  height?: string;
  singleDestination?: boolean;
}

export default function DestinationMap({
  destinations,
  height = '500px',
  singleDestination = false,
}: DestinationMapProps) {
  const [isMounted, setIsMounted] = useState(false);

  // Leaflet zahteva window — čekaj mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div
        className="bg-gray-100 rounded-lg flex items-center justify-center"
        style={{ height }}
      >
        <p className="text-gray-500">Učitavanje mape...</p>
      </div>
    );
  }

  const validDestinations = destinations.filter(
    (d) => d.latitude && d.longitude
  );

  if (validDestinations.length === 0) {
    return (
      <div
        className="bg-gray-100 rounded-lg flex items-center justify-center"
        style={{ height }}
      >
        <p className="text-gray-500">Nema destinacija sa koordinatama</p>
      </div>
    );
  }

  // Default centar: Evropa
  const defaultCenter: [number, number] = [44.8, 20.5]; // Beograd
  const defaultZoom = singleDestination ? 10 : 4;

  return (
    <div style={{ height }} className="rounded-lg overflow-hidden shadow-md">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        {/* OpenStreetMap tile layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Auto-fit markera */}
        <FitBounds destinations={validDestinations} />

        {/* Markeri */}
        {validDestinations.map((dest) => (
          <Marker
            key={dest.destinationId}
            position={[dest.latitude!, dest.longitude!]}
            icon={createCustomIcon(dest.averageRating || 0)}
          >
            <Popup className="destination-popup">
              <div className="p-3">
                {/* Slika */}
                {dest.imageURL && (
                  <div className="w-full h-24 rounded-lg overflow-hidden mb-2">
                    <img
                      src={dest.imageURL}
                      alt={dest.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Naziv */}
                <h3 className="font-bold text-gray-900 text-base">
                  {dest.name}
                </h3>
                <p className="text-sm text-gray-600">{dest.country}</p>

                {/* Ocena */}
                {dest.averageRating && dest.averageRating > 0 ? (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-yellow-500 text-sm">★</span>
                    <span className="text-sm font-medium">
                      {dest.averageRating.toFixed(1)}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 mt-1">Nema ocena</p>
                )}

                {/* Opis (skraćen) */}
                <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                  {dest.description}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
