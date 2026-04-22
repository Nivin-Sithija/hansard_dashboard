import React, { useEffect, useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Label
} from 'recharts';

// Transformer to convert series data to Recharts format
const transformDataForRecharts = (series, years) => {
  return years.map(year => {
    const dataPoint = { year: year.toString() };
    series.forEach(s => {
      const point = s.points.find(p => p.year === year);
      dataPoint[s.label] = point ? point.count : 0;
    });
    return dataPoint;
  });
};

const CustomTooltip = ({ active, payload, label, isMobile = false }) => {
  if (active && payload && payload.length) {
    // Sort payload by value descending for the tooltip
    const sortedPayload = [...payload].sort((a, b) => b.value - a.value);
    const maxVisibleItems = isMobile ? 6 : sortedPayload.length;
    const visiblePayload = sortedPayload.slice(0, maxVisibleItems);
    const remainingCount = sortedPayload.length - visiblePayload.length;

    return (
      <div
        className="custom-tooltip"
        style={{ maxWidth: isMobile ? '220px' : '360px', padding: isMobile ? '0.6rem' : undefined }}
      >
        <div className="label">Year: {label}</div>
        <div style={{ maxHeight: isMobile ? '120px' : '250px', overflowY: 'auto', paddingRight: isMobile ? '4px' : '10px' }}>
          {visiblePayload.map((entry, index) => (
            <div key={`item-${index}`} className="tooltip-item">
              <span
                className="color-dot"
                style={{ backgroundColor: entry.color }}
              ></span>
              <span className="tooltip-name" style={{ color: '#475569', maxWidth: isMobile ? '110px' : '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={entry.name}>
                {entry.name}
              </span>
              <span className="tooltip-value">{entry.value}</span>
            </div>
          ))}
          {remainingCount > 0 && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              +{remainingCount} more topics
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const TemporalEvolutionChart = ({ data, selectedTopics = [], onTopicSelect }) => {
  const { series, years, meta } = data;
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth <= 768 : false));

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const chartData = useMemo(() => transformDataForRecharts(series, years), [series, years]);
  const activeSeries = selectedTopics.length > 0
    ? series.filter(s => selectedTopics.includes(s.mt_id.toString()))
    : series;
  const showLegend = selectedTopics.length === 0 && !isMobile;
  const showEventLabels = !isMobile;

  return (
    <div className="chart-wrapper">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: showEventLabels ? 60 : 18, right: isMobile ? 8 : 30, left: 0, bottom: isMobile ? 8 : 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis
            dataKey="year"
            tick={{ fill: '#64748b', fontSize: isMobile ? 10 : 12 }}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
            padding={{ left: isMobile ? 4 : 20, right: isMobile ? 4 : 20 }}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: isMobile ? 10 : 12 }}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
            width={isMobile ? 34 : 44}
            label={!isMobile ? { value: meta?.y_metric || 'Count', angle: -90, position: 'insideLeft', style: { fill: '#64748b' } } : undefined}
          />
          <Tooltip content={<CustomTooltip isMobile={isMobile} />} wrapperStyle={{ pointerEvents: 'auto' }} />

          {data.events?.map((event, index) => (
            <ReferenceLine
              key={`event-${index}`}
              x={event.year.toString()}
              stroke="#94a3b8"
              strokeDasharray="3 3"
            >
              {showEventLabels && (
                <Label
                  value={event.label}
                  position="top"
                  fill="#1e293b"
                  fontSize={11}
                  fontWeight={600}
                  offset={index % 2 === 0 ? 10 : 35}
                />
              )}
            </ReferenceLine>
          ))}

          {showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: '20px', fontSize: '11px', lineHeight: '1.2' }}
              iconType="circle"
              iconSize={6}
            />
          )}

          {activeSeries.map(s => {
            const rgb = s.styles.standard_chart.color_rgba;
            // Convert array of [r,g,b] (0-1) to css rgb
            const color = `rgb(${rgb[0] * 255}, ${rgb[1] * 255}, ${rgb[2] * 255})`;

            return (
              <Line
                key={s.mt_id}
                type="monotone"
                dataKey={s.label}
                stroke={color}
                strokeWidth={selectedTopics.includes(s.mt_id.toString()) ? (isMobile ? 3 : 4) : (isMobile ? 1.5 : 2)}
                dot={{ r: selectedTopics.includes(s.mt_id.toString()) ? (isMobile ? 4 : 6) : 0, onClick: () => { if (onTopicSelect) onTopicSelect(s.mt_id.toString()); } }}
                activeDot={{ r: isMobile ? 5 : 8, cursor: 'pointer', onClick: () => { if (onTopicSelect) onTopicSelect(s.mt_id.toString()); } }}
                isAnimationActive={true}
                opacity={selectedTopics.length > 0 && !selectedTopics.includes(s.mt_id.toString()) ? 0.3 : 1}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
