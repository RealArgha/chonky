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

// Minutes for a full (100) stat to decay to 0 if left untouched. Energy
// (the sleep bar) empties every 4 hours; everything else empties every 2.
const MINUTES_TO_EMPTY: Record<StatKey, number> = {
  hunger: 120,
  energy: 240,
  hygiene: 120,
  fun: 120,
};

export const DECAY_PER_MINUTE: Record<StatKey, number> = {
  hunger: 100 / MINUTES_TO_EMPTY.hunger,
  energy: 100 / MINUTES_TO_EMPTY.energy,
  hygiene: 100 / MINUTES_TO_EMPTY.hygiene,
  fun: 100 / MINUTES_TO_EMPTY.fun,
};

// Every action fills its main stat all the way to 100 (a delta this big
// always clamps to full, whatever the stat's starting value). Secondary
// stats an action touches only move "a little bit" by comparison.
export const FULL_BOOST = 100;
export const SMALL_ADJUST = 10;

// Sleep takes an hour to fully refill; every other action takes a minute.
export const ACTION_ANIMATION_MS: Record<ActionKey, number> = {
  eat: 60_000,
  sleep: 3_600_000,
  bath: 60_000,
  play: 60_000,
};

export type ActionTarget = { stat: StatKey; delta: number };

// The stat(s) each action moves and by how much. Eating and bathing also
// nudge energy up a little, and playing tires Chonky out and gets it dirty,
// so it costs a little energy/hygiene alongside the fun it adds in full.
export const ACTION_TARGETS: Record<ActionKey, ActionTarget[]> = {
  eat: [
    { stat: "hunger", delta: FULL_BOOST },
    { stat: "energy", delta: SMALL_ADJUST },
  ],
  sleep: [{ stat: "energy", delta: FULL_BOOST }],
  bath: [
    { stat: "hygiene", delta: FULL_BOOST },
    { stat: "energy", delta: SMALL_ADJUST },
  ],
  play: [
    { stat: "fun", delta: FULL_BOOST },
    { stat: "energy", delta: -SMALL_ADJUST },
    { stat: "hygiene", delta: -SMALL_ADJUST },
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
