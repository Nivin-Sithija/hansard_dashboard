import React from 'react';

export default function PlaceholderPage({ title, description }) {
  return (
    <section className="editorial-panel placeholder-page">
      <div className="section-heading">
        <div className="section-heading__eyebrow">Reserved route</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </section>
  );
}
