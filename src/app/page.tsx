"use client";

import { ActionButton } from "@/components/ActionButton";
import { CapybaraStage } from "@/components/CapybaraStage";
import { MeterBar } from "@/components/MeterBar";
import { useChonky } from "@/hooks/useChonky";
import { ActionKey, isSad, lowestStat, STAT_LABELS } from "@/lib/chonky";

const ACTIONS: ActionKey[] = ["eat", "sleep", "bath", "play"];

export default function Home() {
  const { stats, actionPlaying, performAction, ready } = useChonky();

  if (!ready) return null;

  const sad = isSad(stats);
  const worst = lowestStat(stats);

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-8">
      <h1 className="mb-4 text-center font-pixel text-2xl tracking-wide text-amber-800 [text-shadow:3px_3px_0_#ffffff]">
        Chonky
      </h1>

      <div className="flex flex-col gap-5 rounded-3xl border-[3px] border-slate-900 bg-slate-100 p-4 shadow-[0_6px_0_0_#0f172a]">
        {sad && (
          <p className="rounded-lg border-2 border-slate-900 bg-amber-200 px-2 py-1 text-center font-pixel text-[9px] text-slate-900">
            Chonky&apos;s {STAT_LABELS[worst.key].toLowerCase()} is low!
          </p>
        )}

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
      </div>
    </main>
  );
}
