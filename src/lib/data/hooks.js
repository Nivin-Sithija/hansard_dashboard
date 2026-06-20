import { useEffect, useMemo, useState } from 'react';
import { loadJson, loadManyJson } from './cache';

export function useJsonResource(url, { enabled = true } = {}) {
  const [state, setState] = useState(() => ({ key: url, data: null, loading: enabled, error: null }));
  const derived = state.key === url ? state : { key: url, data: null, loading: enabled, error: null };

  useEffect(() => {
    let cancelled = false;
    if (!enabled) return undefined;

    loadJson(url)
      .then((data) => {
        if (!cancelled) setState({ key: url, data, loading: false, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState({ key: url, data: null, loading: false, error: error.message || 'Unknown error' });
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, url]);

  return enabled ? derived : { key: url, data: null, loading: false, error: null };
}

export function useManyJsonResources(urls) {
  const stableUrls = useMemo(() => urls.join('|'), [urls]);
  const requestUrls = useMemo(() => (stableUrls ? stableUrls.split('|') : []), [stableUrls]);
  const [state, setState] = useState(() => ({ key: stableUrls, data: {}, loading: true, error: null }));
  const derived = state.key === stableUrls ? state : { key: stableUrls, data: {}, loading: true, error: null };

  useEffect(() => {
    let cancelled = false;
    loadManyJson(requestUrls)
      .then((data) => {
        if (!cancelled) setState({ key: stableUrls, data, loading: false, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState({ key: stableUrls, data: {}, loading: false, error: error.message || 'Unknown error' });
      });

    return () => {
      cancelled = true;
    };
  }, [requestUrls, stableUrls]);

  return derived;
}
