"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  ACTION_ANIMATION_MS,
  ACTION_BOOST,
  ACTION_TO_STAT,
  ActionKey,
  applyDecay,
  clampStat,
  INITIAL_STATS,
  Stats,
  StatKey,
} from "@/lib/chonky";

const STORAGE_KEY = "chonki-state-v1";
const TICK_MS = 1000;
// Meters barely move while an action gif is playing, so the moment feels calm.
const ACTION_DECAY_SCALE = 0.1;

type StoredState = {
  stats: Stats;
  lastUpdated: number;
};

type Refill = {
  stat: StatKey;
  from: number;
  to: number;
  startedAt: number;
  durationMs: number;
};

function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * Math.min(1, Math.max(0, progress));
}

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
  const statsRef = useRef<Stats>(stats);
  const refillRef = useRef<Refill | null>(null);

  useEffect(() => {
    actionPlayingRef.current = actionPlaying;
  }, [actionPlaying]);

  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  // Tick the decay forward while the app is open, and interpolate a slow
  // stat refill while an action is playing instead of jumping instantly.
  useEffect(() => {
    lastUpdatedRef.current = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedMs = now - lastUpdatedRef.current;
      lastUpdatedRef.current = now;
      const scale = actionPlayingRef.current ? ACTION_DECAY_SCALE : 1;
      setStats((prev) => {
        const decayed = applyDecay(prev, elapsedMs * scale);
        const refill = refillRef.current;
        if (!refill) return decayed;
        const progress = (now - refill.startedAt) / refill.durationMs;
        return { ...decayed, [refill.stat]: lerp(refill.from, refill.to, progress) };
      });
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
    // Pressing any action cancels whichever one is currently playing and
    // takes over, but the boost still ramps in gradually rather than
    // jumping instantly, so mashing the same button can't cheese free boosts.
    if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);

    const now = Date.now();
    const stat = ACTION_TO_STAT[action];
    const durationMs = ACTION_ANIMATION_MS[action];
    const prevRefill = refillRef.current;
    const prevProgress = prevRefill ? (now - prevRefill.startedAt) / prevRefill.durationMs : 0;

    const from = prevRefill && prevRefill.stat === stat
      ? lerp(prevRefill.from, prevRefill.to, prevProgress)
      : statsRef.current[stat];
    const to = clampStat(from + ACTION_BOOST);
    refillRef.current = { stat, from, to, startedAt: now, durationMs };

    if (prevRefill && prevRefill.stat !== stat) {
      // Freeze whatever the interrupted action had refilled so far instead
      // of letting it keep animating in the background or snapping back.
      const settled = lerp(prevRefill.from, prevRefill.to, prevProgress);
      setStats((prev) => ({ ...prev, [prevRefill.stat]: settled }));
    }

    setActionPlaying(action);
    animationTimeoutRef.current = setTimeout(() => {
      // Snap to the exact target in case the last tick landed slightly early.
      setStats((prev) => ({ ...prev, [stat]: to }));
      refillRef.current = null;
      setActionPlaying(null);
    }, durationMs);
  }, []);

  return { stats, actionPlaying, performAction, ready };
}
