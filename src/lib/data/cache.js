const jsonCache = new Map();
const inflight = new Map();

async function fetchJson(url) {
  const response = await fetch(url, { cache: 'force-cache' });
  if (!response.ok) {
    throw new Error(`Failed to load ${url}`);
  }
  return response.json();
}

export async function loadJson(url) {
  if (jsonCache.has(url)) {
    return jsonCache.get(url);
  }
  if (inflight.has(url)) {
    return inflight.get(url);
  }

  const request = fetchJson(url)
    .then((data) => {
      jsonCache.set(url, data);
      inflight.delete(url);
      return data;
    })
    .catch((error) => {
      inflight.delete(url);
      throw error;
    });

  inflight.set(url, request);
  return request;
}

export async function loadManyJson(urls) {
  const unique = [...new Set(urls)];
  const values = await Promise.all(unique.map((url) => loadJson(url)));
  return unique.reduce((acc, url, index) => {
    acc[url] = values[index];
    return acc;
  }, {});
}
