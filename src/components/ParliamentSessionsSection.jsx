import React, { useState, useEffect, useMemo } from 'react';
import { Card } from './Card';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid
} from 'recharts';
import { Calendar, Users, TrendingUp, Loader2, BarChart2 } from 'lucide-react';
import { readJson } from '../utils/dataPreloader';

const YEARS_RANGE = ['2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'];

export default function ParliamentSessionsSection() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState('All');

  useEffect(() => {
    readJson('/data/parliament_sessions_summary.json')
      .then(setStats)
      .catch(err => setError(err.message));
  }, []);

  // ── Top 10 speakers for selected year ──
  const topSpeakers = useMemo(() => {
    if (!stats) return [];
    const source = selectedYear === 'All'
      ? Object.entries(stats.speakerByYear).reduce((acc, [, spk]) => {
          Object.entries(spk).forEach(([s, c]) => { acc[s] = (acc[s] || 0) + c; });
          return acc;
        }, {})
      : (stats.speakerByYear[selectedYear] || {});
    return Object.entries(source)
      .filter(([sp]) => sp !== 'Unknown Speaker')
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([speaker, count]) => ({ speaker, count }));
  }, [stats, selectedYear]);

  if (!stats && !error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem', gap: '1rem' }}>
        <Loader2 size={36} style={{ color: 'var(--primary-color)', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Loading parliament session summary…</p>
      </div>
    );
  }
  if (error) return <div style={{ color: 'var(--text-secondary)', padding: '4rem', textAlign: 'center' }}>⚠️ {error}</div>;
  if (!stats) return null;

  const maxBar = Math.max(...topSpeakers.map(s => s.count), 1);
  const speakerBarPalette = [
    'rgba(37, 99, 235, 0.85)',
    'rgba(59, 130, 246, 0.85)',
    'rgba(14, 165, 233, 0.85)',
    'rgba(6, 182, 212, 0.85)',
    'rgba(99, 102, 241, 0.85)',
  ];

  const tooltipStyle = {
    backgroundColor: 'var(--surface-color)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    boxShadow: 'var(--shadow-md)',
    opacity: 0.98,
  };
  const tooltipLabelStyle = { color: 'var(--text-primary)', fontWeight: 700 };
  const tooltipItemStyle = { color: 'var(--text-primary)', fontWeight: 600 };

  return (
    <div className="sessions-section" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* ── Overview Banner ── */}
      <div className="sessions-overview-banner" style={{ background: 'var(--surface-color)', padding: '1.25rem 2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-sm)', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ margin: '0 0 0.25rem', color: 'var(--text-primary)', fontSize: '1.1rem' }}>Parliament Session Overview</h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Sri Lanka Parliament speech activity, 2017–2026 (9th Parliament).</p>
        </div>
        <div className="sessions-overview-metrics" style={{ display: 'flex', gap: '2.5rem', paddingRight: '1rem', flexWrap: 'wrap' }}>
          {[
            { value: stats.total.toLocaleString(), label: 'Total Speeches' },
            { value: stats.totalSessions.toLocaleString(), label: 'Unique Sessions' },
            { value: (stats.total / stats.totalSessions).toFixed(1), label: 'Avg / Session' },
            { value: Object.keys(stats.uniqueByYearCounts || {}).reduce((max, y) => ((stats.uniqueByYearCounts?.[y] || 0) > (stats.uniqueByYearCounts?.[max] || 0) ? y : max), ''), label: 'Peak Activity Year' },
          ].map(({ value, label }) => (
            <div key={label} className="sessions-overview-metric" style={{ textAlign: 'center' }}>
              <div className="sessions-overview-value stat-num" style={{ fontSize: '1.5rem' }}>{value}</div>
              <div className="sessions-overview-label" style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Year Charts Row ── */}
      <div className="grid-2">
        <Card title="Speeches per Year" icon={BarChart2}>
          <div style={{ height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.yearData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
                <Bar dataKey="speeches" name="Speeches" fill="rgba(37, 99, 235, 0.78)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Unique Speakers per Year" icon={Users}>
          <div style={{ height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.yearData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
                <Line type="monotone" dataKey="speakers" name="Unique Speakers" stroke="var(--primary-color)" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2, fill: 'var(--surface-color)' }} activeDot={{ r: 6, fill: 'var(--primary-color)' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* ── Monthly aggregated bar chart ── */}
      <Card title="Speeches by Month (All Years Combined)" icon={Calendar}>
        <div style={{ height: '210px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.monthData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} />
              <Bar dataKey="count" name="Speeches" fill="rgba(59, 130, 246, 0.72)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* ── Top 10 Speakers ── */}
      <Card title="Most Active Speakers" icon={TrendingUp}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>Filter by Year:</span>
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="select-input" style={{ minWidth: 'min(130px, 100%)' }}>
            <option value="All">All Years</option>
            {YEARS_RANGE.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          {topSpeakers.map((sp, i) => (
            <div key={sp.speaker} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ width: '22px', fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 700, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>{sp.speaker}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', flexShrink: 0 }}>{sp.count.toLocaleString()}</span>
                </div>
                <div style={{ height: '6px', borderRadius: '3px', background: 'var(--border-color)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${(sp.count / maxBar) * 100}%`,
                      borderRadius: '3px',
                      background: speakerBarPalette[i % speakerBarPalette.length],
                      transition: 'width 0.5s ease'
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Busiest Sessions ── */}
      <Card title="Busiest Individual Sessions" icon={Calendar}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {stats.busiestDays.map((d, i) => (
            <div key={d.date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 1rem', background: 'var(--background-color)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>#{i + 1} — {d.date}</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'var(--border-color)', padding: '0.15rem 0.6rem', borderRadius: '9999px', fontWeight: 600 }}>{d.count} speeches</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
