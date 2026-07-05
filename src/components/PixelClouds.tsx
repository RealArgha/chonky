const CLOUDS = [
  { top: "6%", left: "8%", scale: 1 },
  { top: "12%", left: "68%", scale: 1.3 },
  { top: "22%", left: "35%", scale: 0.8 },
] as const;

const BIRDS = [
  { top: "10%", left: "22%", scale: 2 },
  { top: "17%", left: "78%", scale: 1.6 },
] as const;

const TREES: { bottom: string; left?: string; right?: string; scale: number }[] = [
  { bottom: "9%", left: "3%", scale: 1.2 },
  { bottom: "7%", right: "4%", scale: 1 },
  { bottom: "10%", left: "14%", scale: 0.8 },
  { bottom: "8%", right: "16%", scale: 0.9 },
  { bottom: "11%", left: "24%", scale: 0.6 },
  { bottom: "9%", right: "26%", scale: 0.7 },
];

function Cloud({ scale }: { scale: number }) {
  return (
    <svg width={64 * scale} height={40 * scale} viewBox="0 0 16 10" shapeRendering="crispEdges">
      <rect x="3" y="2" width="4" height="2" fill="#ffffff" />
      <rect x="1" y="4" width="10" height="2" fill="#ffffff" />
      <rect x="0" y="6" width="12" height="2" fill="#ffffff" />
      <rect x="2" y="8" width="8" height="1" fill="#ffffff" />
    </svg>
  );
}

function Bird({ scale }: { scale: number }) {
  return (
    <svg width={20 * scale} height={12 * scale} viewBox="0 0 10 6" shapeRendering="crispEdges">
      <rect x="1" y="2" width="2" height="1" fill="#4b5563" />
      <rect x="3" y="1" width="2" height="1" fill="#4b5563" />
      <rect x="5" y="1" width="2" height="1" fill="#4b5563" />
      <rect x="7" y="2" width="2" height="1" fill="#4b5563" />
    </svg>
  );
}

function Tree({ scale }: { scale: number }) {
  return (
    <svg width={40 * scale} height={56 * scale} viewBox="0 0 10 14" shapeRendering="crispEdges">
      <rect x="4" y="10" width="2" height="4" fill="#8a5a3b" />
      <rect x="2" y="6" width="6" height="2" fill="#3f9142" />
      <rect x="1" y="4" width="8" height="2" fill="#4caf50" />
      <rect x="2" y="2" width="6" height="2" fill="#3f9142" />
      <rect x="3" y="0" width="4" height="2" fill="#4caf50" />
    </svg>
  );
}

export function PixelClouds() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      {CLOUDS.map((cloud, i) => (
        <div key={`cloud-${i}`} className="absolute opacity-90" style={{ top: cloud.top, left: cloud.left }}>
          <Cloud scale={cloud.scale} />
        </div>
      ))}
      {BIRDS.map((bird, i) => (
        <div key={`bird-${i}`} className="absolute opacity-80" style={{ top: bird.top, left: bird.left }}>
          <Bird scale={bird.scale} />
        </div>
      ))}
      {TREES.map((tree, i) => (
        <div
          key={`tree-${i}`}
          className="absolute"
          style={{ bottom: tree.bottom, left: tree.left, right: tree.right }}
        >
          <Tree scale={tree.scale} />
        </div>
      ))}
    </div>
  );
}
