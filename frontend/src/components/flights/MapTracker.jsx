import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Info } from 'lucide-react';

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom plane icon
const planeIcon = new L.DivIcon({
  html: `<div style="transform: rotate(45deg); font-size: 24px; color: #4F46E5;">✈️</div>`,
  className: 'plane-icon',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const MapBounds = ({ origin, destination }) => {
  const map = useMap();
  useEffect(() => {
    if (origin && destination) {
      const bounds = L.latLngBounds([origin, destination]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [origin, destination, map]);
  return null;
};

const MapTracker = ({ flight }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const originCoords = flight.departure.coordinates;
  const destCoords = flight.arrival.coordinates;

  if (!originCoords || !destCoords) {
    return (
      <div className="bg-slate-100 h-64 rounded-xl flex items-center justify-center flex-col text-slate-500">
        <Info className="h-8 w-8 mb-2" />
        <p>Map coordinates not available in demo data.</p>
      </div>
    );
  }

  // Calculate a simulated midpoint for the plane
  const midLat = (originCoords[0] + destCoords[0]) / 2;
  const midLng = (originCoords[1] + destCoords[1]) / 2;
  const planeCoords = [midLat, midLng];

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-200">
      <div className="absolute top-2 right-2 z-[1000] bg-white px-3 py-1 text-xs font-semibold text-slate-600 rounded shadow-md flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
        Simulated tracking — demo data
      </div>
      
      {mounted && (
        <MapContainer center={planeCoords} zoom={4} style={{ height: '350px', width: '100%', zIndex: 0 }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapBounds origin={originCoords} destination={destCoords} />
          
          <Polyline 
            positions={[originCoords, destCoords]} 
            pathOptions={{ color: '#3A506B', weight: 3, dashArray: '5, 10' }} 
          />
          
          <Marker position={originCoords}>
            <Popup>{flight.departure.airport} ({flight.departure.city})</Popup>
          </Marker>
          
          <Marker position={destCoords}>
            <Popup>{flight.arrival.airport} ({flight.arrival.city})</Popup>
          </Marker>

          {/* Simulated Plane */}
          <Marker position={planeCoords} icon={planeIcon}>
            <Popup>
              <div className="font-bold text-aero-navy">{flight.airline} {flight.flightNumber}</div>
              <div className="text-xs text-slate-500">Simulated Position</div>
            </Popup>
          </Marker>
        </MapContainer>
      )}
    </div>
  );
};

export default MapTracker;
