import React from 'react';
import { compactList, formatNumber, rgb } from '../../lib/format';

export function TopicCard({ topic, onSelect }) {
  return (
    <button type="button" className="topic-card" onClick={() => onSelect?.(topic.topicKey)}>
      <div className="topic-card__accent" style={{ background: rgb(topic.color) }} />
      <div className="topic-card__body">
        <div className="topic-card__eyebrow">Macro-topic {topic.topicId}</div>
        <h3>{topic.topicLabel}</h3>
        <p>{formatNumber(topic.totalSpeeches)} speeches · peak in {topic.peakYear}</p>
        <div className="topic-card__keywords">{compactList(topic.keywords, 4)}</div>
      </div>
    </button>
  );
}
