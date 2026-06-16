import React from 'react';

/**
 * HeroBanner — full-width opening banner shown at the top of the dashboard.
 *
 * Uses mix-blend-mode: multiply on both images so their white backgrounds
 * vanish on the white surface, leaving only the mace and building illustration.
 *
 * Props:
 *   totalSpeeches    — number, total clustered speech count
 *   macroTopicCount  — number, count of ML topic clusters
 */
export function HeroBanner() {
  return (
    <div
      className="hero-banner"
      role="banner"
      style={{
        position: 'relative',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        background: '#ffffff',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-md)',
        marginBottom: '1.5rem',
      }}
    >
      {/* Parliament building — right-side watermark via multiply blend */}
      <img
        src="/images/banner/bg.png"
        alt=""
        aria-hidden="true"
        className="hero-banner-building"
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          height: '115%',
          width: '45%',
          objectFit: 'contain',
          objectPosition: 'bottom right',
          mixBlendMode: 'multiply',
          opacity: 0.6,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      />

      {/* Fade-out vignette so building doesn't bleed into the left text */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, #ffffff 52%, rgba(255,255,255,0.5) 62%, rgba(255,255,255,0) 72%)',
          pointerEvents: 'none',
        }}
      />

      {/* Content row */}
      <div
        className="hero-banner-content"
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: '1.75rem',
          padding: '1.6rem 2rem',
        }}
      >
        {/* Parliament of Sri Lanka mace logo */}
        <img
          src="/images/banner/logo_en.png"
          alt="Parliament of Sri Lanka"
          className="hero-banner-logo"
          style={{
            height: '80px',
            width: 'auto',
            flexShrink: 0,
            mixBlendMode: 'multiply',
          }}
        />

        {/* Vertical rule */}
        <div
          className="hero-banner-divider"
          aria-hidden="true"
          style={{
            width: '1px',
            height: '68px',
            background: 'var(--border-color)',
            flexShrink: 0,
          }}
        />

        {/* Text block */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            className="hero-banner-eyebrow"
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              color: 'var(--primary-color)',
              textTransform: 'uppercase',
              letterSpacing: '0.13em',
              marginBottom: '0.35rem',
            }}
          >
            Sri Lanka Parliamentary Hansard · Debates &amp; Speeches
          </div>

          <h2
            style={{
              margin: '0 0 0.75rem',
              fontSize: '1.5rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.015em',
              lineHeight: 1.15,
            }}
          >
            Hansard Analytics Dashboard
          </h2>

          <p
            style={{
              margin: '0 0 0.9rem',
              color: 'var(--text-secondary)',
              fontSize: '0.85rem',
              lineHeight: 1.55,
              maxWidth: '75%',
            }}
          >
            Trilingual topic modeling of parliamentary debates — an NLP analysis using embeddings and clustering to track how parliamentary attention has shifted in response to major national events.
          </p>


        </div>
      </div>
    </div>
  );
}
