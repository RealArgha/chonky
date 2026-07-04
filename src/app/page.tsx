"use client";

import { ActionButton } from "@/components/ActionButton";
import { CapybaraStage } from "@/components/CapybaraStage";
import { MeterBar } from "@/components/MeterBar";
import { useChonki } from "@/hooks/useChonki";
import { ActionKey, isSad, lowestStat, STAT_LABELS } from "@/lib/chonki";

const ACTIONS: ActionKey[] = ["eat", "sleep", "bath", "play"];

export default function Home() {
  const { stats, actionPlaying, performAction, ready } = useChonki();

  if (!ready) return null;

  const sad = isSad(stats);
  const worst = lowestStat(stats);

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 px-4 py-8">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-stone-800 dark:text-stone-100">Chonki</h1>
        {sad && (
          <p className="mt-1 text-sm text-red-500">
            Chonki&apos;s {STAT_LABELS[worst.key].toLowerCase()} is low!
          </p>
        )}
      </header>

      <CapybaraStage actionPlaying={actionPlaying} sad={sad} />

      <div className="flex flex-col gap-3">
        {(Object.keys(stats) as (keyof typeof stats)[]).map((stat) => (
          <MeterBar key={stat} stat={stat} value={stats[stat]} />
        ))}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {ACTIONS.map((action) => (
          <ActionButton
            key={action}
            action={action}
            disabled={actionPlaying !== null}
            onPress={performAction}
          />
        ))}
      </div>
    </main>
  );
}
