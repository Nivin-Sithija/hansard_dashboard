import React from 'react';

export function SpeechCard({ speech }) {
  return (
    <article className="speech-card">
      <div className="speech-card__meta-row">
        <span>{speech.date}</span>
        <span>{speech.language}</span>
        <span>{speech.isNoise ? 'Procedural noise' : speech.topicLabel}</span>
      </div>
      <h3>{speech.speaker}</h3>
      <p>{speech.excerpt}</p>
      <div className="speech-card__footer">Speech ID · {speech.speechId}</div>
    </article>
  );
}
