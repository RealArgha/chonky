import { STAT_LABELS, StatKey } from "@/lib/chonky";

const STAT_ICON: Record<StatKey, string> = {
  hunger: "🍓",
  energy: "⚡",
  hygiene: "✨",
  fun: "🎈",
};

function barGradient(value: number): string {
  if (value <= 20) return "from-rose-400 to-red-500";
  if (value <= 50) return "from-amber-300 to-yellow-400";
  return "from-lime-400 to-green-500";
}

export function MeterBar({ stat, value }: { stat: StatKey; value: number }) {
  const rounded = Math.round(value);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between font-pixel text-[9px] uppercase tracking-wide text-slate-700">
        <span className="flex items-center gap-1.5">
          <span className="text-sm">{STAT_ICON[stat]}</span>
          {STAT_LABELS[stat]}
        </span>
        <span className="tabular-nums text-slate-500">{rounded}</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-white/60 shadow-inner ring-1 ring-black/10">
        <div
          className={`h-full rounded-full bg-gradient-to-r transition-[width] duration-500 ease-out ${barGradient(rounded)}`}
          style={{ width: `${rounded}%` }}
        />
      </div>
    </div>
  );
}
