import { useMemo, type CSSProperties } from "react";
import Astrolabe from "./Astrolabe";

// Same input gives the same "random" number, so the dust sits in the same places on every render
const rand = (i: number, k: number) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

// The fixed background behind every screen. Everything here is decoration, so it is hidden from screen readers.
export default function Atmosphere() {
  const motes = useMemo(
    () =>
      Array.from({ length: 34 }, (_, i) => ({
        left: rand(i, 1) * 100,
        size: 1 + rand(i, 2) * 2.5,
        duration: 16 + rand(i, 3) * 20,
        delay: -rand(i, 4) * 36, // negative: they start already mid-flight
        drift: (rand(i, 5) - 0.5) * 90,
      })),
    [],
  );

  return (
    <div className="atmosphere" aria-hidden>
      <div className="mist mist-a" />
      <div className="mist mist-b" />
      <div className="mist mist-c" />
      <div className="moon" />
      <Astrolabe className="astrolabe" />
      {motes.map((m, i) => (
        <span
          key={i}
          className="mote"
          style={
            {
              left: `${m.left}%`,
              width: m.size,
              height: m.size,
              animationDuration: `${m.duration}s`,
              animationDelay: `${m.delay}s`,
              "--drift": `${m.drift}px`,
            } as CSSProperties
          }
        />
      ))}
      <div className="grain" />
      <div className="vignette" />
    </div>
  );
}
