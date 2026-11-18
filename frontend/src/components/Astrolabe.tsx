// A line-art "star wheel": rings, tick marks, a hexagram. Pure SVG; styled and rotated by CSS.
const ticks = Array.from({ length: 72 }, (_, i) => {
  const a = (i * 5 * Math.PI) / 180;
  const r1 = i % 6 === 0 ? 82 : 87; // longer mark every 30 degrees
  return { x1: Math.cos(a) * r1, y1: Math.sin(a) * r1, x2: Math.cos(a) * 92, y2: Math.sin(a) * 92 };
});

// Two overlapping triangles make the six-pointed star
const triangle = (offset: number) =>
  [0, 1, 2]
    .map((k) => {
      const a = ((-90 + offset + k * 120) * Math.PI) / 180;
      return `${(Math.cos(a) * 68).toFixed(2)},${(Math.sin(a) * 68).toFixed(2)}`;
    })
    .join(" ");

const dots = Array.from({ length: 12 }, (_, i) => {
  const a = (i * 30 * Math.PI) / 180;
  return { cx: Math.cos(a) * 76, cy: Math.sin(a) * 76 };
});

export default function Astrolabe({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="-100 -100 200 200" aria-hidden>
      <circle r="96" />
      <circle r="92" />
      <circle r="60" />
      <circle r="34" />
      {ticks.map((t, i) => (
        <line key={i} {...t} />
      ))}
      <polygon points={triangle(0)} />
      <polygon points={triangle(180)} />
      {dots.map((d, i) => (
        <circle key={i} {...d} r="1.2" className="dot" />
      ))}
    </svg>
  );
}
