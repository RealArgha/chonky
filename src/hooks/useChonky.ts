"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  ACTION_ANIMATION_MS,
  ActionKey,
  applyAction,
  applyDecay,
  INITIAL_STATS,
  Stats,
} from "@/lib/chonky";

const STORAGE_KEY = "chonki-state-v1";
const TICK_MS = 1000;
// Meters barely move while an action gif is playing, so the moment feels calm.
const ACTION_DECAY_SCALE = 0.1;

type StoredState = {
  stats: Stats;
  lastUpdated: number;
};

function loadStoredState(): StoredState {
  if (typeof window === "undefined") {
    return { stats: INITIAL_STATS, lastUpdated: Date.now() };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { stats: INITIAL_STATS, lastUpdated: Date.now() };
    const parsed = JSON.parse(raw) as StoredState;
    if (!parsed.stats || typeof parsed.lastUpdated !== "number") {
      return { stats: INITIAL_STATS, lastUpdated: Date.now() };
    }
    return parsed;
  } catch {
    return { stats: INITIAL_STATS, lastUpdated: Date.now() };
  }
}

// Catch up on decay that happened while the app was closed, computed once at mount.
function initialStats(): Stats {
  const stored = loadStoredState();
  const elapsedMs = Date.now() - stored.lastUpdated;
  return applyDecay(stored.stats, elapsedMs);
}

const noopSubscribe = () => () => {};

// True once hydrated on the client. Lets us defer rendering localStorage-derived
// content until after hydration, without a mismatch between server and client HTML.
function useHasMounted(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

export function useChonky() {
  const ready = useHasMounted();
  const [stats, setStats] = useState<Stats>(initialStats);
  const [actionPlaying, setActionPlaying] = useState<ActionKey | null>(null);
  const lastUpdatedRef = useRef<number>(0);
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actionPlayingRef = useRef<ActionKey | null>(null);

  useEffect(() => {
    actionPlayingRef.current = actionPlaying;
  }, [actionPlaying]);

  // Tick the decay forward while the app is open.
  useEffect(() => {
    lastUpdatedRef.current = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedMs = now - lastUpdatedRef.current;
      lastUpdatedRef.current = now;
      const scale = actionPlayingRef.current ? ACTION_DECAY_SCALE : 1;
      setStats((prev) => applyDecay(prev, elapsedMs * scale));
    }, TICK_MS);
    return () => clearInterval(interval);
  }, []);

  // Persist on every change.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const toStore: StoredState = { stats, lastUpdated: lastUpdatedRef.current || Date.now() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  }, [stats]);

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
    };
  }, []);

  const performAction = useCallback((action: ActionKey) => {
    setActionPlaying((current) => {
      if (current) return current;
      setStats((prev) => applyAction(prev, action));
      animationTimeoutRef.current = setTimeout(() => {
        setActionPlaying(null);
      }, ACTION_ANIMATION_MS);
      return action;
    });
  }, []);

  return { stats, actionPlaying, performAction, ready };
}
