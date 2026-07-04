"use client";

import { ActionMenu } from "@/components/ActionMenu";
import { CapybaraStage } from "@/components/CapybaraStage";
import { MeterBar } from "@/components/MeterBar";
import { useChonky } from "@/hooks/useChonky";
import { isSad, lowestStat, STAT_LABELS } from "@/lib/chonky";

export default function Home() {
  const { stats, actionPlaying, performAction, ready } = useChonky();

  if (!ready) return null;

  const sad = isSad(stats);
  const worst = lowestStat(stats);

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4 px-4 py-8">
      <h1 className="text-center font-pixel text-2xl tracking-wide text-amber-800 [text-shadow:3px_3px_0_#ffffff]">
        Chonky
      </h1>

      {sad && (
        <p className="pixel-frame border-2 border-slate-900 bg-amber-200 px-2 py-1.5 text-center font-pixel text-[9px] text-slate-900">
          Chonky&apos;s {STAT_LABELS[worst.key].toLowerCase()} is low!
        </p>
      )}

      <div className="pixel-frame border-4 border-slate-900 bg-slate-100 p-3">
        <div className="mb-2 flex items-center justify-between font-pixel text-[10px] text-slate-800">
          <span>CHONKY</span>
          <span>LV. 1</span>
        </div>
        <div className="flex flex-col gap-2">
          {(Object.keys(stats) as (keyof typeof stats)[]).map((stat) => (
            <MeterBar key={stat} stat={stat} value={stats[stat]} />
          ))}
        </div>
      </div>

      <CapybaraStage actionPlaying={actionPlaying} sad={sad} />

      <ActionMenu disabled={actionPlaying !== null} onPress={performAction} />
    </main>
  );
}
