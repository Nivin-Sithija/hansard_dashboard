import React, { useMemo } from 'react';
import * as d3 from 'd3';

const LANGUAGE_COLORS = { Sinhala: '#0f766e', Tamil: '#d97706', English: '#8b5cf6', Mixed: '#334155' };

export function D3LanguageMixChart({ counts = {} }) {
  const chart = useMemo(() => {
    const width = 540;
    const height = 72;
    const margin = { top: 16, right: 16, bottom: 16, left: 16 };
    const entries = Object.entries(counts).filter(([, value]) => value > 0);
    const total = d3.sum(entries, ([, value]) => value) || 1;
    const x = d3.scaleLinear().domain([0, total]).range([margin.left, width - margin.right]);
    let running = 0;
    const segments = entries.map(([label, value]) => {
      const start = x(running);
      running += value;
      const end = x(running);
      return { label, value, start, end, center: start + (end - start) / 2, percent: Math.round((value / total) * 100) };
    });
    return { width, height, segments };
  }, [counts]);

  return (
    <svg className="chart-svg chart-svg--compact" viewBox={`0 0 ${chart.width} ${chart.height}`} role="img" aria-label="Language composition">
      {chart.segments.map((segment) => (
        <g key={segment.label}>
          <rect x={segment.start} y={18} width={Math.max(segment.end - segment.start, 2)} height={20} rx="8" fill={LANGUAGE_COLORS[segment.label] || '#64748b'} />
          <text className="chart-axis-label" x={segment.center} y={52} textAnchor="middle">{segment.label} · {segment.percent}%</text>
        </g>
      ))}
    </svg>
  );
}
