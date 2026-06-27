import React, { useMemo } from 'react';
import * as d3 from 'd3';

const LANGUAGE_COLORS = { Sinhala: '#0f766e', Tamil: '#d97706', English: '#8b5cf6', Mixed: '#334155' };

export function D3LanguageMixChart({ counts = {} }) {
  const chart = useMemo(() => {
    const entries = Object.entries(counts)
      .filter(([, value]) => value > 0)
      .sort((left, right) => right[1] - left[1]);
    const total = d3.sum(entries, ([, value]) => value) || 1;
    return entries.map(([label, value]) => ({
      label,
      value,
      color: LANGUAGE_COLORS[label] || '#64748b',
      percent: Math.round((value / total) * 100),
    }));
  }, [counts]);

  return (
    <div className="language-mix-chart" role="img" aria-label="Language composition">
      <div className="language-mix-chart__bar" aria-hidden="true">
        {chart.map((segment) => (
          <span
            key={segment.label}
            className="language-mix-chart__segment"
            style={{ width: `${segment.percent}%`, background: segment.color }}
          />
        ))}
      </div>
      <div className="language-mix-chart__list">
        {chart.map((segment) => (
          <div key={segment.label} className="language-mix-chart__item">
            <span className="language-mix-chart__swatch" style={{ background: segment.color }} />
            <strong>{segment.label}</strong>
            <span>{segment.percent}% · {segment.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
