import React, { useMemo } from 'react';
import * as d3 from 'd3';

export function D3TimelineChart({ temporalData, selectedTopicKeys, onToggleTopic, height = 420 }) {
  const years = temporalData.years;
  const selectedSet = new Set(selectedTopicKeys);
  const activeSeries = temporalData.series.filter((item) => selectedSet.size === 0 || selectedSet.has(String(item.mt_id)));

  const chart = useMemo(() => {
    const width = 980;
    const margin = { top: 56, right: 28, bottom: 44, left: 56 };
    const x = d3.scaleLinear().domain(d3.extent(years)).range([margin.left, width - margin.right]);
    const maxY = d3.max(activeSeries, (series) => d3.max(series.points, (point) => point.count)) || 0;
    const y = d3.scaleLinear().domain([0, maxY * 1.12 || 10]).nice().range([height - margin.bottom, margin.top]);
    const line = d3.line().x((point) => x(point.year)).y((point) => y(point.count)).curve(d3.curveMonotoneX);
    return { width, margin, x, y, line };
  }, [activeSeries, height, years]);

  return (
    <div className="chart-shell">
      <svg className="chart-svg" viewBox={`0 0 ${chart.width} ${height}`} role="img" aria-label="Macro-topic attention over time">
        <g>
          {chart.y.ticks(5).map((tick) => (
            <g key={tick}>
              <line className="chart-gridline" x1={chart.margin.left} x2={chart.width - chart.margin.right} y1={chart.y(tick)} y2={chart.y(tick)} />
              <text className="chart-axis-label" x={chart.margin.left - 10} y={chart.y(tick) + 4} textAnchor="end">{tick}</text>
            </g>
          ))}
          {years.map((year) => (
            <g key={year}>
              <line className="chart-axis-line" x1={chart.x(year)} x2={chart.x(year)} y1={height - chart.margin.bottom} y2={height - chart.margin.bottom + 6} />
              <text className="chart-axis-label" x={chart.x(year)} y={height - chart.margin.bottom + 22} textAnchor="middle">{year}</text>
            </g>
          ))}
          {temporalData.events.map((event) => (
            <g key={event.year}>
              <line className="chart-event-line" x1={chart.x(event.year)} x2={chart.x(event.year)} y1={chart.margin.top - 20} y2={height - chart.margin.bottom} />
              <text className="chart-event-label" x={chart.x(event.year)} y={chart.margin.top - 28} textAnchor="middle">{event.label}</text>
            </g>
          ))}
          {activeSeries.map((series) => {
            const color = `rgb(${series.styles.standard_chart.color_rgba.map((value) => Math.round(value * 255)).join(', ')})`;
            return (
              <g key={series.mt_id}>
                <path d={chart.line(series.points)} fill="none" stroke={color} strokeWidth={selectedSet.has(String(series.mt_id)) ? 3.5 : 2.2} opacity={selectedSet.size > 0 && !selectedSet.has(String(series.mt_id)) ? 0.22 : 0.92} />
                {series.points.map((point) => (
                  <circle key={`${series.mt_id}-${point.year}`} cx={chart.x(point.year)} cy={chart.y(point.count)} r={selectedSet.has(String(series.mt_id)) ? 4 : 2.4} fill={color} className="chart-point" onClick={() => onToggleTopic(String(series.mt_id))} />
                ))}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
