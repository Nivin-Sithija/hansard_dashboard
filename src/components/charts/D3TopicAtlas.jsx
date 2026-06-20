import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';

export function D3TopicAtlas({ points, topicMetadata, selectedSpeechId, onSelectSpeech, onHoverSpeech }) {
  const svgRef = useRef(null);
  const [transform, setTransform] = useState(d3.zoomIdentity);

  const scene = useMemo(() => {
    const width = 920;
    const height = 620;
    const margin = 36;
    const xExtent = d3.extent(points, (point) => point.x);
    const yExtent = d3.extent(points, (point) => point.y);
    const x = d3.scaleLinear().domain(xExtent).range([margin, width - margin]);
    const y = d3.scaleLinear().domain(yExtent).range([height - margin, margin]);
    return { width, height, x, y };
  }, [points]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom().scaleExtent([0.8, 7]).on('zoom', (event) => setTransform(event.transform));
    svg.call(zoom);
    return () => { svg.on('.zoom', null); };
  }, []);

  return (
    <div className="chart-shell chart-shell--atlas">
      <svg ref={svgRef} className="chart-svg" viewBox={`0 0 ${scene.width} ${scene.height}`} role="img" aria-label="Topic atlas of parliamentary speeches">
        <rect x="0" y="0" width={scene.width} height={scene.height} fill="rgba(255,255,255,0.02)" />
        <g transform={transform.toString()}>
          <line x1={scene.width / 2} x2={scene.width / 2} y1="24" y2={scene.height - 24} className="atlas-axis" />
          <line x1="24" x2={scene.width - 24} y1={scene.height / 2} y2={scene.height / 2} className="atlas-axis" />
          {points.map((point) => {
            const meta = topicMetadata[point.topicKey];
            const fill = meta ? `rgb(${meta.color.join(', ')})` : '#94a3b8';
            const isSelected = point.speechId === selectedSpeechId;
            return (
              <circle
                key={point.speechId}
                cx={scene.x(point.x)}
                cy={scene.y(point.y)}
                r={isSelected ? 6.2 : 3.4}
                fill={fill}
                opacity={point.isNoise ? 0.32 : 0.68}
                stroke={isSelected ? '#0f172a' : 'none'}
                strokeWidth={isSelected ? 1.25 : 0}
                className="atlas-point"
                onMouseEnter={() => onHoverSpeech(point)}
                onMouseLeave={() => onHoverSpeech(null)}
                onClick={() => onSelectSpeech(point)}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
}
