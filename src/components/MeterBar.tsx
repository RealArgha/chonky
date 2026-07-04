import { STAT_LABELS, StatKey } from "@/lib/chonky";

const STAT_ICON: Record<StatKey, string> = {
  hunger: "🍓",
  energy: "⚡",
  hygiene: "✨",
  fun: "🎈",
};

function barColor(value: number): string {
  if (value <= 20) return "bg-red-500";
  if (value <= 50) return "bg-yellow-400";
  return "bg-green-500";
}

export function MeterBar({ stat, value }: { stat: StatKey; value: number }) {
  const rounded = Math.round(value);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between font-pixel text-[9px] uppercase tracking-wide text-slate-800">
        <span className="flex items-center gap-1.5">
          <span className="text-xs">{STAT_ICON[stat]}</span>
          {STAT_LABELS[stat]}
        </span>
        <span className="tabular-nums text-slate-600">{rounded}</span>
      </div>
      <div className="h-3.5 w-full rounded-sm border-2 border-slate-900 bg-slate-300 p-[1px]">
        <div
          className="h-full overflow-hidden transition-[width] duration-500 ease-out"
          style={{ width: `${rounded}%` }}
        >
          <div className={`relative h-full w-full ${barColor(rounded)}`}>
            <div className="absolute inset-x-0 top-0 h-1/3 bg-white/40" />
          </div>
        </div>
      </div>
    </div>
  );
}
