"use client";

import { ActionButton } from "@/components/ActionButton";
import { CapybaraStage } from "@/components/CapybaraStage";
import { MeterBar } from "@/components/MeterBar";
import { useChonky } from "@/hooks/useChonky";
import { ActionKey, isSad, lowestStat, STAT_LABELS } from "@/lib/chonky";

const LEFT_ACTIONS: ActionKey[] = ["eat", "sleep"];
const RIGHT_ACTIONS: ActionKey[] = ["bath", "play"];

export default function Home() {
  const { stats, actionPlaying, performAction, ready } = useChonky();

  if (!ready) return null;

  const sad = isSad(stats);
  const worst = lowestStat(stats);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-6 px-4 py-8">
      <h1 className="text-center font-pixel text-3xl tracking-wide text-amber-800 [text-shadow:3px_3px_0_#ffffff]">
        Chonky
      </h1>

      {sad && (
        <p className="rounded-lg border-2 border-slate-900 bg-amber-200 px-3 py-1.5 text-center font-pixel text-[10px] text-slate-900">
          Chonky&apos;s {STAT_LABELS[worst.key].toLowerCase()} is low!
        </p>
      )}

      <div className="flex items-center justify-center gap-3 sm:gap-5">
        <div className="flex flex-col gap-4">
          {LEFT_ACTIONS.map((action) => (
            <ActionButton
              key={action}
              action={action}
              disabled={actionPlaying !== null}
              onPress={performAction}
            />
          ))}
        </div>

        <CapybaraStage actionPlaying={actionPlaying} sad={sad} />

        <div className="flex flex-col gap-4">
          {RIGHT_ACTIONS.map((action) => (
            <ActionButton
              key={action}
              action={action}
              disabled={actionPlaying !== null}
              onPress={performAction}
            />
          ))}
        </div>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        {(Object.keys(stats) as (keyof typeof stats)[]).map((stat) => (
          <MeterBar key={stat} stat={stat} value={stats[stat]} />
        ))}
      </div>
    </main>
  );
}
