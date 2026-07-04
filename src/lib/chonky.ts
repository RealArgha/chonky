export type StatKey = "hunger" | "energy" | "hygiene" | "fun";

export type ActionKey = "eat" | "sleep" | "bath" | "play";

export type Stats = Record<StatKey, number>;

export const STAT_LABELS: Record<StatKey, string> = {
  hunger: "Hunger",
  energy: "Energy",
  hygiene: "Hygiene",
  fun: "Fun",
};

export const ACTION_TO_STAT: Record<ActionKey, StatKey> = {
  eat: "hunger",
  sleep: "energy",
  bath: "hygiene",
  play: "fun",
};

export const ACTION_LABELS: Record<ActionKey, string> = {
  eat: "Feed",
  sleep: "Sleep",
  bath: "Bath",
  play: "Play",
};

// Minutes for a full (100) stat to decay to 0 if left untouched.
const MINUTES_TO_EMPTY: Record<StatKey, number> = {
  hunger: 180,
  energy: 300,
  hygiene: 360,
  fun: 240,
};

export const DECAY_PER_MINUTE: Record<StatKey, number> = {
  hunger: 100 / MINUTES_TO_EMPTY.hunger,
  energy: 100 / MINUTES_TO_EMPTY.energy,
  hygiene: 100 / MINUTES_TO_EMPTY.hygiene,
  fun: 100 / MINUTES_TO_EMPTY.fun,
};

// How much an action refills its stat, and how long its gif plays.
export const ACTION_BOOST = 40;
export const ACTION_ANIMATION_MS: Record<ActionKey, number> = {
  eat: 10_000,
  sleep: 120_000,
  bath: 10_000,
  play: 10_000,
};

export const SAD_THRESHOLD = 20;

export const INITIAL_STATS: Stats = {
  hunger: 100,
  energy: 100,
  hygiene: 100,
  fun: 100,
};

export function clampStat(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function applyDecay(stats: Stats, elapsedMs: number): Stats {
  const elapsedMinutes = elapsedMs / 60_000;
  if (elapsedMinutes <= 0) return stats;
  const next = { ...stats };
  for (const key of Object.keys(next) as StatKey[]) {
    next[key] = clampStat(next[key] - DECAY_PER_MINUTE[key] * elapsedMinutes);
  }
  return next;
}

export function applyAction(stats: Stats, action: ActionKey): Stats {
  const stat = ACTION_TO_STAT[action];
  return { ...stats, [stat]: clampStat(stats[stat] + ACTION_BOOST) };
}

export function lowestStat(stats: Stats): { key: StatKey; value: number } {
  const entries = Object.entries(stats) as [StatKey, number][];
  return entries.reduce(
    (worst, [key, value]) => (value < worst.value ? { key, value } : worst),
    { key: entries[0][0], value: entries[0][1] },
  );
}

export function isSad(stats: Stats): boolean {
  return lowestStat(stats).value <= SAD_THRESHOLD;
}
