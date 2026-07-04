const CLOUDS = [
  { top: "6%", left: "8%", scale: 1 },
  { top: "12%", left: "68%", scale: 1.3 },
  { top: "22%", left: "35%", scale: 0.8 },
] as const;

function Cloud({ scale }: { scale: number }) {
  return (
    <svg
      width={64 * scale}
      height={40 * scale}
      viewBox="0 0 16 10"
      shapeRendering="crispEdges"
    >
      <rect x="3" y="2" width="4" height="2" fill="#ffffff" />
      <rect x="1" y="4" width="10" height="2" fill="#ffffff" />
      <rect x="0" y="6" width="12" height="2" fill="#ffffff" />
      <rect x="2" y="8" width="8" height="1" fill="#ffffff" />
    </svg>
  );
}

export function PixelClouds() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      {CLOUDS.map((cloud, i) => (
        <div key={i} className="absolute opacity-90" style={{ top: cloud.top, left: cloud.left }}>
          <Cloud scale={cloud.scale} />
        </div>
      ))}
    </div>
  );
}
