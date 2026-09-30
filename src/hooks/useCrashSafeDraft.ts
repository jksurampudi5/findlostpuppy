import { useEffect, useRef } from 'react';

interface StoredDraft<T> {
  savedAt: string;
  value: T;
}

const MAX_DRAFT_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_DRAFT_BYTES = 4 * 1024 * 1024;

export function readCrashSafeDraft<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const draft = JSON.parse(raw) as StoredDraft<T>;
    if (!draft.savedAt || Date.now() - Date.parse(draft.savedAt) > MAX_DRAFT_AGE_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return draft.value;
  } catch {
    return null;
  }
}

export function clearCrashSafeDraft(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {}
}

/** Saves a bounded, short-lived local draft so a refresh or WebView crash does not erase a form. */
export function useCrashSafeDraft<T>(key: string, value: T, enabled = true): void {
  const ready = useRef(false);

  useEffect(() => {
    ready.current = true;
  }, []);

  useEffect(() => {
    if (!enabled || !ready.current) return;
    const timer = window.setTimeout(() => {
      try {
        const serialized = JSON.stringify({ savedAt: new Date().toISOString(), value });
        if (new Blob([serialized]).size <= MAX_DRAFT_BYTES) {
          localStorage.setItem(key, serialized);
        }
      } catch {
        // Storage can be unavailable or full. The live form remains usable.
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [enabled, key, value]);
}
