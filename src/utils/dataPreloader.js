const parsedCache = new Map();
const inflight = new Map();

const detectType = (url) => (url.toLowerCase().endsWith('.csv') ? 'text' : 'json');

async function fetchAndParse(url, type) {
  const response = await fetch(url, { cache: 'force-cache' });
  if (!response.ok) {
    throw new Error(`Failed to load ${url}`);
  }
  return type === 'text' ? response.text() : response.json();
}

export function readData(url, type = detectType(url)) {
  const cacheKey = `${type}:${url}`;

  if (parsedCache.has(cacheKey)) {
    return Promise.resolve(parsedCache.get(cacheKey));
  }
  if (inflight.has(cacheKey)) {
    return inflight.get(cacheKey);
  }

  const request = fetchAndParse(url, type)
    .then((data) => {
      parsedCache.set(cacheKey, data);
      inflight.delete(cacheKey);
      return data;
    })
    .catch((error) => {
      inflight.delete(cacheKey);
      throw error;
    });

  inflight.set(cacheKey, request);
  return request;
}

export const readJson = (url) => readData(url, 'json');
export const readText = (url) => readData(url, 'text');

export async function preloadData(urls, onProgress) {
  const uniqueUrls = [...new Set(urls)];
  const total = uniqueUrls.length;
  let completed = 0;

  onProgress?.({ completed, total, currentUrl: null });

  await Promise.all(uniqueUrls.map(async (url) => {
    await readData(url, detectType(url));
    completed += 1;
    onProgress?.({ completed, total, currentUrl: url });
  }));
}

export const DASHBOARD_DATA_URLS = [
  '/data/macro_topic_temporal_evolution_chart_data.json',
  '/data/macro_topic_keywords.json',
  '/data/speaker_topic_counts_by_macro_topic.json',
  '/data/speaker_normalization.json',
  '/data/speaker_speeches_per_year_by_topic.json',
  '/data/final_unique_speakers.json',
  '/data/macro_topic_keyword_counts_by_year.json',
  '/data/parliament_sessions_summary.json',
];
