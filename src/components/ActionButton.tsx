import { ACTION_LABELS, ActionKey } from "@/lib/chonky";

const ACTION_EMOJI: Record<ActionKey, string> = {
  eat: "🍽️",
  sleep: "😴",
  bath: "🛁",
  play: "🧶",
};

const ACTION_BADGE_COLOR: Record<ActionKey, string> = {
  eat: "#ffd6a5",
  sleep: "#d9c7ff",
  bath: "#b8e6ff",
  play: "#c8f7c5",
};

export function ActionButton({
  action,
  disabled,
  onPress,
}: {
  action: ActionKey;
  disabled: boolean;
  onPress: (action: ActionKey) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onPress(action)}
      className="flex flex-col items-center gap-1.5 rounded-2xl border-[3px] border-slate-900 bg-white px-2 py-3 shadow-[0_3px_0_0_#0f172a] transition active:translate-y-[3px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span
        className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-900"
        style={{ background: ACTION_BADGE_COLOR[action] }}
      >
        <span className="text-base leading-none">{ACTION_EMOJI[action]}</span>
      </span>
      <span className="font-pixel text-[9px] uppercase tracking-wide text-slate-900">
        {ACTION_LABELS[action]}
      </span>
    </button>
  );
}
