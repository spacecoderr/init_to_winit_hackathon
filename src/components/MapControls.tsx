'use client';

import React, { useState } from 'react';
import { Layers, MapPin, Search, Filter, Download, Ruler, Square, Navigation, Satellite, Globe } from 'lucide-react';

interface MapControlPanelProps {
  onLayerToggle: (layer: string) => void;
  onViewChange: (view: string) => void;
  activeLayers: string[];
  activeView: string;
}

const MapControlPanel: React.FC<MapControlPanelProps> = ({
  onLayerToggle,
  onViewChange,
  activeLayers,
  activeView
}) => {
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [showToolsPanel, setShowToolsPanel] = useState(false);

  const layers = [
    { id: 'satellite', name: 'Satellite Imagery', icon: Satellite },
    { id: 'forest', name: 'Forest Boundaries', icon: Globe },
    { id: 'claims', name: 'FRA Claims', icon: MapPin },
    { id: 'villages', name: 'Village Boundaries', icon: Square },
  ];

  const tools = [
    { id: 'measure', name: 'Measure Distance', icon: Ruler },
    { id: 'area', name: 'Measure Area', icon: Square },
    { id: 'navigate', name: 'Navigation', icon: Navigation },
  ];

  return (
    <div className="absolute top-4 left-4 z-20 space-y-2">
      {/* Layer Control */}
      <div className="relative">
        <button
          onClick={() => setShowLayerPanel(!showLayerPanel)}
          className="flex items-center space-x-2 px-3 py-2 rounded-lg shadow-lg font-medium transition-all hover:shadow-xl"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)'
          }}
        >
          <Layers className="w-4 h-4" />
          <span>Layers</span>
        </button>

        {showLayerPanel && (
          <div 
            className="absolute top-12 left-0 w-64 p-4 rounded-lg shadow-xl border z-30"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)'
            }}
          >
            <h3 className="font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>Map Layers</h3>
            <div className="space-y-2">
              {layers.map((layer) => (
                <label key={layer.id} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeLayers.includes(layer.id)}
                    onChange={() => onLayerToggle(layer.id)}
                    className="rounded"
                    style={{ accentColor: 'var(--color-primary)' }}
                  />
                  <layer.icon className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
                  <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                    {layer.name}
                  </span>
                </label>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <h4 className="font-medium mb-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Base Map</h4>
              <div className="space-y-1">
                <button
                  onClick={() => onViewChange('street')}
                  className={`w-full text-left px-2 py-1 rounded text-sm transition ${
                    activeView === 'street' ? 'font-medium' : ''
                  }`}
                  style={{
                    backgroundColor: activeView === 'street' ? 'var(--color-primary-light)' : 'transparent',
                    color: activeView === 'street' ? 'white' : 'var(--color-text-primary)'
                  }}
                >
                  Street Map
                </button>
                <button
                  onClick={() => onViewChange('satellite')}
                  className={`w-full text-left px-2 py-1 rounded text-sm transition ${
                    activeView === 'satellite' ? 'font-medium' : ''
                  }`}
                  style={{
                    backgroundColor: activeView === 'satellite' ? 'var(--color-primary-light)' : 'transparent',
                    color: activeView === 'satellite' ? 'white' : 'var(--color-text-primary)'
                  }}
                >
                  Satellite View
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tools Panel */}
      <div className="relative">
        <button
          onClick={() => setShowToolsPanel(!showToolsPanel)}
          className="flex items-center space-x-2 px-3 py-2 rounded-lg shadow-lg font-medium transition-all hover:shadow-xl"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)'
          }}
        >
          <Ruler className="w-4 h-4" />
          <span>Tools</span>
        </button>

        {showToolsPanel && (
          <div 
            className="absolute top-12 left-0 w-56 p-4 rounded-lg shadow-xl border z-30"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)'
            }}
          >
            <h3 className="font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>Map Tools</h3>
            <div className="space-y-2">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  className="flex items-center space-x-3 w-full px-3 py-2 rounded-lg transition-colors hover:bg-opacity-80"
                  style={{
                    backgroundColor: 'var(--color-surface-muted)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  <tool.icon className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
                  <span className="text-sm">{tool.name}</span>
                </button>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <button
                className="flex items-center space-x-2 w-full px-3 py-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'white'
                }}
              >
                <Download className="w-4 h-4" />
                <span className="text-sm">Export Map</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface MapSearchBarProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: any) => void;
}

const MapSearchBar: React.FC<MapSearchBarProps> = ({ onSearch, onFilterChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="absolute top-4 right-4 z-20 w-80">
      <div className="space-y-2">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
          <input
            type="text"
            placeholder="Search claims, villages, or coordinates..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              onSearch(e.target.value);
            }}
            className="w-full pl-10 pr-12 py-2 rounded-lg shadow-lg border focus:outline-none focus:ring-2"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)'
            }}
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded hover:bg-opacity-80"
            style={{ backgroundColor: showFilters ? 'var(--color-primary-light)' : 'transparent' }}
          >
            <Filter className="w-4 h-4" style={{ color: showFilters ? 'white' : 'var(--color-text-secondary)' }} />
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div 
            className="p-4 rounded-lg shadow-xl border"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)'
            }}
          >
            <h4 className="font-bold mb-3 text-sm" style={{ color: 'var(--color-text-primary)' }}>Filter Claims</h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Status
                </label>
                <select 
                  className="w-full px-2 py-1 rounded border text-sm"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                  <option value="under-review">Under Review</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Area Range (hectares)
                </label>
                <div className="flex space-x-2">
                  <input 
                    type="number" 
                    placeholder="Min"
                    className="flex-1 px-2 py-1 rounded border text-sm"
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-primary)'
                    }}
                  />
                  <input 
                    type="number" 
                    placeholder="Max"
                    className="flex-1 px-2 py-1 rounded border text-sm"
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-primary)'
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Village
                </label>
                <select 
                  className="w-full px-2 py-1 rounded border text-sm"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  <option value="">All Villages</option>
                  <option value="Kakraban">Kakraban</option>
                  <option value="Ambassa">Ambassa</option>
                  <option value="Kailashahar">Kailashahar</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-2 mt-4">
              <button
                className="flex-1 px-3 py-1 rounded text-sm font-medium transition"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'white'
                }}
              >
                Apply Filters
              </button>
              <button
                className="flex-1 px-3 py-1 rounded text-sm transition"
                style={{
                  backgroundColor: 'var(--color-surface-muted)',
                  color: 'var(--color-text-primary)'
                }}
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { MapControlPanel, MapSearchBar };