'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { TrendingUp, PieChart, BarChart3, Activity } from 'lucide-react';
import { MapClaim } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface DashboardChartsProps {
  claims: MapClaim[];
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({ claims }) => {
  // Chart theme colors using CSS variables
  const chartColors = {
    primary: '#1e40af',
    success: '#059669',
    warning: '#d97706',
    danger: '#dc2626',
    info: '#0284c7',
    primaryLight: '#3b82f6',
    successLight: '#ecfdf5',
    warningLight: '#fffbeb',
    dangerLight: '#fef2f2',
    infoLight: '#f0f9ff',
  };

  // Generate monthly data for the last 6 months
  const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyData = months.map((_, index) => {
    const baseApproved = 15 + Math.floor(Math.random() * 10);
    const basePending = 8 + Math.floor(Math.random() * 6);
    const baseRejected = 3 + Math.floor(Math.random() * 4);
    return {
      approved: Math.floor(baseApproved * (1 + index * 0.1)),
      pending: Math.floor(basePending * (1 + Math.random() * 0.3)),
      rejected: Math.floor(baseRejected * (1 + Math.random() * 0.2)),
    };
  });

  // Claims Trend Chart Data
  const claimsTrendData = {
    labels: months,
    datasets: [
      {
        label: 'Approved Claims',
        data: monthlyData.map(d => d.approved),
        borderColor: chartColors.success,
        backgroundColor: `${chartColors.success}20`,
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Pending Claims',
        data: monthlyData.map(d => d.pending),
        borderColor: chartColors.warning,
        backgroundColor: `${chartColors.warning}20`,
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Rejected Claims',
        data: monthlyData.map(d => d.rejected),
        borderColor: chartColors.danger,
        backgroundColor: `${chartColors.danger}20`,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Village Distribution Data
  const villageStats = claims.reduce((acc, claim) => {
    acc[claim.village] = (acc[claim.village] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const villageChartData = {
    labels: Object.keys(villageStats),
    datasets: [
      {
        label: 'Claims by Village',
        data: Object.values(villageStats),
        backgroundColor: [
          chartColors.primary,
          chartColors.success,
          chartColors.warning,
          chartColors.info,
          chartColors.danger,
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  // Status Distribution Data
  const statusStats = claims.reduce((acc, claim) => {
    acc[claim.status] = (acc[claim.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusChartData = {
    labels: ['Approved', 'Pending', 'Under Review', 'Rejected'],
    datasets: [
      {
        data: [
          statusStats.approved || 0,
          statusStats.pending || 0,
          statusStats['under-review'] || 0,
          statusStats.rejected || 0,
        ],
        backgroundColor: [
          chartColors.success,
          chartColors.warning,
          chartColors.info,
          chartColors.danger,
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  // Area Distribution Data
  const areaRanges = {
    'Small (0-100 ha)': claims.filter(c => c.extent <= 100).length,
    'Medium (101-300 ha)': claims.filter(c => c.extent > 100 && c.extent <= 300).length,
    'Large (301-500 ha)': claims.filter(c => c.extent > 300 && c.extent <= 500).length,
    'Very Large (500+ ha)': claims.filter(c => c.extent > 500).length,
  };

  const areaChartData = {
    labels: Object.keys(areaRanges),
    datasets: [
      {
        label: 'Number of Claims',
        data: Object.values(areaRanges),
        backgroundColor: chartColors.primaryLight,
        borderColor: chartColors.primary,
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: chartColors.primary,
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 15,
          usePointStyle: true,
          font: {
            size: 11,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: chartColors.primary,
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
      },
    },
    cutout: '60%',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Claims Trend Chart */}
      <div
        className="col-span-1 lg:col-span-2 p-6 rounded-lg border"
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center space-x-2 mb-4">
          <Activity className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
          <h3 className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>
            Claims Processing Trend
          </h3>
        </div>
        <div className="h-64">
          <Line data={claimsTrendData} options={chartOptions} />
        </div>
      </div>

      {/* Status Distribution */}
      <div
        className="p-6 rounded-lg border"
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center space-x-2 mb-4">
          <PieChart className="w-5 h-5" style={{ color: 'var(--color-success)' }} />
          <h3 className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>
            Status Distribution
          </h3>
        </div>
        <div className="h-64">
          <Doughnut data={statusChartData} options={doughnutOptions} />
        </div>
      </div>

      {/* Village Distribution */}
      <div
        className="p-6 rounded-lg border"
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="w-5 h-5" style={{ color: 'var(--color-info)' }} />
          <h3 className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>
            Claims by Village
          </h3>
        </div>
        <div className="h-64">
          <Bar data={villageChartData} options={chartOptions} />
        </div>
      </div>

      {/* Area Distribution */}
      <div
        className="col-span-1 lg:col-span-2 p-6 rounded-lg border"
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="w-5 h-5" style={{ color: 'var(--color-warning)' }} />
          <h3 className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>
            Area Size Distribution
          </h3>
        </div>
        <div className="h-64">
          <Bar
            data={areaChartData}
            options={{
              ...chartOptions,
              plugins: {
                ...chartOptions.plugins,
                legend: {
                  display: false,
                },
              },
            }}
          />
        </div>
      </div>

      {/* Summary Statistics */}
      <div
        className="col-span-1 lg:col-span-2 p-8 rounded-xl border-2 transition-all hover:shadow-lg"
        style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-primary)' }}>
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-bold text-xl" style={{ color: 'var(--color-text-primary)' }}>
            Key Performance Indicators
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="p-4 rounded-xl border-2 text-center transition-all hover:shadow-md" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-center mb-2">
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-success)' }}>
                <Activity className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold mb-1" style={{ color: 'var(--color-success)' }}>
              {((statusStats.approved || 0) / claims.length * 100).toFixed(1)}%
            </p>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Approval Rate</p>
          </div>
          <div className="p-4 rounded-xl border-2 text-center transition-all hover:shadow-md" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-center mb-2">
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-primary)' }}>
                <PieChart className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold mb-1" style={{ color: 'var(--color-primary)' }}>
              {claims.reduce((sum, claim) => sum + claim.extent, 0).toFixed(0)}
            </p>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Total Hectares</p>
          </div>
          <div className="p-4 rounded-xl border-2 text-center transition-all hover:shadow-md" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-center mb-2">
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-warning)' }}>
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold mb-1" style={{ color: 'var(--color-warning)' }}>
              {(claims.reduce((sum, claim) => sum + claim.extent, 0) / claims.length).toFixed(1)}
            </p>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Avg. Area (ha)</p>
          </div>
          <div className="p-4 rounded-xl border-2 text-center transition-all hover:shadow-md" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-center mb-2">
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-info)' }}>
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold mb-1" style={{ color: 'var(--color-info)' }}>
              {Object.keys(villageStats).length}
            </p>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Villages Covered</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;