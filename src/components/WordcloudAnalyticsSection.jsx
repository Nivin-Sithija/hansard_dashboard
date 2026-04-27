import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Card } from './Card';
import { Cloud, Tag, TrendingUp, Info, Loader2 } from 'lucide-react';
import { readJson } from '../utils/dataPreloader';
import cloud from 'd3-cloud';

// NOTE: Fetches its own data from /public/data/ at runtime.
// This component is React.lazy() loaded — downloaded only when Word Cloud tab is first clicked.

// Vibrant multi-color palette matching the reference image aesthetic
const WORD_PALETTE = [
  '#e63946', '#2a9d8f', '#e76f51', '#457b9d', '#f4a261',
  '#6a4c93', '#2196f3', '#43aa8b', '#f72585', '#4361ee',
  '#06d6a0', '#fb8500', '#8338ec', '#3a86ff', '#d62828',
  '#52b788', '#c77dff', '#0077b6', '#ff6b6b', '#48cae4',
  '#b5838d', '#6d6875', '#e07a5f', '#3d405b', '#81b29a',
];

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function WordCloud({ words, compact = false, width = 700, height = 480 }) {
  const [placed, setPlaced] = useState([]);
  const [layoutKey, setLayoutKey] = useState(0);

  useEffect(() => {
    if (!words || words.length === 0) { setPlaced([]); return; }

    const maxCount = words[0]?.count || 1;
    const minCount = words[words.length - 1]?.count || 1;
    const range = maxCount - minCount || 1;

    const minFs = compact ? 10 : 13;
    const maxFs = compact ? 26 : 68;
    const getFontSize = (count) => Math.round(minFs + ((count - minCount) / range) * (maxFs - minFs));

    const rand = seededRandom(words.map(w => w.word.charCodeAt(0)).reduce((a, b) => a + b, 42));
    const ROTATIONS = [0, 0, 0, 90, -90, 0, 0, 45, -45];

    const layout = cloud()
      .size([width, height])
      .words(words.map((w, i) => ({
        text: w.word,
        size: getFontSize(w.count),
        count: w.count,
        color: WORD_PALETTE[i % WORD_PALETTE.length],
        rotate: compact ? 0 : ROTATIONS[Math.floor(rand() * ROTATIONS.length)],
      })))
      .padding(compact ? 2 : 4)
      .rotate(d => d.rotate)
      .font('Inter, system-ui, sans-serif')
      .fontSize(d => d.size)
      .on('end', (out) => {
        setPlaced(out);
        setLayoutKey(k => k + 1);
      });

    layout.start();
    return () => layout.stop();
  }, [words, compact, width, height]);

  if (!words || words.length === 0) {
    return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>No keyword data available.</div>;
  }

  return (
    <svg
      width={width}
      height={height}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      viewBox={`0 0 ${width} ${height}`}
    >
      <g transform={`translate(${width / 2},${height / 2})`}>
        {placed.map((w, i) => (
          <text
            key={w.text + i}
            textAnchor="middle"
            transform={`translate(${w.x},${w.y}) rotate(${w.rotate})`}
            style={{
              fontSize: `${w.size}px`,
              fontFamily: 'Inter, system-ui, sans-serif',
              fontWeight: w.size > 36 ? 700 : w.size > 22 ? 600 : 500,
              fill: w.color,
              cursor: 'default',
              userSelect: 'none',
              transition: 'opacity 0.2s ease',
            }}
            onMouseEnter={e => {
              if (compact) return;
              e.currentTarget.style.opacity = '0.7';
              e.currentTarget.style.textDecoration = 'underline';
            }}
            onMouseLeave={e => {
              if (compact) return;
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.textDecoration = 'none';
            }}
          >
            <title>{w.text}: {w.count?.toLocaleString()} occurrences</title>
            {w.text}
          </text>
        ))}
      </g>
    </svg>
  );
}

function useContainerWidth(ref) {
  const [w, setW] = useState(700);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) setW(Math.floor(entry.contentRect.width));
    });
    ro.observe(ref.current);
    setW(Math.floor(ref.current.getBoundingClientRect().width));
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

const isValidKeyword = (word) => {
  if (!word || word.trim().length < 2) return false;
  if (/^[\d,.\-/]+$/.test(word)) return false;
  return true;
};

const MAX_WORDS = 120;

export default function WordcloudAnalyticsSection({ evolutionData }) {
  const [keywordsData, setKeywordsData] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState('all');

  useEffect(() => {
    readJson('/data/macro_topic_keywords_100.json')
      .then(setKeywordsData)
      .catch(err => setFetchError(err.message));
  }, []);

  if (fetchError) return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>⚠️ {fetchError}</div>;
  if (!keywordsData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem', gap: '1rem' }}>
        <Loader2 size={36} style={{ color: 'var(--primary-color)', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Loading keyword data…</p>
      </div>
    );
  }

  return <WordcloudInner
    keywordsData={keywordsData}
    evolutionData={evolutionData}
    selectedTopic={selectedTopic}
    setSelectedTopic={setSelectedTopic}
  />;
}

function WordcloudInner({ keywordsData, evolutionData, selectedTopic, setSelectedTopic }) {
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth <= 768 : false));
  const cloudContainerRef = useRef(null);
  const containerWidth = useContainerWidth(cloudContainerRef);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const topicOptions = useMemo(() =>
    Object.keys(keywordsData.count_with_freq || {})
      .sort((a, b) => parseInt(a.replace('Macro-Topic ', '')) - parseInt(b.replace('Macro-Topic ', '')))
  , [keywordsData]);

  const topicColor = useMemo(() => {
    if (selectedTopic === 'all') return [79, 70, 229];
    const id = selectedTopic.replace('Macro-Topic ', '');
    const s = evolutionData.series.find(s => s.mt_id.toString() === id);
    if (s?.styles?.standard_chart?.color_rgba) {
      const [r, g, b] = s.styles.standard_chart.color_rgba;
      return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }
    return [79, 70, 229];
  }, [selectedTopic, evolutionData]);

  const cloudWords = useMemo(() => {
    const cwf = keywordsData.count_with_freq || {};
    let items = [];
    if (selectedTopic === 'all') {
      const combined = {};
      Object.values(cwf).forEach(wordList => {
        wordList.forEach(({ keyword, count }) => {
          if (isValidKeyword(keyword)) combined[keyword] = (combined[keyword] || 0) + count;
        });
      });
      items = Object.entries(combined).map(([word, count]) => ({ word, count }));
    } else {
      items = (cwf[selectedTopic] || [])
        .filter(({ keyword }) => isValidKeyword(keyword))
        .map(({ keyword, count }) => ({ word: keyword, count }));
    }
    const cap = isMobile ? 70 : MAX_WORDS;
    return items.sort((a, b) => b.count - a.count).slice(0, cap);
  }, [selectedTopic, keywordsData, isMobile]);

  const stats = useMemo(() => {
    if (!cloudWords.length) return null;
    return { total: cloudWords.reduce((s, w) => s + w.count, 0), topWord: cloudWords[0]?.word, topCount: cloudWords[0]?.count, uniqueWords: cloudWords.length };
  }, [cloudWords]);

  const topBarWords = cloudWords.slice(0, 15);
  const maxBarCount = topBarWords[0]?.count || 1;
  const [r, g, b] = topicColor;
  const accentColor = `rgb(${r},${g},${b})`;

  const topicLabel = selectedTopic === 'all'
    ? 'All Topics (Global)'
    : (evolutionData.topic_labels[selectedTopic.replace('Macro-Topic ', '')] || selectedTopic);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Overview Banner */}
      <div className="wordcloud-overview-banner" style={{ background: 'var(--surface-color)', padding: '1.25rem 2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-sm)', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-primary)', fontSize: '1.1rem' }}>Word Cloud Analytics</h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Explore parliamentary vocabulary by year and topic. Top {MAX_WORDS} terms shown.</p>
        </div>
        {stats && (
          <div className="wordcloud-overview-metrics" style={{ display: 'flex', gap: '2.5rem', paddingRight: '1rem' }}>
            {[
              { value: stats.uniqueWords, label: 'Unique Terms' },
              { value: stats.total.toLocaleString(), label: 'Total Mentions' },
              { value: stats.topWord, label: `Top Term (${stats.topCount?.toLocaleString()}×)`, small: true },
            ].map(({ value, label, small }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'clamp(1.05rem, 3.8vw, 1.4rem)', fontWeight: 700, color: accentColor, ...(small ? { maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } : {}) }}>{value}</div>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em' }}>{label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', background: 'var(--surface-color)', padding: '1rem 1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.9rem' }}><Tag size={16} /> Topic</div>
        <select value={selectedTopic} onChange={e => setSelectedTopic(e.target.value)} className="select-input" style={{ minWidth: 'min(260px, 100%)' }}>
          <option value="all">All Topics (Global Overview)</option>
          {topicOptions.map(t => {
            const id = t.replace('Macro-Topic ', '');
            const label = evolutionData.topic_labels[id] || t;
            return <option key={t} value={t}>{label.length > 55 ? label.slice(0, 55) + '…' : label}</option>;
          })}
        </select>

        <div style={{ marginLeft: 'auto', padding: '0.35rem 1rem', borderRadius: 'var(--radius-md)', background: `rgba(${r},${g},${b},0.1)`, border: `1px solid rgba(${r},${g},${b},0.3)`, fontSize: '0.82rem', fontWeight: 600, color: accentColor }}>
          {selectedTopic === 'all' ? 'All Topics' : (evolutionData.topic_labels[selectedTopic.replace('Macro-Topic ', '')] || selectedTopic)}
        </div>
      </div>

      {/* Cloud + Bar Chart */}
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div ref={cloudContainerRef} style={{ flex: '2', minWidth: 'min(340px, 100%)' }}>
          <Card title={`Word Cloud — ${topicLabel}`} icon={Cloud}>
            <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
              <Info size={14} /> Hover a word to see its exact count. Word size reflects frequency.
            </div>
            <WordCloud
              words={cloudWords}
              compact={isMobile}
              width={Math.max(containerWidth - 48, 300)}
              height={isMobile ? 320 : 500}
            />
          </Card>
        </div>

        <div style={{ flex: '1', minWidth: 'min(280px, 100%)' }}>
          <Card title="Top 15 Terms by Frequency" icon={TrendingUp}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              {topBarWords.map((w, i) => {
                const pct = ((w.count / maxBarCount) * 100).toFixed(1);
                return (
                  <div key={w.word + i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '24px', fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 700, textAlign: 'right', flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>{w.word}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', flexShrink: 0 }}>{w.count.toLocaleString()}</span>
                      </div>
                      <div style={{ height: '6px', borderRadius: '3px', background: 'var(--border-color)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, borderRadius: '3px', background: `rgba(${r},${g},${b},0.75)`, transition: 'width 0.4s ease' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
