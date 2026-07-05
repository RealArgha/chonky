import { ActionKey } from "@/lib/chonky";

function EatIcon() {
  return (
    <svg viewBox="0 0 12 12" width="20" height="20" shapeRendering="crispEdges">
      <rect x="4" y="2" width="4" height="1" fill="#ffd28a" />
      <rect x="3" y="3" width="6" height="2" fill="#f6a94a" />
      <rect x="1" y="7" width="10" height="1" fill="#64748b" />
      <rect x="1" y="8" width="10" height="2" fill="#94a3b8" />
      <rect x="2" y="10" width="8" height="1" fill="#475569" />
    </svg>
  );
}

function SleepIcon() {
  return (
    <svg viewBox="0 0 12 12" width="20" height="20" shapeRendering="crispEdges">
      <rect x="4" y="2" width="4" height="1" fill="#7c5cff" />
      <rect x="3" y="3" width="6" height="1" fill="#7c5cff" />
      <rect x="3" y="4" width="6" height="4" fill="#7c5cff" />
      <rect x="3" y="8" width="6" height="1" fill="#7c5cff" />
      <rect x="4" y="9" width="4" height="1" fill="#7c5cff" />
      <rect x="6" y="2" width="6" height="1" fill="#d9c7ff" />
      <rect x="6" y="3" width="6" height="1" fill="#d9c7ff" />
      <rect x="6" y="4" width="6" height="4" fill="#d9c7ff" />
      <rect x="6" y="8" width="6" height="1" fill="#d9c7ff" />
      <rect x="6" y="9" width="6" height="1" fill="#d9c7ff" />
      <rect x="9" y="1" width="1" height="1" fill="#ffffff" />
      <rect x="2" y="6" width="1" height="1" fill="#ffffff" />
    </svg>
  );
}

function BathIcon() {
  return (
    <svg viewBox="0 0 12 12" width="20" height="20" shapeRendering="crispEdges">
      <rect x="5" y="1" width="2" height="1" fill="#2f9bd6" />
      <rect x="4" y="2" width="4" height="1" fill="#2f9bd6" />
      <rect x="3" y="3" width="6" height="1" fill="#2f9bd6" />
      <rect x="2" y="4" width="8" height="4" fill="#2f9bd6" />
      <rect x="3" y="8" width="6" height="1" fill="#2f9bd6" />
      <rect x="4" y="9" width="4" height="1" fill="#2f9bd6" />
      <rect x="4" y="5" width="1" height="2" fill="#bff0ff" />
      <rect x="9" y="2" width="1" height="1" fill="#8fd9ff" />
      <rect x="10" y="4" width="1" height="1" fill="#8fd9ff" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 12 12" width="20" height="20" shapeRendering="crispEdges">
      <rect x="4" y="2" width="4" height="1" fill="#f28ba0" />
      <rect x="3" y="3" width="6" height="1" fill="#f28ba0" />
      <rect x="2" y="4" width="8" height="4" fill="#f28ba0" />
      <rect x="3" y="8" width="6" height="1" fill="#f28ba0" />
      <rect x="4" y="9" width="4" height="1" fill="#f28ba0" />
      <rect x="2" y="5" width="8" height="1" fill="#d94f68" />
      <rect x="5" y="3" width="1" height="6" fill="#d94f68" />
      <rect x="8" y="9" width="1" height="1" fill="#d94f68" />
      <rect x="9" y="10" width="1" height="1" fill="#d94f68" />
      <rect x="10" y="10" width="1" height="1" fill="#d94f68" />
    </svg>
  );
}

export const ACTION_ICONS: Record<ActionKey, () => React.ReactElement> = {
  eat: EatIcon,
  sleep: SleepIcon,
  bath: BathIcon,
  play: PlayIcon,
};
