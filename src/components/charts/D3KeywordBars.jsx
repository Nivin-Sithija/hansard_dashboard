import React, { useMemo } from 'react';
import * as d3 from 'd3';

export function D3KeywordBars({ keywords = [] }) {
  const chart = useMemo(() => {
    const width = 540;
    const rowHeight = 28;
    const margin = { top: 12, right: 12, bottom: 12, left: 120 };
    const data = keywords.slice(0, 8).map((keyword, index) => ({ keyword, score: keywords.length - index }));
    const height = margin.top + margin.bottom + rowHeight * data.length;
    const x = d3.scaleLinear().domain([0, d3.max(data, (item) => item.score) || 1]).range([margin.left, width - margin.right]);
    const y = d3.scaleBand().domain(data.map((item) => item.keyword)).range([margin.top, height - margin.bottom]).padding(0.18);
    return { width, height, margin, data, x, y };
  }, [keywords]);

  return (
    <svg className="chart-svg chart-svg--compact" viewBox={`0 0 ${chart.width} ${chart.height}`} role="img" aria-label="Top topic keywords">
      {chart.data.map((item) => (
        <g key={item.keyword}>
          <text className="chart-axis-label" x={chart.margin.left - 10} y={(chart.y(item.keyword) || 0) + chart.y.bandwidth() / 2 + 4} textAnchor="end">{item.keyword}</text>
          <rect x={chart.margin.left} y={chart.y(item.keyword)} width={chart.x(item.score) - chart.margin.left} height={chart.y.bandwidth()} rx="8" fill="url(#keyword-gradient)" />
        </g>
      ))}
      <defs>
        <linearGradient id="keyword-gradient" x1="0%" x2="100%" y1="0%" y2="0%">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#0f766e" />
        </linearGradient>
      </defs>
    </svg>
  );
}
