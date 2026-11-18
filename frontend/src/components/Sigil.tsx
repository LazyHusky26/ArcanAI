// A small sun sigil above the title
export default function Sigil() {
  return (
    <svg className="sigil" viewBox="-30 -30 60 60" aria-hidden>
      <circle r="9" />
      <circle r="14" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        const long = i % 3 === 0;
        return (
          <line
            key={i}
            x1={Math.cos(a) * 17}
            y1={Math.sin(a) * 17}
            x2={Math.cos(a) * (long ? 28 : 23)}
            y2={Math.sin(a) * (long ? 28 : 23)}
          />
        );
      })}
    </svg>
  );
}
