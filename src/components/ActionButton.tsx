import { ACTION_LABELS, ActionKey } from "@/lib/chonki";

const ACTION_EMOJI: Record<ActionKey, string> = {
  eat: "🍽️",
  sleep: "😴",
  bath: "🛁",
  play: "🧶",
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
      className="flex flex-col items-center gap-1 rounded-2xl bg-white px-3 py-3 text-sm font-semibold text-stone-700 shadow-sm ring-1 ring-stone-200 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-stone-800 dark:text-stone-200 dark:ring-stone-700"
    >
      <span className="text-2xl leading-none">{ACTION_EMOJI[action]}</span>
      {ACTION_LABELS[action]}
    </button>
  );
}
