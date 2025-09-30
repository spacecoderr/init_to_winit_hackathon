'use client';

import React from 'react';
import { MapPin, TrendingUp, Users, FileCheck, Clock, AlertTriangle } from 'lucide-react';

interface Claim {
  id: string;
  claimantName: string;
  village: string;
  extent: number;
  status: 'pending' | 'approved' | 'rejected' | 'under-review';
  lat: number;
  lng: number;
  pattaNumber: string;
}

interface MapStatsProps {
  claims: Claim[];
}

const MapStatsDashboard: React.FC<MapStatsProps> = ({ claims }) => {
  // Calculate statistics
  const totalClaims = claims.length;
  const approvedClaims = claims.filter(c => c.status === 'approved').length;
  const pendingClaims = claims.filter(c => c.status === 'pending').length;
  const underReviewClaims = claims.filter(c => c.status === 'under-review').length;
  const rejectedClaims = claims.filter(c => c.status === 'rejected').length;

  const totalArea = claims.reduce((sum, claim) => sum + claim.extent, 0);
  const approvedArea = claims
    .filter(c => c.status === 'approved')
    .reduce((sum, claim) => sum + claim.extent, 0);

  const approvalRate = totalClaims > 0 ? ((approvedClaims / totalClaims) * 100).toFixed(1) : '0';

  // Village distribution
  const villageStats = claims.reduce((acc, claim) => {
    acc[claim.village] = (acc[claim.village] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topVillages = Object.entries(villageStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const statCards = [
    {
      title: 'Total Claims',
      value: totalClaims.toString(),
      icon: MapPin,
      color: 'var(--color-info)',
      bgColor: 'var(--color-info-light)',
      subtitle: `${totalArea.toFixed(1)} ha total area`
    },
    {
      title: 'Approved Claims',
      value: approvedClaims.toString(),
      icon: FileCheck,
      color: 'var(--color-success)',
      bgColor: 'var(--color-success-light)',
      subtitle: `${approvedArea.toFixed(1)} ha approved`
    },
    {
      title: 'Approval Rate',
      value: `${approvalRate}%`,
      icon: TrendingUp,
      color: 'var(--color-primary)',
      bgColor: 'var(--color-primary-light)',
      subtitle: 'Processing efficiency'
    },
    {
      title: 'Pending Review',
      value: (pendingClaims + underReviewClaims).toString(),
      icon: Clock,
      color: 'var(--color-warning)',
      bgColor: 'var(--color-warning-light)',
      subtitle: 'Requires attention'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <div
            key={idx}
            className="p-4 rounded-lg border"
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: stat.bgColor }}
              >
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
              <span className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {stat.value}
              </span>
            </div>
            <h3 className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>
              {stat.title}
            </h3>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              {stat.subtitle}
            </p>
          </div>
        ))}
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div
          className="p-4 rounded-lg border"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <h3 className="font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Status Distribution
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--color-success)' }}></div>
                <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>Approved</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {approvedClaims}
                </span>
                <div className="w-16 h-2 rounded-full" style={{ backgroundColor: 'var(--color-surface-muted)' }}>
                  <div
                    className="h-2 rounded-full"
                    style={{
                      backgroundColor: 'var(--color-success)',
                      width: `${totalClaims > 0 ? (approvedClaims / totalClaims) * 100 : 0}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--color-warning)' }}></div>
                <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>Pending</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {pendingClaims}
                </span>
                <div className="w-16 h-2 rounded-full" style={{ backgroundColor: 'var(--color-surface-muted)' }}>
                  <div
                    className="h-2 rounded-full"
                    style={{
                      backgroundColor: 'var(--color-warning)',
                      width: `${totalClaims > 0 ? (pendingClaims / totalClaims) * 100 : 0}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--color-info)' }}></div>
                <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>Under Review</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {underReviewClaims}
                </span>
                <div className="w-16 h-2 rounded-full" style={{ backgroundColor: 'var(--color-surface-muted)' }}>
                  <div
                    className="h-2 rounded-full"
                    style={{
                      backgroundColor: 'var(--color-info)',
                      width: `${totalClaims > 0 ? (underReviewClaims / totalClaims) * 100 : 0}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--color-danger)' }}></div>
                <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>Rejected</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {rejectedClaims}
                </span>
                <div className="w-16 h-2 rounded-full" style={{ backgroundColor: 'var(--color-surface-muted)' }}>
                  <div
                    className="h-2 rounded-full"
                    style={{
                      backgroundColor: 'var(--color-danger)',
                      width: `${totalClaims > 0 ? (rejectedClaims / totalClaims) * 100 : 0}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Villages */}
        <div
          className="p-4 rounded-lg border"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <h3 className="font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            Claims by Village
          </h3>
          <div className="space-y-3">
            {topVillages.map(([village, count], idx) => (
              <div key={village} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    {idx + 1}
                  </div>
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {village}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {count} claims
                  </span>
                  <div className="w-12 h-2 rounded-full" style={{ backgroundColor: 'var(--color-surface-muted)' }}>
                    <div
                      className="h-2 rounded-full"
                      style={{
                        backgroundColor: 'var(--color-primary)',
                        width: `${(count / totalClaims) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div
        className="p-4 rounded-lg border"
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <h3 className="font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
          Quick Map Actions
        </h3>
        <div className="flex flex-wrap gap-2">
          <button
            className="px-3 py-1 rounded text-sm font-medium transition hover:bg-opacity-90"
            style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
          >
            View All Claims
          </button>
          <button
            className="px-3 py-1 rounded text-sm font-medium transition hover:bg-opacity-90"
            style={{ backgroundColor: 'var(--color-warning)', color: 'white' }}
          >
            Pending Only
          </button>
          <button
            className="px-3 py-1 rounded text-sm font-medium transition hover:bg-opacity-90"
            style={{ backgroundColor: 'var(--color-success)', color: 'white' }}
          >
            Approved Only
          </button>
          <button
            className="px-3 py-1 rounded text-sm transition"
            style={{ backgroundColor: 'var(--color-surface-muted)', color: 'var(--color-text-primary)' }}
          >
            Export Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapStatsDashboard;