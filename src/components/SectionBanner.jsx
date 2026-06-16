import React from 'react';

// Decorative SVG illustrations — one per tab
const ILLUSTRATIONS = {
  topics: (
    <svg width="110" height="90" viewBox="0 0 110 90" fill="none" aria-hidden="true">
      {/* Parliament dome */}
      <ellipse cx="55" cy="78" rx="42" ry="6" fill="rgba(37,99,235,0.08)" />
      <rect x="18" y="55" width="74" height="24" rx="3" fill="rgba(37,99,235,0.12)" />
      <rect x="25" y="58" width="8" height="18" rx="1" fill="rgba(37,99,235,0.22)" />
      <rect x="37" y="58" width="8" height="18" rx="1" fill="rgba(37,99,235,0.22)" />
      <rect x="49" y="58" width="8" height="18" rx="1" fill="rgba(37,99,235,0.22)" />
      <rect x="61" y="58" width="8" height="18" rx="1" fill="rgba(37,99,235,0.22)" />
      <rect x="73" y="58" width="8" height="18" rx="1" fill="rgba(37,99,235,0.22)" />
      <path d="M18 55 Q55 18 92 55" fill="rgba(37,99,235,0.15)" />
      <rect x="47" y="18" width="16" height="38" rx="2" fill="rgba(37,99,235,0.18)" />
      <circle cx="55" cy="14" r="6" fill="rgba(37,99,235,0.28)" />
      {/* trend lines */}
      <polyline points="10,82 20,72 30,76 42,60 55,65 68,50 80,55 92,40 102,44" stroke="rgba(14,165,233,0.55)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="68" cy="50" r="3" fill="rgba(14,165,233,0.7)" />
    </svg>
  ),

  speakers: (
    <svg width="110" height="90" viewBox="0 0 110 90" fill="none" aria-hidden="true">
      {/* podium */}
      <rect x="38" y="54" width="34" height="24" rx="3" fill="rgba(37,99,235,0.14)" />
      <rect x="32" y="60" width="46" height="4" rx="2" fill="rgba(37,99,235,0.22)" />
      {/* speaker at podium */}
      <circle cx="55" cy="38" r="12" fill="rgba(37,99,235,0.18)" />
      <circle cx="55" cy="36" r="7" fill="rgba(37,99,235,0.35)" />
      <path d="M38 57 Q55 48 72 57" fill="rgba(37,99,235,0.2)" />
      {/* audience dots */}
      <circle cx="18" cy="78" r="5" fill="rgba(37,99,235,0.18)" />
      <circle cx="30" cy="74" r="5" fill="rgba(37,99,235,0.18)" />
      <circle cx="42" cy="78" r="4" fill="rgba(37,99,235,0.12)" />
      <circle cx="68" cy="78" r="5" fill="rgba(37,99,235,0.18)" />
      <circle cx="80" cy="74" r="5" fill="rgba(37,99,235,0.18)" />
      <circle cx="92" cy="78" r="4" fill="rgba(37,99,235,0.12)" />
      {/* speech wave */}
      <path d="M68 34 Q76 28 76 36 Q76 44 68 42" stroke="rgba(14,165,233,0.5)" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M72 30 Q82 22 82 36 Q82 50 72 46" stroke="rgba(14,165,233,0.3)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  ),

  wordcloud: (
    <svg width="110" height="90" viewBox="0 0 110 90" fill="none" aria-hidden="true">
      <text x="12" y="30" fontSize="18" fontWeight="700" fill="rgba(37,99,235,0.45)" fontFamily="system-ui">රාජ්‍ය</text>
      <text x="55" y="22" fontSize="10" fontWeight="600" fill="rgba(14,165,233,0.55)" fontFamily="system-ui">economy</text>
      <text x="8" y="52" fontSize="11" fontWeight="600" fill="rgba(99,102,241,0.5)" fontFamily="system-ui">health</text>
      <text x="58" y="48" fontSize="22" fontWeight="800" fill="rgba(37,99,235,0.38)" fontFamily="system-ui">education</text>
      <text x="14" y="72" fontSize="13" fontWeight="700" fill="rgba(14,165,233,0.45)" fontFamily="system-ui">budget</text>
      <text x="68" y="72" fontSize="9" fontWeight="500" fill="rgba(99,102,241,0.4)" fontFamily="system-ui">water</text>
      <text x="40" y="84" fontSize="8" fontWeight="500" fill="rgba(37,99,235,0.3)" fontFamily="system-ui">agriculture</text>
      <text x="78" y="35" fontSize="9" fontWeight="600" fill="rgba(14,165,233,0.4)" fontFamily="system-ui">fuel</text>
    </svg>
  ),

  sessions: (
    <svg width="110" height="90" viewBox="0 0 110 90" fill="none" aria-hidden="true">
      {/* calendar */}
      <rect x="14" y="18" width="82" height="62" rx="6" fill="rgba(37,99,235,0.1)" stroke="rgba(37,99,235,0.2)" strokeWidth="1.5" />
      <rect x="14" y="18" width="82" height="20" rx="6" fill="rgba(37,99,235,0.2)" />
      <rect x="14" y="30" width="82" height="8" fill="rgba(37,99,235,0.2)" />
      {/* month dots */}
      {[0,1,2,3,4,5,6].map(col => [0,1,2,3].map(row => (
        <rect key={`${col}-${row}`} x={22 + col*11} y={45 + row*10} width="7" height="7" rx="2"
          fill={Math.random() > 0.4 ? 'rgba(37,99,235,0.35)' : 'rgba(37,99,235,0.1)'} />
      )))}
      {/* spike days */}
      <rect x="22" y="45" width="7" height="7" rx="2" fill="rgba(37,99,235,0.7)" />
      <rect x="44" y="55" width="7" height="7" rx="2" fill="rgba(14,165,233,0.7)" />
      <rect x="77" y="45" width="7" height="7" rx="2" fill="rgba(99,102,241,0.7)" />
    </svg>
  ),

  comparative: (
    <svg width="110" height="90" viewBox="0 0 110 90" fill="none" aria-hidden="true">
      {/* two side-by-side bar charts */}
      <rect x="10" y="60" width="12" height="20" rx="2" fill="rgba(37,99,235,0.55)" />
      <rect x="25" y="45" width="12" height="35" rx="2" fill="rgba(37,99,235,0.4)" />
      <rect x="40" y="52" width="12" height="28" rx="2" fill="rgba(37,99,235,0.3)" />
      <rect x="58" y="38" width="12" height="42" rx="2" fill="rgba(14,165,233,0.55)" />
      <rect x="73" y="50" width="12" height="30" rx="2" fill="rgba(14,165,233,0.4)" />
      <rect x="88" y="44" width="12" height="36" rx="2" fill="rgba(14,165,233,0.3)" />
      {/* baseline */}
      <line x1="8" y1="82" x2="102" y2="82" stroke="rgba(37,99,235,0.2)" strokeWidth="1.5" />
      {/* VS divider */}
      <line x1="55" y1="18" x2="55" y2="80" stroke="rgba(37,99,235,0.15)" strokeWidth="1.5" strokeDasharray="4 3" />
      <circle cx="55" cy="14" r="6" fill="rgba(37,99,235,0.15)" />
      <text x="51.5" y="18" fontSize="7" fontWeight="800" fill="rgba(37,99,235,0.6)" fontFamily="system-ui">VS</text>
    </svg>
  ),
};

/**
 * SectionBanner — illustrated header strip shared across all dashboard tabs.
 *
 * Props:
 *   type        — 'topics' | 'speakers' | 'wordcloud' | 'sessions' | 'comparative'
 *   title       — main heading text
 *   subtitle    — supporting description
 *   metrics     — array of { value, label } for the right-hand stat row
 */
export function SectionBanner({ type = 'topics', title, subtitle, metrics = [] }) {
  const illustration = ILLUSTRATIONS[type] || null;

  return (
    <div
      className="section-banner"
      style={{
        background: 'var(--surface-color)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem 1.75rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: 'var(--shadow-sm)',
        gap: '1.5rem',
        flexWrap: 'wrap',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Decorative background tint */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '180px',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(37,99,235,0.03) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Left: text */}
      <div style={{ flex: 1, minWidth: '160px' }}>
        <h3 style={{ margin: '0 0 0.3rem', color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 700 }}>{title}</h3>
        {subtitle && (
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.84rem', lineHeight: 1.5 }}>{subtitle}</p>
        )}
      </div>

      {/* Centre: metric stats */}
      {metrics.length > 0 && (
        <div className="section-banner-metrics" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', flexShrink: 0 }}>
          {metrics.map(({ value, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--primary-color)', lineHeight: 1.1 }}>{value}</div>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.05em', marginTop: '0.15rem' }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Right: illustration */}
      {illustration && (
        <div
          className="section-banner-illustration"
          style={{ flexShrink: 0, opacity: 0.85 }}
        >
          {illustration}
        </div>
      )}
    </div>
  );
}
