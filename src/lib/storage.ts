// © 2026 Riadh MNASRI

"use client";

import { useCallback, useSyncExternalStore } from "react";

function load<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(`bonk-arena:${key}`);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(`bonk-arena:${key}`, JSON.stringify(value));
  } catch {
    // Private mode or storage disabled: settings simply won't persist.
  }
}

const cache = new Map<string, unknown>();
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * A setting persisted in localStorage. The server render uses `fallback`,
 * the client switches to the stored value (or `clientDefault`) after hydration.
 */
export function useSetting<T>(key: string, fallback: T, clientDefault?: () => T): [T, (value: T) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => {
      if (!cache.has(key)) cache.set(key, load(key, clientDefault ? clientDefault() : fallback));
      return cache.get(key) as T;
    },
    () => fallback,
  );
  const set = useCallback(
    (next: T) => {
      cache.set(key, next);
      save(key, next);
      listeners.forEach((l) => l());
    },
    [key],
  );
  return [value, set];
}
