import { STAT_LABELS, StatKey } from "@/lib/chonki";

function barColor(value: number): string {
  if (value <= 20) return "bg-red-500";
  if (value <= 50) return "bg-amber-500";
  return "bg-emerald-500";
}

export function MeterBar({ stat, value }: { stat: StatKey; value: number }) {
  const rounded = Math.round(value);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between text-sm font-medium text-stone-700 dark:text-stone-300">
        <span>{STAT_LABELS[stat]}</span>
        <span className="tabular-nums text-stone-500 dark:text-stone-400">{rounded}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ease-out ${barColor(rounded)}`}
          style={{ width: `${rounded}%` }}
        />
      </div>
    </div>
  );
}
