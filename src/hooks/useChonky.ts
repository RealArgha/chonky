"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  ACTION_ANIMATION_MS,
  ACTION_TARGETS,
  ActionKey,
  applyDecay,
  clampStat,
  DECAY_PER_MINUTE,
  INITIAL_STATS,
  Stats,
  StatKey,
} from "@/lib/chonky";

const STORAGE_KEY = "chonki-state-v1";
const TICK_MS = 1000;
// Meters barely move while an action gif is playing, so the moment feels calm.
const ACTION_DECAY_SCALE = 0.1;

type Refill = {
  stat: StatKey;
  from: number;
  to: number;
  startedAt: number;
  durationMs: number;
};

type StoredState = {
  stats: Stats;
  lastUpdated: number;
  action: ActionKey | null;
  refills: Refill[];
};

type InitialState = {
  stats: Stats;
  action: ActionKey | null;
  refills: Refill[];
};

function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * Math.min(1, Math.max(0, progress));
}

function liveRefillValue(refill: Refill, now: number): number {
  return lerp(refill.from, refill.to, (now - refill.startedAt) / refill.durationMs);
}

const DEFAULT_STORED_STATE: StoredState = {
  stats: INITIAL_STATS,
  lastUpdated: Date.now(),
  action: null,
  refills: [],
};

function loadStoredState(): StoredState {
  if (typeof window === "undefined") return DEFAULT_STORED_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STORED_STATE;
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    if (!parsed.stats || typeof parsed.lastUpdated !== "number") return DEFAULT_STORED_STATE;
    return {
      stats: parsed.stats,
      lastUpdated: parsed.lastUpdated,
      action: parsed.action ?? null,
      refills: parsed.refills ?? [],
    };
  } catch {
    return DEFAULT_STORED_STATE;
  }
}

// Catch up on whatever happened while the app was closed, computed once at
// mount: plain decay for untouched stats, but a stat mid-action (e.g. asleep)
// either keeps filling toward its target or, if enough real time has already
// passed, is resolved to full and decays normally from there.
function resolveInitialState(): InitialState {
  const stored = loadStoredState();
  const now = Date.now();

  if (stored.refills.length === 0) {
    return { stats: applyDecay(stored.stats, now - stored.lastUpdated), action: null, refills: [] };
  }

  const { refills } = stored;
  const targetStats = new Set(refills.map((r) => r.stat));
  const finishAt = refills[0].startedAt + refills[0].durationMs;

  if (now >= finishAt) {
    // The action finished while we were away; snap to its target and let
    // normal decay pick up from the moment it finished.
    const settled = { ...stored.stats };
    for (const r of refills) settled[r.stat] = clampStat(r.to);
    return { stats: applyDecay(settled, now - finishAt), action: null, refills: [] };
  }

  // Still mid-action: keep interpolating from the original startedAt (so it
  // resolves at the correct real-world time). Other stats were dampened to
  // ACTION_DECAY_SCALE the whole time too, same as the live tick loop.
  const elapsedMinutes = ((now - stored.lastUpdated) * ACTION_DECAY_SCALE) / 60_000;
  const next = { ...stored.stats };
  for (const key of Object.keys(next) as StatKey[]) {
    if (targetStats.has(key)) continue;
    next[key] = clampStat(next[key] - DECAY_PER_MINUTE[key] * elapsedMinutes);
  }
  for (const r of refills) next[r.stat] = liveRefillValue(r, now);

  return { stats: next, action: stored.action, refills };
}

const noopSubscribe = () => () => {};

// True once hydrated on the client. Lets us defer rendering localStorage-derived
// content until after hydration, without a mismatch between server and client HTML.
function useHasMounted(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

export function useChonky() {
  const ready = useHasMounted();
  const [initial] = useState(resolveInitialState);
  const [stats, setStats] = useState<Stats>(initial.stats);
  const [actionPlaying, setActionPlaying] = useState<ActionKey | null>(initial.action);
  const lastUpdatedRef = useRef<number>(0);
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actionPlayingRef = useRef<ActionKey | null>(initial.action);
  const statsRef = useRef<Stats>(stats);
  // One entry per stat an action is currently moving. Most actions move a
  // single stat, but play moves three (fun up, energy/hygiene down) at once.
  const activeRefillsRef = useRef<Refill[]>(initial.refills);

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

  // Persist on every change, including whatever action is still mid-flight,
  // so a closed/reopened app can resume the fill instead of losing it.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const toStore: StoredState = {
      stats,
      lastUpdated: lastUpdatedRef.current || Date.now(),
      action: actionPlayingRef.current,
      refills: activeRefillsRef.current,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  }, [stats]);

  const finishRefills = useCallback((refills: Refill[]) => {
    setStats((prev) => {
      const done = { ...prev };
      for (const refill of refills) done[refill.stat] = refill.to;
      return done;
    });
    activeRefillsRef.current = [];
    setActionPlaying(null);
  }, []);

  // If an action was still mid-flight when the app closed, re-arm its
  // completion timer for whatever time is left, so it finishes on schedule.
  useEffect(() => {
    const refills = activeRefillsRef.current;
    if (refills.length === 0) return;
    const remaining = refills[0].startedAt + refills[0].durationMs - Date.now();
    if (remaining <= 0) return;
    animationTimeoutRef.current = setTimeout(() => finishRefills(refills), remaining);
  }, [finishRefills]);

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
    animationTimeoutRef.current = setTimeout(() => finishRefills(nextRefills), durationMs);
  }, [finishRefills]);

  return { stats, actionPlaying, performAction, ready };
}
