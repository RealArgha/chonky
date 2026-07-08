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
} from "@/lib/chonky";
import { CHAT_NAME_STORAGE_KEY } from "@/lib/chat";
import { liveRefillValue, PetState, Refill } from "@/lib/petState";

const TICK_MS = 1000;
const POLL_MS = 5000;
// Meters barely move while an action gif is playing, so the moment feels calm.
const ACTION_DECAY_SCALE = 0.1;

const noopSubscribe = () => () => {};

// True once hydrated on the client. Lets us defer rendering server-derived
// content until after hydration, without a mismatch between server and
// client HTML.
function useHasMounted(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

export function useChonky() {
  const hasMounted = useHasMounted();
  const [loaded, setLoaded] = useState(false);
  const [stats, setStats] = useState<Stats>(INITIAL_STATS);
  const [actionPlaying, setActionPlaying] = useState<ActionKey | null>(null);
  const lastTickRef = useRef<number>(0);
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

  const finishRefills = useCallback((refills: Refill[]) => {
    setStats((prev) => {
      const done = { ...prev };
      for (const refill of refills) done[refill.stat] = refill.to;
      return done;
    });
    activeRefillsRef.current = [];
    setActionPlaying(null);
  }, []);

  // Adopt a state snapshot from the shared server (Chonky is the same pet on
  // both phones), and re-arm the completion timer for any action still
  // in-flight so it finishes at the right real-world time either way.
  const applyServerState = useCallback(
    (state: PetState) => {
      setStats(state.stats);
      setActionPlaying(state.action);
      activeRefillsRef.current = state.refills;
      lastTickRef.current = Date.now();

      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;

      if (state.refills.length > 0) {
        const remaining = state.refills[0].startedAt + state.refills[0].durationMs - Date.now();
        if (remaining > 0) {
          animationTimeoutRef.current = setTimeout(() => finishRefills(state.refills), remaining);
        } else {
          activeRefillsRef.current = [];
          setActionPlaying(null);
        }
      }
    },
    [finishRefills],
  );

  // Fetch the shared pet state on mount, then keep polling so an action
  // taken on the other phone shows up here too.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/pet");
        const data: PetState = await res.json();
        if (!cancelled) applyServerState(data);
      } catch {
        // Best-effort: keep whatever we last had if the fetch fails.
      } finally {
        if (!cancelled) setLoaded(true);
      }
    };

    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [applyServerState]);

  // Tick the decay forward locally between polls, and interpolate any active
  // refills instead of jumping their stats instantly.
  useEffect(() => {
    lastTickRef.current = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedMs = now - lastTickRef.current;
      lastTickRef.current = now;
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

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
    };
  }, []);

  const performAction = useCallback(
    (action: ActionKey) => {
      // Re-pressing the action that's already playing is a no-op: it lets the
      // animation run all the way to a full fill instead of restarting its
      // ramp. Pressing a *different* action still cancels and takes over.
      if (actionPlayingRef.current === action) return;

      // Show the new action instantly using what we know locally, then
      // reconcile with the server's answer (which is the shared source of
      // truth in case the other phone changed something first).
      const now = Date.now();
      const optimisticRefills: Refill[] = ACTION_TARGETS[action].map(({ stat, delta }) => ({
        stat,
        from: statsRef.current[stat],
        to: clampStat(statsRef.current[stat] + delta),
        startedAt: now,
        durationMs: ACTION_ANIMATION_MS[action],
      }));
      applyServerState({ stats: statsRef.current, lastUpdated: now, action, refills: optimisticRefills });

      const name = typeof window !== "undefined" ? localStorage.getItem(CHAT_NAME_STORAGE_KEY) : null;
      fetch("/api/pet/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, name }),
      })
        .then((res) => res.json())
        .then((state: PetState) => applyServerState(state))
        .catch(() => {
          // Keep the optimistic guess if the request fails; the next poll
          // will reconcile once connectivity is back.
        });
    },
    [applyServerState],
  );

  return { stats, actionPlaying, performAction, ready: hasMounted && loaded };
}
