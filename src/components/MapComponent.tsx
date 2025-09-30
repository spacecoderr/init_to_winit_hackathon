'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapControlPanel, MapSearchBar } from './MapControls';
import { MapClaim, ForestArea } from '../types';

// Dynamic import to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

const Polygon = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polygon),
  { ssr: false }
);

const Circle = dynamic(
  () => import('react-leaflet').then((mod) => mod.Circle),
  { ssr: false }
);

// Using types from unified types file

interface MapComponentProps {
  claims: MapClaim[];
  selectedClaim?: MapClaim | null;
  onClaimSelect: (claim: MapClaim) => void;
  center?: LatLngTuple;
  zoom?: number;
  onAreaSelect?: (area: ForestArea | null) => void;
  selectedArea?: ForestArea | null;
}

// Enhanced mock forest areas data with more regions
const mockForestAreas: ForestArea[] = [
  {
    id: 'forest-1',
    name: 'Tripura Reserved Forest - Sector A',
    type: 'reserve',
    coordinates: [
      [23.8315, 91.2868],
      [23.8415, 91.2968],
      [23.8515, 91.2868],
      [23.8415, 91.2768],
    ],
    area: 450.5,
    description: 'Dense tropical forest with rich biodiversity and important wildlife habitat',
    biodiversityIndex: 0.85,
    carbonStock: 180.5,
    threats: ['Illegal logging', 'Encroachment', 'Forest fires'],
    lastSurvey: '2024-08-15',
    conservationStatus: 'good',
    managementPlan: 'Sustainable forest management with community participation',
    keySpecies: ['Asian Elephant', 'Bengal Tiger', 'Slow Loris', 'Hoolock Gibbon'],
    localCommunities: 12,
  },
  {
    id: 'forest-2',
    name: 'Community Forest Area - Kakraban',
    type: 'community',
    coordinates: [
      [23.8200, 91.3000],
      [23.8300, 91.3100],
      [23.8400, 91.3000],
      [23.8300, 91.2900],
    ],
    area: 125.8,
    description: 'Community-managed forest area with traditional conservation practices',
    biodiversityIndex: 0.72,
    carbonStock: 95.2,
    threats: ['Overgrazing', 'Boundary disputes'],
    lastSurvey: '2024-07-22',
    conservationStatus: 'moderate',
    managementPlan: 'Community-based forest management with traditional practices',
    keySpecies: ['Wild Boar', 'Barking Deer', 'Various bird species'],
    localCommunities: 8,
  },
  {
    id: 'forest-3',
    name: 'Tripura Protected Wildlife Sanctuary',
    type: 'protected',
    coordinates: [
      [23.8500, 91.2600],
      [23.8650, 91.2750],
      [23.8700, 91.2500],
      [23.8550, 91.2450],
    ],
    area: 325.2,
    description: 'Protected wildlife sanctuary with endangered species conservation programs',
    biodiversityIndex: 0.92,
    carbonStock: 220.8,
    threats: ['Human-wildlife conflict', 'Poaching'],
    lastSurvey: '2024-09-10',
    conservationStatus: 'excellent',
    managementPlan: 'Strict protection with research and conservation programs',
    keySpecies: ['Clouded Leopard', 'Golden Langur', 'White-rumped Vulture', 'Indian Python'],
    localCommunities: 5,
  },
  {
    id: 'forest-4',
    name: 'Reserve Forest - Ambassa Division',
    type: 'reserve',
    coordinates: [
      [23.8100, 91.2400],
      [23.8200, 91.2550],
      [23.8300, 91.2400],
      [23.8200, 91.2300],
    ],
    area: 278.9,
    description: 'Government-managed reserve forest with timber and non-timber forest products',
    biodiversityIndex: 0.78,
    carbonStock: 156.3,
    threats: ['Illegal timber extraction', 'Cattle grazing'],
    lastSurvey: '2024-06-18',
    conservationStatus: 'good',
    managementPlan: 'Sustainable harvesting with reforestation programs',
    keySpecies: ['Sambar Deer', 'Indian Porcupine', 'Hill Myna', 'Flying Squirrel'],
    localCommunities: 15,
  },
  {
    id: 'forest-5',
    name: 'Community Forest - Kailashahar',
    type: 'community',
    coordinates: [
      [23.8600, 91.2900],
      [23.8750, 91.3050],
      [23.8800, 91.2850],
      [23.8650, 91.2750],
    ],
    area: 189.3,
    description: 'Community-owned forest with sustainable livelihood programs',
    biodiversityIndex: 0.68,
    carbonStock: 87.4,
    threats: ['Slash-and-burn agriculture', 'Over-extraction'],
    lastSurvey: '2024-05-30',
    conservationStatus: 'moderate',
    managementPlan: 'Community forest management with income generation activities',
    keySpecies: ['Jungle Cat', 'Mongoose', 'Various medicinal plants'],
    localCommunities: 22,
  },
  {
    id: 'forest-6',
    name: 'Buffer Zone - Sepahijala',
    type: 'protected',
    coordinates: [
      [23.8000, 91.3200],
      [23.8100, 91.3350],
      [23.8200, 91.3200],
      [23.8100, 91.3100],
    ],
    area: 95.7,
    description: 'Buffer zone around protected areas with eco-tourism potential',
    biodiversityIndex: 0.75,
    carbonStock: 78.9,
    threats: ['Tourism pressure', 'Infrastructure development'],
    lastSurvey: '2024-08-05',
    conservationStatus: 'good',
    managementPlan: 'Buffer zone management with controlled eco-tourism',
    keySpecies: ['Spectacled Monkey', 'Indian Roller', 'Bamboo species'],
    localCommunities: 6,
  },
];

const MapComponent: React.FC<MapComponentProps> = ({
  claims,
  selectedClaim,
  onClaimSelect,
  center = [23.8315, 91.2868], // Tripura coordinates
  zoom = 10,
  onAreaSelect,
  selectedArea,
}) => {
  const [isClient, setIsClient] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [activeLayers, setActiveLayers] = useState(['satellite', 'forest', 'claims']);
  const [activeView, setActiveView] = useState('street');
  const [filteredClaims, setFilteredClaims] = useState(claims);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    setFilteredClaims(claims);
  }, [claims]);

  const handleLayerToggle = (layer: string) => {
    setActiveLayers(prev =>
      prev.includes(layer)
        ? prev.filter(l => l !== layer)
        : [...prev, layer]
    );
  };

  const handleViewChange = (view: string) => {
    setActiveView(view);
  };

  const handleSearch = (query: string) => {
    const filtered = claims.filter(claim =>
      claim.claimantName.toLowerCase().includes(query.toLowerCase()) ||
      claim.village.toLowerCase().includes(query.toLowerCase()) ||
      claim.pattaNumber.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredClaims(filtered);
  };

  const handleFilterChange = (filters: any) => {
    // Implementation for advanced filtering
    console.log('Filters changed:', filters);
  };

  const handleAreaClick = (area: ForestArea) => {
    if (onAreaSelect) {
      onAreaSelect(area);
    }
  };

  useEffect(() => {
    if (isClient) {
      // Fix for default markers not showing
      import('leaflet').then((L) => {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: '/leaflet/marker-icon-2x.png',
          iconUrl: '/leaflet/marker-icon.png',
          shadowUrl: '/leaflet/marker-shadow.png',
        });
        setMapReady(true);
      });
    }
  }, [isClient]);

  const getClaimStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#22c55e'; // green
      case 'rejected':
        return '#ef4444'; // red
      case 'under-review':
        return '#f59e0b'; // amber
      default:
        return '#6b7280'; // gray
    }
  };

  const getForestAreaColor = (type: string) => {
    switch (type) {
      case 'protected':
        return '#16a34a'; // dark green
      case 'reserve':
        return '#15803d'; // darker green
      case 'community':
        return '#65a30d'; // lime green
      default:
        return '#22c55e';
    }
  };

  if (!isClient || !mapReady) {
    return (
      <div
        className="w-full h-full flex items-center justify-center rounded-lg"
        style={{ backgroundColor: 'var(--color-surface-muted)', minHeight: '400px' }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2" style={{ borderColor: 'var(--color-primary)' }}></div>
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading Interactive Map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      {/* Map Controls */}
      <MapControlPanel
        activeLayers={activeLayers}
        activeView={activeView}
        onLayerToggle={handleLayerToggle}
        onViewChange={handleViewChange}
      />

      {/* Search Bar */}
      <MapSearchBar
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
      />

      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%', zIndex: 1 }}
        className="rounded-lg"
      >
        {/* Base tile layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Conditional satellite imagery layer */}
        {activeLayers.includes('satellite') && (
          <TileLayer
            attribution='Tiles &copy; Esri'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            opacity={activeView === 'satellite' ? 0.8 : 0.3}
          />
        )}

        {/* Forest areas */}
        {activeLayers.includes('forest') && mockForestAreas.map((forest) => (
          <Polygon
            key={forest.id}
            positions={forest.coordinates}
            pathOptions={{
              color: getForestAreaColor(forest.type),
              fillColor: getForestAreaColor(forest.type),
              fillOpacity: selectedArea?.id === forest.id ? 0.4 : 0.2,
              weight: selectedArea?.id === forest.id ? 3 : 2,
            }}
            eventHandlers={{
              click: () => handleAreaClick(forest),
            }}
          />
        ))}

        {/* Claim markers */}
        {activeLayers.includes('claims') && filteredClaims.map((claim) => (
          <React.Fragment key={claim.id}>
            {/* Claim location marker */}
            <Circle
              center={[claim.lat, claim.lng]}
              radius={200}
              pathOptions={{
                color: getClaimStatusColor(claim.status),
                fillColor: getClaimStatusColor(claim.status),
                fillOpacity: selectedClaim?.id === claim.id ? 0.6 : 0.3,
                weight: selectedClaim?.id === claim.id ? 3 : 2,
              }}
              eventHandlers={{
                click: () => onClaimSelect(claim),
              }}
            >
              <Popup>
                <div style={{ color: 'var(--color-text-primary)' }}>
                  <h3 className="font-bold mb-1">{claim.claimantName}</h3>
                  <p className="text-sm mb-1">Village: {claim.village}</p>
                  <p className="text-sm mb-1">Extent: {claim.extent} hectares</p>
                  <p className="text-sm mb-1">Status: <span className="capitalize">{claim.status}</span></p>
                  <p className="text-sm">Patta: {claim.pattaNumber}</p>
                  <button
                    onClick={() => onClaimSelect(claim)}
                    className="mt-2 px-2 py-1 text-xs rounded"
                    style={{
                      backgroundColor: 'var(--color-primary)',
                      color: 'white'
                    }}
                  >
                    View Details
                  </button>
                </div>
              </Popup>
            </Circle>

            {/* Estimated claim area (larger circle for visualization) */}
            <Circle
              center={[claim.lat, claim.lng]}
              radius={Math.sqrt(claim.extent * 10000) / 2} // Convert hectares to approximate radius
              pathOptions={{
                color: getClaimStatusColor(claim.status),
                fillColor: getClaimStatusColor(claim.status),
                fillOpacity: 0.1,
                weight: 1,
                dashArray: '5, 5',
              }}
            />
          </React.Fragment>
        ))}
      </MapContainer>

      {/* Map Legend */}
      <div
        className="absolute bottom-4 right-4 p-3 rounded-lg shadow-lg z-10"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>Legend</h4>
          <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--color-surface-muted)', color: 'var(--color-text-secondary)' }}>
            {filteredClaims.length} of {claims.length} claims
          </span>
        </div>

        {/* Claim Status Legend */}
        <div className="mb-3">
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Claim Status:</p>
          <div className="space-y-1">
            {[
              { status: 'approved', label: 'Approved', color: '#22c55e' },
              { status: 'pending', label: 'Pending', color: '#6b7280' },
              { status: 'under-review', label: 'Under Review', color: '#f59e0b' },
              { status: 'rejected', label: 'Rejected', color: '#ef4444' },
            ].map(({ status, label, color }) => (
              <div key={status} className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                ></div>
                <span className="text-xs" style={{ color: 'var(--color-text-primary)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Forest Areas Legend */}
        <div>
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Forest Areas:</p>
          <div className="space-y-1">
            {[
              { type: 'protected', label: 'Protected', color: '#16a34a' },
              { type: 'reserve', label: 'Reserve', color: '#15803d' },
              { type: 'community', label: 'Community', color: '#65a30d' },
            ].map(({ type, label, color }) => (
              <div key={type} className="flex items-center space-x-2">
                <div
                  className="w-3 h-2 border"
                  style={{ backgroundColor: color, opacity: 0.3, borderColor: color }}
                ></div>
                <span className="text-xs" style={{ color: 'var(--color-text-primary)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map Status Info */}
      <div
        className="absolute bottom-4 left-4 p-3 rounded-lg shadow-lg"
        style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-success)' }}></div>
            <span>Live Map Data</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>📍 {filteredClaims.length} visible claims</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>🗺️ Interactive GIS</span>
          </div>
        </div>
        <p className="text-xs mt-1 opacity-75">Click claims for details • Use controls to filter layers</p>
      </div>
    </div>
  );
};

export default MapComponent;