import React, { useMemo, useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Card } from './Card';
import { Layers } from 'lucide-react';

const CustomBarTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <div className="tooltip-item">
          <span className="tooltip-name" style={{ color: '#475569', fontWeight: 600 }}>
            {payload[0].payload.word}
          </span>
          <span className="badge">Value: {payload[0].payload.score}</span>
          <span className="badge" style={{ marginLeft: '0.25rem' }}>Rank: {payload[0].payload.originalRank}</span>
        </div>
      </div>
    );
  }
  return null;
};

export const WordDistributionSection = ({ data, selectedTopicId, evolutionData, selectedTopicsArray = [] }) => {
  const [metric, setMetric] = useState('count'); // 'count' or 'tfidf'
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const chartData = useMemo(() => {
    if (selectedTopicId === 'all') return [];

    const topicsToProcess = selectedTopicId === 'all_cumulative' ? Object.keys(evolutionData.topic_labels) : selectedTopicsArray;

    if ((selectedTopicId === 'cumulative' || selectedTopicId === 'all_cumulative') && topicsToProcess.length > 0) {
      if (metric === 'count' && data['count_with_freq']) {
        const wordScores = {};
        topicsToProcess.forEach(tId => {
          const wordsArray = data['count_with_freq'][`Macro-Topic ${tId}`] || [];
          wordsArray.forEach((item) => {
            if (!/^[0-9,]+$/.test(item.keyword)) {
              wordScores[item.keyword] = (wordScores[item.keyword] || 0) + item.count;
            }
          });
        });
        const sorted = Object.keys(wordScores)
          .map(w => ({ word: w, score: wordScores[w] }))
          .sort((a,b) => b.score - a.score)
          .slice(0, 15);
        return sorted.map((item, index) => ({ word: item.word, score: item.score, originalRank: index + 1 }));
      } else {
        const wordScores = {};
        topicsToProcess.forEach(tId => {
          const wordsArray = data[metric][`Macro-Topic ${tId}`] || [];
          wordsArray.forEach((word, index) => {
            if (!/^[0-9,]+$/.test(word)) {
              wordScores[word] = (wordScores[word] || 0) + (wordsArray.length - index);
            }
          });
        });
        const sorted = Object.keys(wordScores)
          .map(w => ({ word: w, score: wordScores[w] }))
          .sort((a,b) => b.score - a.score)
          .slice(0, 15);
        return sorted.map((item, index) => ({ word: item.word, score: item.score, originalRank: index + 1 }));
      }
    }

    if (metric === 'count' && data['count_with_freq']) {
      const topicKey = `Macro-Topic ${selectedTopicId}`;
      const wordsArray = data['count_with_freq'][topicKey] || [];
      return wordsArray.filter(item => !/^[0-9,]+$/.test(item.keyword)).slice(0, 15).map((item, index) => ({
        word: item.keyword,
        score: item.count,
        originalRank: index + 1
      }));
    } else {
      const topicKey = `Macro-Topic ${selectedTopicId}`;
      const wordsArray = data[metric][topicKey];
      
      if (!wordsArray) return [];

      return wordsArray.filter(word => !/^[0-9,]+$/.test(word)).slice(0, 15).map((word, index) => ({
        word,
        score: wordsArray.length - index,
        originalRank: index + 1
      }));
    }
  }, [data, selectedTopicId, metric, selectedTopicsArray, evolutionData]);

  const topicColorRGB = useMemo(() => {
    if (selectedTopicId === 'cumulative' || selectedTopicId === 'all_cumulative' || selectedTopicId === 'all' || !evolutionData) return 'var(--primary-color)';
    const seriesItem = evolutionData.series.find(s => s.mt_id.toString() === selectedTopicId.toString());
    if (seriesItem && seriesItem.styles) {
      const rgb = seriesItem.styles.standard_chart.color_rgba;
      return `rgb(${rgb[0]*255}, ${rgb[1]*255}, ${rgb[2]*255})`;
    }
    return 'var(--primary-color)';
  }, [selectedTopicId, evolutionData]);

  if (selectedTopicId === 'all') {
    return (
      <Card title="Keyword Distribution" icon={Layers} className="h-full">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', width: '100%' }}>
          <p style={{ color: 'var(--text-secondary)' }}>
            Select a specific Macro-Topic from the top filter to view its keyword distributions.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card title={`Keyword Distribution`} icon={Layers} className="h-full">
      <div className="flex-between" style={{ marginBottom: '1rem' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Top 15 words ranked by {metric === 'count' ? 'occurrence count across speeches' : 'discriminative weight within this topic'}.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={() => setMetric('count')}
            style={{
              padding: '0.25rem 0.75rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500,
              background: metric === 'count' ? 'var(--primary-color)' : 'var(--background-color)',
              color: metric === 'count' ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            Absolute Frequency
          </button>
          <button
            onClick={() => setMetric('tfidf')}
            style={{
              padding: '0.25rem 0.75rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500,
              background: metric === 'tfidf' ? 'var(--primary-color)' : 'var(--background-color)',
              color: metric === 'tfidf' ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            Topic Specificity
          </button>
        </div>
      </div>

      <div className="chart-wrapper" style={{ height: 'clamp(300px, 52vh, 500px)' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 10, right: isMobile ? 8 : 30, left: 10, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
            <XAxis
              type="number"
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              label={{ value: metric === 'count' ? 'Occurrences' : 'Specificity Score', position: 'insideBottomRight', offset: -10, fill: '#94a3b8', fontSize: 11 }}
            />
            <YAxis
              dataKey="word"
              type="category"
              tick={{ fill: '#475569', fontSize: isMobile ? 10 : 12 }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              width={isMobile ? 85 : 160}
            />
            <Tooltip cursor={{ fill: 'rgba(226, 232, 240, 0.4)' }} content={<CustomBarTooltip />} />
            <Bar dataKey="score" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={topicColorRGB} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
