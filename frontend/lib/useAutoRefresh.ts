"use client";
import { useState, useEffect, useCallback, useRef } from "react";

interface UseAutoRefreshOptions {
  /** Interval in ms for auto-refresh (0 = disabled, default 60000) */
  interval?: number;
  /** Whether to auto-refresh (default true) */
  enabled?: boolean;
}

interface UseAutoRefreshReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
  refreshing: boolean;
}

/**
 * Hook that fetches data with auto-refresh and manual refresh support.
 * Shows "Last updated X ago" and a refresh button on list pages.
 */
export function useAutoRefresh<T>(
  fetcher: () => Promise<T>,
  options: UseAutoRefreshOptions = {}
): UseAutoRefreshReturn<T> {
  const { interval = 60000, enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const doFetch = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const result = await fetcherRef.current();
      setData(result);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => { doFetch(); }, [doFetch]);

  // Auto-refresh on interval
  useEffect(() => {
    if (!enabled || interval <= 0) return;
    const id = setInterval(() => doFetch(), interval);
    return () => clearInterval(id);
  }, [enabled, interval, doFetch]);

  const refresh = useCallback(() => doFetch(true), [doFetch]);

  return { data, loading, error, lastUpdated, refresh, refreshing };
}

/** Format a Date as a relative "X ago" string */
export function timeAgo(date: Date | null): string {
  if (!date) return "";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}
