import { SAD_THRESHOLD, STAT_LABELS, Stats, StatKey } from "@/lib/chonky";
import { CHAT_NAMES } from "@/lib/chat";
import { notify } from "@/lib/push";
import { redis } from "@/lib/redis";

const LOW_NOTIFIED_KEY = "chonky:pet:lowNotified";

// Notifies both phones the first time a stat drops to/below SAD_THRESHOLD,
// and stays quiet on every following poll until it's fed back up and drops
// low again, so a low meter doesn't spam a push every few seconds.
export async function checkLowStats(stats: Stats): Promise<void> {
  if (!redis) return;

  const currentlyLow = (Object.keys(stats) as StatKey[]).filter((key) => stats[key] <= SAD_THRESHOLD);
  const alreadyNotified = new Set(await redis.smembers(LOW_NOTIFIED_KEY));

  const newlyLow = currentlyLow.filter((key) => !alreadyNotified.has(key));
  const recovered = [...alreadyNotified].filter((key) => !currentlyLow.includes(key as StatKey));

  if (newlyLow.length > 0) {
    await redis.sadd(LOW_NOTIFIED_KEY, newlyLow[0], ...newlyLow.slice(1));
    await Promise.all(
      newlyLow.flatMap((key) =>
        CHAT_NAMES.map((name) =>
          notify(name, {
            title: "Chonky needs you",
            body: `${STAT_LABELS[key]} is running low!`,
          }),
        ),
      ),
    );
  }

  if (recovered.length > 0) {
    await redis.srem(LOW_NOTIFIED_KEY, recovered[0], ...recovered.slice(1));
  }
}
