'use client';

import React, { useEffect, useState } from 'react';
import { apiRequest } from '@/utils/api';
import { useToast } from '@/context/ToastContext';
import { useRouter, useParams } from 'next/navigation';

interface ScanLog {
  id: number;
  ip_address: string;
  country: string;
  city: string;
  device: string;
  browser: string;
  operating_system: string;
  referrer: string;
  scanned_at: string;
}

interface AnalyticsData {
  qr_id: number;
  short_id: string;
  total_scans: number;
  daily_scans: { date: string; count: number }[];
  devices: { device: string; count: number }[];
  operating_systems: { os: string; count: number }[];
  browsers: { browser: string; count: number }[];
  countries: { country: string; count: number }[];
  cities: { city: string; count: number }[];
  referrers: { referrer: string; count: number }[];
  recent_scans: ScanLog[];
}

export default function AnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await apiRequest(`/analytics/${params.id}`);
        setData(res);
      } catch (err: any) {
        showToast(err.message || 'Error loading analytics.', 'error');
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [params.id, router, showToast]);

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '80vh', width: '100%', justifyContent: 'center', alignItems: 'center' }}>
        <div className="shimmer-loading" style={{ width: '200px', height: '40px' }}>Loading Analytics...</div>
      </div>
    );
  }

  if (!data) return null;

  // Custom Line Chart Component for Daily Scans using SVG
  const renderLineChart = () => {
    const chartData = data.daily_scans;
    if (chartData.length === 0) {
      return (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          No scans recorded in the last 30 days. Share your QR code to gather tracking metrics.
        </div>
      );
    }

    const width = 600;
    const height = 180;
    const paddingX = 40;
    const paddingY = 20;

    const counts = chartData.map((d) => d.count);
    const maxVal = Math.max(...counts, 5); // Fallback to min height 5
    const minVal = 0;

    // Calculate Coordinates
    const points = chartData.map((d, index) => {
      const x = paddingX + (index / (chartData.length - 1 || 1)) * (width - 2 * paddingX);
      const y = height - paddingY - ((d.count - minVal) / (maxVal - minVal)) * (height - 2 * paddingY);
      return { x, y, val: d.count, date: d.date };
    });

    // Create Path String
    let pathD = '';
    let areaD = '';

    if (points.length > 0) {
      pathD = `M ${points[0].x} ${points[0].y}`;
      areaD = `M ${points[0].x} ${height - paddingY} L ${points[0].x} ${points[0].y}`;

      for (let i = 1; i < points.length; i++) {
        // Linear path
        pathD += ` L ${points[i].x} ${points[i].y}`;
        areaD += ` L ${points[i].x} ${points[i].y}`;
      }

      areaD += ` L ${points[points.length - 1].x} ${height - paddingY} Z`;
    }

    return (
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', minWidth: '500px', display: 'block' }}>
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.0" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="var(--accent-primary)" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Grid lines */}
          <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="var(--glass-border)" strokeDasharray="3,3" />
          <line x1={paddingX} y1={(height) / 2} x2={width - paddingX} y2={(height) / 2} stroke="var(--glass-border)" strokeDasharray="3,3" />
          <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="var(--glass-border)" />

          {/* Area Fill */}
          {points.length > 0 && <path d={areaD} fill="url(#chartGrad)" />}

          {/* Line Path */}
          {points.length > 0 && (
            <path d={pathD} fill="none" stroke="var(--accent-primary)" strokeWidth="3" filter="url(#glow)" strokeLinecap="round" />
          )}

          {/* Data Points */}
          {points.map((p, i) => (
            <g key={i} className="chart-dot" style={{ cursor: 'pointer' }}>
              <circle cx={p.x} cy={p.y} r="5" fill="var(--bg-secondary)" stroke="var(--accent-primary)" strokeWidth="2.5" />
              <title>{`${p.date}: ${p.val} scans`}</title>
            </g>
          ))}

          {/* Labels */}
          <text x={paddingX - 10} y={paddingY + 4} fill="var(--text-secondary)" fontSize="10" textAnchor="end">{maxVal}</text>
          <text x={paddingX - 10} y={height - paddingY + 4} fill="var(--text-secondary)" fontSize="10" textAnchor="end">0</text>

          {/* Dates (start / end) */}
          {points.length > 0 && (
            <>
              <text x={points[0].x} y={height - 4} fill="var(--text-muted)" fontSize="9" textAnchor="start">
                {new Date(points[0].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </text>
              <text x={points[points.length - 1].x} y={height - 4} fill="var(--text-muted)" fontSize="9" textAnchor="end">
                {new Date(points[points.length - 1].date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </text>
            </>
          )}
        </svg>
      </div>
    );
  };

  // Custom horizontal distribution bar component
  const renderDistributionBars = (title: string, list: { name: string; count: number }[], iconColor = 'var(--accent-primary)') => {
    const total = list.reduce((acc, curr) => acc + curr.count, 0);
    const maxCount = list.length > 0 ? list[0].count : 1;

    return (
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, minWidth: '280px' }}>
        <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>{title}</h3>
        {list.length === 0 ? (
          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No data available</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {list.map((item, index) => {
              const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
              const fillWidth = `${(item.count / maxCount) * 100}%`;
              return (
                <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 650, color: 'var(--text-primary)' }}>{item.name}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{item.count} ({percentage}%)</span>
                  </div>
                  {/* Progress bar container */}
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: fillWidth,
                      height: '100%',
                      background: `linear-gradient(to right, ${iconColor}, var(--accent-secondary))`,
                      borderRadius: '4px',
                      transition: 'width 0.6s ease'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', marginBottom: '4px' }}>Scan Analytics</h1>
          <p>Real-time analytics for short ID: <strong style={{ fontFamily: 'var(--font-mono)' }}>{data.short_id}</strong></p>
        </div>
        <button onClick={() => router.push('/dashboard')} className="btn btn-secondary">
          Back to Dashboard
        </button>
      </div>

      {/* Hero Stats */}
      <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', flexWrap: 'wrap', gap: '24px' }}>
        <div>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>Aggregate Scan Traffic</span>
          <h2 style={{ fontSize: '3rem', fontWeight: 850, color: 'var(--accent-primary)', marginTop: '4px' }}>{data.total_scans}</h2>
        </div>
        <div style={{ display: 'flex', gap: '24px 32px', flexWrap: 'wrap' }}>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Daily Avg (Active Days)</span>
            <h4 style={{ fontSize: '1.25rem', marginTop: '4px' }}>
              {data.daily_scans.length > 0
                ? Math.round(data.total_scans / data.daily_scans.length)
                : 0}
            </h4>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Unique Regions</span>
            <h4 style={{ fontSize: '1.25rem', marginTop: '4px' }}>{data.countries.length}</h4>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Referrer Channels</span>
            <h4 style={{ fontSize: '1.25rem', marginTop: '4px' }}>{data.referrers.length}</h4>
          </div>
        </div>
      </div>

      {/* Scans Over Time Chart Card */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h3 style={{ fontSize: '1.25rem' }}>Daily Scan Activity (Last 30 Days)</h3>
        {renderLineChart()}
      </div>

      {/* Breakdown Grid Row 1 */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {renderDistributionBars('Devices Used', data.devices.map(d => ({ name: d.device, count: d.count })), 'var(--accent-primary)')}
        {renderDistributionBars('Operating Systems', data.operating_systems.map(o => ({ name: o.os, count: o.count })), 'var(--accent-secondary)')}
        {renderDistributionBars('Browsers Used', data.browsers.map(b => ({ name: b.browser, count: b.count })), 'var(--accent-success)')}
      </div>

      {/* Breakdown Grid Row 2 */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {renderDistributionBars('Top Countries', data.countries.map(c => ({ name: c.country, count: c.count })), 'var(--accent-primary)')}
        {renderDistributionBars('Top Cities', data.cities.map(c => ({ name: c.city, count: c.count })), 'var(--accent-secondary)')}
        {renderDistributionBars('Traffic Referrer Channels', data.referrers.map(r => ({ name: r.referrer, count: r.count })), 'var(--accent-warning)')}
      </div>

      {/* Scan Logs Table List */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h3 style={{ fontSize: '1.25rem' }}>Recent Scans Ledger</h3>
        {data.recent_scans.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-secondary)' }}>No scan log ledger items recorded.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '12px 8px' }}>Timestamp</th>
                  <th style={{ padding: '12px 8px' }}>IP Address</th>
                  <th style={{ padding: '12px 8px' }}>Location</th>
                  <th style={{ padding: '12px 8px' }}>Device / OS</th>
                  <th style={{ padding: '12px 8px' }}>Browser</th>
                  <th style={{ padding: '12px 8px' }}>Referrer</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_scans.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                    <td style={{ padding: '12px 8px' }}>{new Date(log.scanned_at).toLocaleString()}</td>
                    <td style={{ padding: '12px 8px', fontFamily: 'var(--font-mono)' }}>{log.ip_address}</td>
                    <td style={{ padding: '12px 8px' }}>{`${log.city}, ${log.country}`}</td>
                    <td style={{ padding: '12px 8px', textTransform: 'capitalize' }}>{`${log.device} (${log.operating_system})`}</td>
                    <td style={{ padding: '12px 8px' }}>{log.browser}</td>
                    <td style={{ padding: '12px 8px' }}>{log.referrer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
