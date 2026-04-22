import React, { useState, useEffect, useMemo } from 'react';
import { Card } from './Card';
import { Cloud, Calendar, Tag, TrendingUp, Info, Loader2 } from 'lucide-react';
import { readJson } from '../utils/dataPreloader';

// NOTE: Fetches its own data from /public/data/ at runtime.
// This component is React.lazy() loaded — downloaded only when Word Cloud tab is first clicked.

function WordCloud({ words, topicColor, compact = false }) {
  if (!words || words.length === 0) {
    return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>No keyword data available.</div>;
  }
  const maxCount = words[0]?.count || 1;
  const minCount = words[words.length - 1]?.count || 1;
  const range = maxCount - minCount || 1;
  const getFontSize = (count) => {
    const minFs = compact ? 10 : 12;
    const maxFs = compact ? 24 : 54;
    return Math.round(minFs + ((count - minCount) / range) * (maxFs - minFs));
  };
  const getOpacity = (count) => (0.55 + ((count - minCount) / range) * 0.45).toFixed(2);
  const rotations = [0, 0, 0, -15, 15, -30, 30, -10, 10];
  const getRotation = (idx, count) => compact ? 0 : (((count - minCount) / range) > 0.7 ? 0 : rotations[idx % rotations.length]);
  const [r, g, b] = topicColor || [79, 70, 229];

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: compact ? '0.3rem 0.55rem' : '0.6rem 1rem', alignItems: 'center', justifyContent: 'center', padding: compact ? '0.75rem 0.45rem' : '2rem 1rem', lineHeight: compact ? 1.22 : 1.4, minHeight: compact ? '0' : '320px' }}>
      {words.map((w, idx) => {
        const fs = getFontSize(w.count);
        const op = getOpacity(w.count);
        const rot = getRotation(idx, w.count);
        return (
          <span
            key={w.word + idx}
            title={`${w.word}: ${w.count.toLocaleString()} occurrences`}
            style={{ fontSize: `${fs}px`, fontWeight: fs > 30 ? 700 : fs > 20 ? 600 : 500, color: `rgba(${r},${g},${b},${op})`, transform: `rotate(${rot}deg)`, display: 'inline-block', cursor: 'default', transition: 'all 0.25s ease', padding: '0.1em 0.2em', borderRadius: '4px', userSelect: 'none' }}
            onMouseEnter={e => {
              if (compact) return;
              e.currentTarget.style.color = `rgba(${r},${g},${b},1)`;
              e.currentTarget.style.background = `rgba(${r},${g},${b},0.1)`;
              e.currentTarget.style.transform = 'rotate(0deg) scale(1.1)';
            }}
            onMouseLeave={e => {
              if (compact) return;
              e.currentTarget.style.color = `rgba(${r},${g},${b},${op})`;
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.transform = `rotate(${rot}deg) scale(1)`;
            }}
          >
            {w.word}
          </span>
        );
      })}
    </div>
  );
}

const isValidKeyword = (word) => {
  if (!word || word.trim().length < 2) return false;
  if (/^[\d,.\-/]+$/.test(word)) return false;
  return true;
};

const YEARS = ['All Years', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'];
const MAX_WORDS = 120;

export default function WordcloudAnalyticsSection({ evolutionData }) {
  const [keywordsByYear, setKeywordsByYear] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [selectedYear, setSelectedYear] = useState('All Years');
  const [selectedTopic, setSelectedTopic] = useState('all');

  useEffect(() => {
    readJson('/data/macro_topic_keyword_counts_by_year.json')
      .then(setKeywordsByYear)
      .catch(err => setFetchError(err.message));
  }, []);

  if (fetchError) return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>⚠️ {fetchError}</div>;
  if (!keywordsByYear) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem', gap: '1rem' }}>
        <Loader2 size={36} style={{ color: 'var(--primary-color)', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Loading keyword index (812 KB)…</p>
      </div>
    );
  }

  return <WordcloudInner
    keywordsByYear={keywordsByYear}
    evolutionData={evolutionData}
    selectedYear={selectedYear}
    setSelectedYear={setSelectedYear}
    selectedTopic={selectedTopic}
    setSelectedTopic={setSelectedTopic}
  />;
}

function WordcloudInner({ keywordsByYear, evolutionData, selectedYear, setSelectedYear, selectedTopic, setSelectedTopic }) {
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth <= 768 : false));

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const topicOptions = useMemo(() =>
    Object.keys(keywordsByYear.topic_keyword_counts_by_year)
      .sort((a, b) => parseInt(a.replace('Macro-Topic ', '')) - parseInt(b.replace('Macro-Topic ', '')))
  , [keywordsByYear]);

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
    const counts = {};
    if (selectedTopic === 'all') {
      const globalData = keywordsByYear.global_keyword_counts_by_year;
      const years = selectedYear === 'All Years' ? Object.keys(globalData) : [selectedYear];
      years.forEach(yr => {
        const kc = globalData[yr]?.keyword_counts;
        if (!kc) return;
        Object.entries(kc).forEach(([word, count]) => { if (isValidKeyword(word)) counts[word] = (counts[word] || 0) + count; });
      });
    } else {
      const topicData = keywordsByYear.topic_keyword_counts_by_year[selectedTopic];
      const years = selectedYear === 'All Years' ? Object.keys(topicData || {}) : [selectedYear];
      years.forEach(yr => {
        const kc = topicData?.[yr]?.keyword_counts;
        if (!kc) return;
        Object.entries(kc).forEach(([word, count]) => { if (isValidKeyword(word)) counts[word] = (counts[word] || 0) + count; });
      });
    }
    const cap = isMobile ? 70 : MAX_WORDS;
    return Object.entries(counts).map(([word, count]) => ({ word, count })).sort((a, b) => b.count - a.count).slice(0, cap);
  }, [selectedYear, selectedTopic, keywordsByYear, isMobile]);

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
      <div style={{ background: 'var(--surface-color)', padding: '1.25rem 2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-sm)', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-primary)', fontSize: '1.1rem' }}>Word Cloud Analytics</h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Explore parliamentary vocabulary by year and topic. Top {MAX_WORDS} terms shown.</p>
        </div>
        {stats && (
          <div style={{ display: 'flex', gap: '2.5rem', paddingRight: '1rem' }}>
            {[
              { value: stats.uniqueWords, label: 'Unique Terms' },
              { value: stats.total.toLocaleString(), label: 'Total Mentions' },
              { value: stats.topWord, label: `Top Term (${stats.topCount?.toLocaleString()}×)`, small: true },
            ].map(({ value, label, small }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'clamp(1.05rem, 3.8vw, 1.4rem)', fontWeight: 700, color: accentColor, ...(small ? { maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } : {}) }}>{value}</div>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em' }}>{label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', background: 'var(--surface-color)', padding: '1rem 1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.9rem' }}><Calendar size={16} /> Year</div>
        <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="select-input" style={{ minWidth: 'min(140px, 100%)' }}>
          {YEARS.map(yr => <option key={yr} value={yr}>{yr}</option>)}
        </select>

        <div style={{ width: '1px', height: '28px', background: 'var(--border-color)', margin: '0 0.5rem' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.9rem' }}><Tag size={16} /> Topic</div>
        <select value={selectedTopic} onChange={e => setSelectedTopic(e.target.value)} className="select-input" style={{ minWidth: 'min(260px, 100%)' }}>
          <option value="all">All Topics (Global Overview)</option>
          {topicOptions.map(t => {
            const id = t.replace('Macro-Topic ', '');
            const label = evolutionData.topic_labels[id] || t;
            return <option key={t} value={t}>MT-{id}: {label.length > 55 ? label.slice(0, 55) + '…' : label}</option>;
          })}
        </select>

        <div style={{ marginLeft: 'auto', padding: '0.35rem 1rem', borderRadius: 'var(--radius-md)', background: `rgba(${r},${g},${b},0.1)`, border: `1px solid rgba(${r},${g},${b},0.3)`, fontSize: '0.82rem', fontWeight: 600, color: accentColor }}>
          {selectedYear} · {selectedTopic === 'all' ? 'Global' : `MT-${selectedTopic.replace('Macro-Topic ', '')}`}
        </div>
      </div>

      {/* Cloud + Bar Chart */}
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: '2', minWidth: 'min(340px, 100%)' }}>
          <Card title={`Word Cloud — ${topicLabel}`} icon={Cloud}>
            <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
              <Info size={14} /> Hover a word to see its exact count. Word size reflects frequency.
            </div>
            <WordCloud words={cloudWords} topicColor={topicColor} compact={isMobile} />
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
