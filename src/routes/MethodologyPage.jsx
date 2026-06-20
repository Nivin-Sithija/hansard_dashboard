import React from 'react';

const METHOD_STEPS = [
  {
    title: 'Source capture',
    body: 'Parliamentary debate PDFs were collected and converted into machine-readable text so the study could work across a decade of proceedings rather than a hand-picked sample.',
  },
  {
    title: 'Multilingual extraction and cleanup',
    body: 'Speech segments were cleaned, language-mixed text was preserved, and speaker identities were normalized so Sinhala, Tamil, and English evidence could live in the same analytical space.',
  },
  {
    title: 'Shared embedding space',
    body: 'BGE-M3 multilingual embeddings were used to place speeches into one semantic space, allowing theme similarity to matter more than script boundaries alone.',
  },
  {
    title: 'Density-based clustering',
    body: 'UMAP and HDBSCAN grouped speeches into coherent regions while also leaving some procedural or weak-signal items unclustered as noise.',
  },
  {
    title: 'Macro-topic framing',
    body: 'The cluster output was consolidated into 30 macro-topics so the public-facing explorer can tell a readable story without exposing every raw model artifact first.',
  },
];

const INTERPRETATION_RULES = [
  'A macro-topic is a discourse family, not a single policy bill or one-to-one label from Parliament.',
  'Procedural noise is expected in parliamentary corpora and should not be interpreted as a failed model outcome.',
  'Keywords are signals for interpretation, not standalone proof. Always pair them with sample speeches and speaker patterns.',
  'Topic prominence reflects modeled speech counts in the clustered corpus, not ground-truth importance in society.',
  'Mixed-language speeches are analytically valuable because they show debate crossing script boundaries instead of being forced into monolingual buckets.',
];

export default function MethodologyPage() {
  return (
    <div className="page-stack">
      <section className="page-header editorial-panel">
        <div className="section-heading">
          <div className="section-heading__eyebrow">Methodology</div>
          <h1>Read the explorer as evidence from a multilingual topic-modeling pipeline, not as an oracle.</h1>
          <p>This route translates the paper into plain-language research logic so public users can understand what the interface is showing, what it is not showing, and how to interpret signals responsibly.</p>
        </div>
      </section>

      <section className="hero-panel methodology-hero">
        <div className="hero-panel__copy">
          <div className="hero-panel__label">What the paper contributes</div>
          <h2>A trilingual parliamentary map of agenda shifts across Sinhala, Tamil, and English debates.</h2>
          <p>The central value of the project is that theme discovery happens across languages instead of inside separate monolingual silos, which makes cross-lingual political attention visible in a way the raw corpus does not.</p>
        </div>
        <div className="hero-panel__method-card">
          <div className="hero-panel__method-label">Use this route to answer</div>
          <ol>
            <li>What counts as a macro-topic?</li>
            <li>Why are some speeches marked as procedural noise?</li>
            <li>Why do multilingual embeddings matter here?</li>
            <li>How should non-expert readers interpret the charts?</li>
          </ol>
        </div>
      </section>

      <section className="editorial-panel">
        <div className="section-heading">
          <div className="section-heading__eyebrow">Pipeline</div>
          <h2>Five steps from scanned debates to public exploration</h2>
        </div>
        <div className="methodology-timeline">
          {METHOD_STEPS.map((step, index) => (
            <article key={step.title} className="method-step-card">
              <div className="method-step-card__index">0{index + 1}</div>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="story-grid">
        <article className="editorial-panel">
          <div className="section-heading">
            <div className="section-heading__eyebrow">Interpretation rules</div>
            <h2>How the next developer should present findings</h2>
          </div>
          <div className="rule-list">
            {INTERPRETATION_RULES.map((rule) => <p key={rule}>{rule}</p>)}
          </div>
        </article>

        <article className="editorial-panel editorial-panel--muted">
          <div className="section-heading">
            <div className="section-heading__eyebrow">Frontend content contract</div>
            <h2>What belongs on public pages</h2>
          </div>
          <div className="rule-list">
            <p>Lead with findings, evidence, and annotated interpretation before exposing modeling jargon.</p>
            <p>Pair every major quantitative view with sample speeches, topic labels, or speaker evidence.</p>
            <p>Use the multilingual font stack whenever rendering source-like excerpts or names.</p>
            <p>Keep raw implementation details, parameter choices, and full reproducibility notes expandable rather than dominant.</p>
            <p>When adding event links, cite external sources clearly and distinguish source evidence from model inference.</p>
          </div>
        </article>
      </section>
    </div>
  );
}
