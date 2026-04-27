import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';

const DistributionTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;

  const item = payload[0].payload;
  return (
    <div className="custom-tooltip" style={{ maxWidth: '300px' }}>
      <div className="label" style={{ marginBottom: '0.4rem', fontWeight: 700 }}>{item.shortLabel}</div>
      <div style={{ color: '#475569', fontSize: '0.85rem', marginBottom: '0.35rem' }}>{item.fullLabel}</div>
      <div className="tooltip-item">
        <span className="tooltip-name">Total speeches</span>
        <span className="tooltip-value">{item.total.toLocaleString()}</span>
      </div>
      <div className="tooltip-item">
        <span className="tooltip-name">Corpus share</span>
        <span className="tooltip-value">{item.share.toFixed(1)}%</span>
      </div>
    </div>
  );
};

export const TopTopicDistributionChart = ({ data }) => {
  const chartData = useMemo(() => {
    const series = data?.series || [];
    const totals = series.map((topic) => {
      const total = topic.points.reduce((sum, point) => sum + point.count, 0);
      const rgb = topic.styles?.standard_chart?.color_rgba || [0.35, 0.45, 0.65];

      return {
        mtId: topic.mt_id,
        shortLabel: `MT-${topic.mt_id}`,
        fullLabel: topic.label,
        total,
        color: `rgb(${rgb[0] * 255}, ${rgb[1] * 255}, ${rgb[2] * 255})`,
      };
    });

    const corpusTotal = totals.reduce((sum, item) => sum + item.total, 0);

    return totals
      .sort((a, b) => b.total - a.total)
      .slice(0, 6)
      .map((item) => ({
        ...item,
        share: corpusTotal > 0 ? (item.total / corpusTotal) * 100 : 0,
      }));
  }, [data]);

  return (
    <div style={{ height: 'clamp(280px, 50vh, 420px)', width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis
            dataKey="shortLabel"
            tick={{ fill: '#64748b', fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
            width={52}
          />
          <Tooltip content={<DistributionTooltip />} />
          <Bar dataKey="total" radius={[8, 8, 0, 0]}>
            {chartData.map((entry) => (
              <Cell key={entry.mtId} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
