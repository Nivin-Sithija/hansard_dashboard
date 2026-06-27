import React from 'react';
import { getTextLangProps } from '../../lib/language';

function getReadableTextColor(rgb) {
  const [red, green, blue] = rgb;
  const luminance = (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
  return luminance > 168 ? '#1a1813' : '#fffdf8';
}

export function SpeechCard({ speech, topic }) {
  const topicStyle = speech.isNoise || !topic?.color
    ? undefined
    : {
        background: `rgba(${topic.color.join(', ')}, 0.18)`,
        borderColor: `rgba(${topic.color.join(', ')}, 0.4)`,
        color: getReadableTextColor(topic.color),
      };

  return (
    <article className="speech-card">
      <div className="speech-card__meta-row">
        <span className="speech-card__meta-pill">{speech.date}</span>
        <span className="speech-card__meta-pill speech-card__meta-pill--language">{speech.language}</span>
        <span className="speech-card__meta-pill speech-card__meta-pill--topic" style={topicStyle}>{speech.isNoise ? 'Procedural noise' : speech.topicLabel}</span>
      </div>
      <h3 {...getTextLangProps(speech.speaker)}>{speech.speaker}</h3>
      <p {...getTextLangProps(speech.excerpt)}>{speech.excerpt}</p>
      <div className="speech-card__footer">Speech ID | {speech.speechId}</div>
    </article>
  );
}
