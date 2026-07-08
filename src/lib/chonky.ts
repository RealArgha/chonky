export type StatKey = "hunger" | "energy" | "hygiene" | "fun";

export type ActionKey = "eat" | "sleep" | "bath" | "play";

export type Stats = Record<StatKey, number>;

export const STAT_LABELS: Record<StatKey, string> = {
  hunger: "Hunger",
  energy: "Energy",
  hygiene: "Hygiene",
  fun: "Fun",
};

export const ACTION_LABELS: Record<ActionKey, string> = {
  eat: "Feed",
  sleep: "Sleep",
  bath: "Bath",
  play: "Play",
};

// Used for phrasing activity-log entries, e.g. "Dad fed Chonky".
export const ACTION_VERB: Record<ActionKey, string> = {
  eat: "fed Chonky",
  sleep: "put Chonky to sleep",
  bath: "gave Chonky a bath",
  play: "played with Chonky",
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
// Playing tires Chonky out and gets it dirty, so a play session costs
// some energy and hygiene alongside the fun it adds.
export const PLAY_DRAIN = 15;
export const ACTION_ANIMATION_MS: Record<ActionKey, number> = {
  eat: 10_000,
  sleep: 120_000,
  bath: 10_000,
  play: 10_000,
};

export type ActionTarget = { stat: StatKey; delta: number };

// The stat(s) each action moves and by how much. Play is the only action
// that touches more than one stat: it boosts fun but costs energy/hygiene.
export const ACTION_TARGETS: Record<ActionKey, ActionTarget[]> = {
  eat: [{ stat: "hunger", delta: ACTION_BOOST }],
  sleep: [{ stat: "energy", delta: ACTION_BOOST }],
  bath: [{ stat: "hygiene", delta: ACTION_BOOST }],
  play: [
    { stat: "fun", delta: ACTION_BOOST },
    { stat: "energy", delta: -PLAY_DRAIN },
    { stat: "hygiene", delta: -PLAY_DRAIN },
  ],
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
