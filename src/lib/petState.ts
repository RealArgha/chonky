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

export type Refill = {
  stat: StatKey;
  from: number;
  to: number;
  startedAt: number;
  durationMs: number;
};

export type PetState = {
  stats: Stats;
  lastUpdated: number;
  action: ActionKey | null;
  refills: Refill[];
};

export const PET_KEY = "chonky:pet:state";

export const DEFAULT_PET_STATE: PetState = {
  stats: INITIAL_STATS,
  lastUpdated: Date.now(),
  action: null,
  refills: [],
};

// Meters barely move while an action gif is playing, so the moment feels calm.
export const ACTION_DECAY_SCALE = 0.1;

export function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * Math.min(1, Math.max(0, progress));
}

export function liveRefillValue(refill: Refill, now: number): number {
  return lerp(refill.from, refill.to, (now - refill.startedAt) / refill.durationMs);
}

// Resolve a stored pet state forward to `now`: plain decay for untouched
// stats, but a stat mid-action either keeps filling toward its target or, if
// enough real time has passed, is resolved to full and decays normally from
// there. Shared by the server (Redis-backed) and any client-side prediction.
export function resolvePetState(stored: PetState, now: number): PetState {
  if (stored.refills.length === 0) {
    return {
      stats: applyDecay(stored.stats, now - stored.lastUpdated),
      lastUpdated: now,
      action: null,
      refills: [],
    };
  }

  const { refills } = stored;
  const targetStats = new Set(refills.map((r) => r.stat));
  const finishAt = refills[0].startedAt + refills[0].durationMs;

  if (now >= finishAt) {
    const settled = { ...stored.stats };
    for (const r of refills) settled[r.stat] = clampStat(r.to);
    return { stats: applyDecay(settled, now - finishAt), lastUpdated: now, action: null, refills: [] };
  }

  const elapsedMinutes = ((now - stored.lastUpdated) * ACTION_DECAY_SCALE) / 60_000;
  const next = { ...stored.stats };
  for (const key of Object.keys(next) as StatKey[]) {
    if (targetStats.has(key)) continue;
    next[key] = clampStat(next[key] - DECAY_PER_MINUTE[key] * elapsedMinutes);
  }
  for (const r of refills) next[r.stat] = liveRefillValue(r, now);

  return { stats: next, lastUpdated: stored.lastUpdated, action: stored.action, refills };
}

// Given the live-resolved current state and a newly-pressed action, compute
// the next state to persist. Re-pressing the action already playing is a
// no-op (mirrors the client's "let it finish" rule).
export function applyAction(live: PetState, action: ActionKey, now: number): PetState {
  if (live.action === action) return live;

  const durationMs = ACTION_ANIMATION_MS[action];
  const refills: Refill[] = ACTION_TARGETS[action].map(({ stat, delta }) => ({
    stat,
    from: live.stats[stat],
    to: clampStat(live.stats[stat] + delta),
    startedAt: now,
    durationMs,
  }));

  return { stats: live.stats, lastUpdated: now, action, refills };
}
