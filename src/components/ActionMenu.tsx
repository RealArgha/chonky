import { ACTION_LABELS, ActionKey } from "@/lib/chonky";

const ACTION_EMOJI: Record<ActionKey, string> = {
  eat: "🍽️",
  sleep: "😴",
  bath: "🛁",
  play: "🧶",
};

const GRID_ORDER: ActionKey[] = ["eat", "sleep", "bath", "play"];

export function ActionMenu({
  disabled,
  onPress,
}: {
  disabled: boolean;
  onPress: (action: ActionKey) => void;
}) {
  return (
    <div className="pixel-frame grid grid-cols-2 grid-rows-2 border-4 border-white bg-gradient-to-b from-blue-500 to-blue-800 shadow-[0_0_0_4px_#0f172a]">
      {GRID_ORDER.map((action, i) => (
        <button
          key={action}
          type="button"
          disabled={disabled}
          onClick={() => onPress(action)}
          className={`flex items-center justify-center gap-2 px-4 py-5 font-pixel text-[11px] uppercase tracking-wide text-white transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-white/10 active:bg-white/20 ${
            i % 2 === 0 ? "border-r-2 border-blue-300/50" : ""
          } ${i < 2 ? "border-b-2 border-blue-300/50" : ""}`}
        >
          <span className="text-lg">{ACTION_EMOJI[action]}</span>
          {ACTION_LABELS[action]}
        </button>
      ))}
    </div>
  );
}
