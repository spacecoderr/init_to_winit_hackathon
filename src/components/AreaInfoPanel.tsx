'use client';

import React from 'react';
import { MapPin, TreePine, Users, FileText, Calendar, AlertCircle, X } from 'lucide-react';

import { ForestArea } from '../types';

interface AreaInfoPanelProps {
  selectedArea: ForestArea | null;
  onClose: () => void;
}

const AreaInfoPanel: React.FC<AreaInfoPanelProps> = ({ selectedArea, onClose }) => {
  if (!selectedArea) return null;
  
  const area = selectedArea;

  // Calculate actual active claims that overlap with this forest area
  // In a real system, this would use spatial queries to find overlapping claims
  const getActiveClaimsForArea = (area: ForestArea) => {
    // Mock logic: simulate which claims might overlap with this forest area based on proximity
    const mockClaimsInArea = [
      { areaName: 'Tripura Protected Wildlife Sanctuary', claimIds: [1, 3] }, // Kakraban, Kanchanpur
      { areaName: 'Community Forest Area - Kakraban', claimIds: [1, 2] }, // Kakraban, Ambassa  
      { areaName: 'Tripura Reserved Forest - Sector A', claimIds: [4, 5] }, // Melaghar, Udaipur
      { areaName: 'Reserve Forest - Ambassa Division', claimIds: [2, 3] }, // Ambassa, Kanchanpur
    ];
    
    const areaData = mockClaimsInArea.find(item => 
      area.name.includes(item.areaName.split(' - ')[0]) || 
      item.areaName.includes(area.name.split(' - ')[0])
    );
    
    return areaData ? areaData.claimIds.length : Math.min(2, Math.floor(area.area / 200));
  };

  // Mock additional data for the selected area
  const additionalInfo = {
    establishedYear: area.type === 'protected' ? '1982' : area.type === 'reserve' ? '1975' : '1995',
    biodiversity: {
      fauna: area.type === 'protected' ? 45 : area.type === 'reserve' ? 32 : 28,
      flora: area.type === 'protected' ? 180 : area.type === 'reserve' ? 150 : 120,
    },
    threatsLevel: area.type === 'protected' ? 'Low' : area.type === 'reserve' ? 'Medium' : 'High',
    activeClaims: getActiveClaimsForArea(area),
    lastSurvey: '2024-08-15',
    carbonStock: Math.floor(area.area * 2.5),
    soilType: area.area > 300 ? 'Laterite with clay' : area.area > 200 ? 'Sandy loam' : 'Clay loam',
    waterBodies: area.area > 250 ? 3 : area.area > 150 ? 2 : 1,
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'protected':
        return {
          bg: 'var(--color-success-light)',
          text: 'var(--color-success-text)',
          border: 'var(--color-success)'
        };
      case 'reserve':
        return {
          bg: 'var(--color-info-light)',
          text: 'var(--color-info-text)',
          border: 'var(--color-info)'
        };
      case 'community':
        return {
          bg: 'var(--color-warning-light)',
          text: 'var(--color-warning-text)',
          border: 'var(--color-warning)'
        };
      default:
        return {
          bg: 'var(--color-surface-muted)',
          text: 'var(--color-text-primary)',
          border: 'var(--color-border)'
        };
    }
  };

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'Low':
        return 'var(--color-success)';
      case 'Medium':
        return 'var(--color-warning)';
      case 'High':
        return 'var(--color-danger)';
      default:
        return 'var(--color-text-secondary)';
    }
  };

  const typeColors = getTypeColor(area.type);

  return (
    <div
      className="fixed top-0 right-0 h-full w-96 transform transition-transform duration-300 ease-in-out z-30 translate-x-0"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderLeft: '1px solid var(--color-border)',
        boxShadow: '-4px 0 6px -1px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div className="h-full overflow-y-auto">
        {/* Header */}
        <div 
          className="p-4 border-b sticky top-0 z-10"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TreePine className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
              <h2 className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>
                Forest Area Details
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition hover:bg-opacity-80"
              style={{ backgroundColor: 'var(--color-surface-muted)' }}
            >
              <X className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Area Title */}
          <div>
            <h3 className="font-bold text-xl mb-2" style={{ color: 'var(--color-text-primary)' }}>
              {area.name}
            </h3>
            <div className="flex items-center space-x-2">
              <span
                className="px-3 py-1 rounded-full text-sm font-medium capitalize border"
                style={{
                  backgroundColor: typeColors.bg,
                  color: typeColors.text,
                  borderColor: typeColors.border
                }}
              >
                {area.type} Forest
              </span>
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Since {additionalInfo.establishedYear}
              </span>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div 
              className="p-3 rounded-lg border"
              style={{ backgroundColor: 'var(--color-surface-muted)', borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-center space-x-2 mb-1">
                <MapPin className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  Total Area
                </span>
              </div>
              <p className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>
                {area.area} ha
              </p>
            </div>

            <div 
              className="p-3 rounded-lg border"
              style={{ backgroundColor: 'var(--color-surface-muted)', borderColor: 'var(--color-border)' }}
              title="FRA claims that overlap with or are within this forest area"
            >
              <div className="flex items-center space-x-2 mb-1">
                <FileText className="w-4 h-4" style={{ color: 'var(--color-warning)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  Active Schemes
                </span>
              </div>
              <p className="text-lg font-bold" style={{ color: 'var(--color-warning)' }}>
                {additionalInfo.activeClaims}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                Schemes within this area
              </p>
            </div>
          </div>

          {/* Biodiversity */}
          <div>
            <h4 className="font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              Biodiversity Index
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Flora Species
                </span>
                <div className="flex items-center space-x-2">
                  <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {additionalInfo.biodiversity.flora}
                  </span>
                  <div className="w-16 h-2 rounded-full" style={{ backgroundColor: 'var(--color-surface-muted)' }}>
                    <div
                      className="h-2 rounded-full"
                      style={{
                        backgroundColor: 'var(--color-success)',
                        width: `${Math.min((additionalInfo.biodiversity.flora / 200) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Fauna Species
                </span>
                <div className="flex items-center space-x-2">
                  <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {additionalInfo.biodiversity.fauna}
                  </span>
                  <div className="w-16 h-2 rounded-full" style={{ backgroundColor: 'var(--color-surface-muted)' }}>
                    <div
                      className="h-2 rounded-full"
                      style={{
                        backgroundColor: 'var(--color-info)',
                        width: `${Math.min((additionalInfo.biodiversity.fauna / 50) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Environmental Data */}
          <div>
            <h4 className="font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              Environmental Status
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Threat Level
                </span>
                <span 
                  className="text-sm font-medium"
                  style={{ color: getThreatColor(additionalInfo.threatsLevel) }}
                >
                  {additionalInfo.threatsLevel}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Carbon Stock
                </span>
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {additionalInfo.carbonStock} tons CO₂
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Soil Type
                </span>
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {additionalInfo.soilType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Water Bodies
                </span>
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {additionalInfo.waterBodies} sources
                </span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h4 className="font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              Recent Activity
            </h4>
            <div 
              className="p-3 rounded-lg border"
              style={{ backgroundColor: 'var(--color-info-light)', borderColor: 'var(--color-info-border)' }}
            >
              <div className="flex items-start space-x-2">
                <Calendar className="w-4 h-4 mt-0.5" style={{ color: 'var(--color-info)' }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-info-text)' }}>
                    Last Survey Completed
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-info-text)' }}>
                    {new Date(additionalInfo.lastSurvey).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              className="w-full px-4 py-2 rounded-lg font-medium transition hover:bg-opacity-90"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'white'
              }}
            >
              View Claims in Area
            </button>
            <button
              className="w-full px-4 py-2 rounded-lg font-medium transition hover:bg-opacity-80"
              style={{
                backgroundColor: 'var(--color-surface-muted)',
                color: 'var(--color-text-primary)'
              }}
            >
              Generate Report
            </button>
            <button
              className="w-full px-4 py-2 rounded-lg font-medium transition hover:bg-opacity-80"
              style={{
                backgroundColor: 'var(--color-surface-muted)',
                color: 'var(--color-text-primary)'
              }}
            >
              Schedule Survey
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AreaInfoPanel;