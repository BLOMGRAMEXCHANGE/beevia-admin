"use client";

import { useCallback, useEffect, useState } from "react";

type MockResourceStatus = "loading" | "error" | "success";

interface MockResourceOptions<T> {
  /** Value to resolve with after `delayMs`. */
  data: T;
  /** Per-resource delay so cards don't all resolve at once. */
  delayMs: number;
  /**
   * When true, the first load fails (to exercise the error/retry state).
   * A manual retry always succeeds.
   */
  failFirstLoad?: boolean;
}

interface MockResourceResult<T> {
  status: MockResourceStatus;
  data: T | null;
  retry: () => void;
}

/**
 * Stand-in for a real data fetch (react-query useQuery, etc). Simulates an
 * async load with a configurable delay and an optional forced first failure.
 *
 * Replace with the real query hook later — consumers only read
 * { status, data, retry }.
 */
export function useMockResource<T>({
  data,
  delayMs,
  failFirstLoad = false,
}: MockResourceOptions<T>): MockResourceResult<T> {
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<MockResourceStatus>("loading");
  const [resolved, setResolved] = useState<T | null>(null);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (!active) return;
      if (failFirstLoad && attempt === 0) {
        setStatus("error");
        return;
      }
      setResolved(data);
      setStatus("success");
    }, delayMs);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [attempt, data, delayMs, failFirstLoad]);

  const retry = useCallback(() => {
    setStatus("loading");
    setResolved(null);
    setAttempt((value) => value + 1);
  }, []);

  return { status, data: resolved, retry };
}
