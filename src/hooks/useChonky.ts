"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  ACTION_ANIMATION_MS,
  ACTION_TARGETS,
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

function liveRefillValue(refill: Refill, now: number): number {
  return lerp(refill.from, refill.to, (now - refill.startedAt) / refill.durationMs);
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
  // One entry per stat an action is currently moving. Most actions move a
  // single stat, but play moves three (fun up, energy/hygiene down) at once.
  const activeRefillsRef = useRef<Refill[]>([]);

  useEffect(() => {
    actionPlayingRef.current = actionPlaying;
  }, [actionPlaying]);

  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  // Tick the decay forward while the app is open, and interpolate any active
  // refills instead of jumping their stats instantly.
  useEffect(() => {
    lastUpdatedRef.current = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedMs = now - lastUpdatedRef.current;
      lastUpdatedRef.current = now;
      const scale = actionPlayingRef.current ? ACTION_DECAY_SCALE : 1;
      setStats((prev) => {
        const decayed = applyDecay(prev, elapsedMs * scale);
        const refills = activeRefillsRef.current;
        if (refills.length === 0) return decayed;
        const next = { ...decayed };
        for (const refill of refills) {
          next[refill.stat] = liveRefillValue(refill, now);
        }
        return next;
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
    // Re-pressing the action that's already playing is a no-op: it lets the
    // animation run all the way to a full fill instead of restarting its
    // ramp. Pressing a *different* action still cancels and takes over.
    if (actionPlayingRef.current === action) return;
    if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);

    const now = Date.now();
    const durationMs = ACTION_ANIMATION_MS[action];
    const targets = ACTION_TARGETS[action];
    const targetStats = new Set(targets.map((t) => t.stat));
    const prevRefills = activeRefillsRef.current;

    const nextRefills: Refill[] = targets.map(({ stat, delta }) => {
      const prevRefill = prevRefills.find((r) => r.stat === stat);
      const from = prevRefill ? liveRefillValue(prevRefill, now) : statsRef.current[stat];
      return { stat, from, to: clampStat(from + delta), startedAt: now, durationMs };
    });

    // Freeze whatever the interrupted action was moving that the new action
    // doesn't also touch, instead of letting it keep animating in the
    // background or snapping back.
    const settledUpdates = prevRefills
      .filter((r) => !targetStats.has(r.stat))
      .reduce<Partial<Stats>>((acc, r) => {
        acc[r.stat] = liveRefillValue(r, now);
        return acc;
      }, {});
    if (Object.keys(settledUpdates).length > 0) {
      setStats((prev) => ({ ...prev, ...settledUpdates }));
    }

    activeRefillsRef.current = nextRefills;
    setActionPlaying(action);
    animationTimeoutRef.current = setTimeout(() => {
      // Snap to the exact targets in case the last tick landed slightly early.
      setStats((prev) => {
        const done = { ...prev };
        for (const refill of nextRefills) done[refill.stat] = refill.to;
        return done;
      });
      activeRefillsRef.current = [];
      setActionPlaying(null);
    }, durationMs);
  }, []);

  return { stats, actionPlaying, performAction, ready };
}
