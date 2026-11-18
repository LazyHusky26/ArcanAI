import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useStore } from "../store";
import type { Depth } from "../types";

// Depth is shown as a moon: crescent (quick), half (detailed), full (deep)
function Moon({ phase }: { phase: "crescent" | "half" | "full" }) {
  const shape = {
    crescent: <path d="M12 2 A10 10 0 0 0 12 22 A6 10 0 0 1 12 2 Z" />,
    half: <path d="M12 2 A10 10 0 0 0 12 22 Z" />,
    full: <circle cx="12" cy="12" r="10" />,
  }[phase];
  return (
    <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1" />
      <g fill="currentColor">{shape}</g>
    </svg>
  );
}

const DEPTHS: { id: Depth; label: string; phase: "crescent" | "half" | "full"; hint: string }[] = [
  { id: "quick", label: "Quick", phase: "crescent", hint: "A short take on each card" },
  { id: "detailed", label: "Detailed", phase: "half", hint: "A fuller reading" },
  { id: "deep", label: "Deep", phase: "full", hint: "Symbolism and context" },
];

// A small sun sigil above the title
function Sigil() {
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

// The spread shown as a small fan of card backs; the fan opens when hovered or chosen
function Fan({ count, open }: { count: number; open: boolean }) {
  return (
    <div className="fan">
      {Array.from({ length: count }, (_, i) => {
        const t = count === 1 ? 0 : i / (count - 1) - 0.5; // -0.5 .. 0.5
        return (
          <motion.span
            key={i}
            className="mini"
            style={{ originY: 1.3 }} // pivot below the card so the cards fan out like a hand of cards
            animate={{ rotate: t * (open ? 40 : 24), x: t * (open ? 130 : 80), y: Math.abs(t) * (open ? 16 : 8) }}
            transition={{ type: "spring", stiffness: 160, damping: 16 }}
          />
        );
      })}
    </div>
  );
}

// Children fade in one after another, sharpening from a slight blur
const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item = {
  hidden: { opacity: 0, y: 14, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7 } },
};

export default function AskScreen() {
  const { spreads, spreadId, depth, question, setSpread, setDepth, setQuestion, startReading } = useStore();
  const [hovered, setHovered] = useState<string | null>(null);
  const shown = spreads.find((s) => s.id === (hovered ?? spreadId));
  const selected = spreads.find((s) => s.id === spreadId);

  return (
    <motion.form
      className="ask"
      variants={container}
      initial="hidden"
      animate="show"
      onSubmit={(e) => {
        e.preventDefault();
        if (question.trim()) startReading();
      }}
    >
      <motion.header variants={item} className="masthead">
        <Sigil />
        <h1>ArcanAI</h1>
        <p className="tagline">Ask, and the cards will answer.</p>
      </motion.header>

      <motion.div variants={item}>
        <label htmlFor="question">Whisper your question</label>
        <textarea
          id="question"
          value={question}
          maxLength={500}
          rows={2}
          placeholder={selected ? `e.g. ${selected.example_question}` : ""}
          onChange={(e) => setQuestion(e.target.value)}
        />
      </motion.div>

      <motion.div variants={item}>
        <label>Choose a spread</label>
        <div className="fans" role="radiogroup">
          {spreads.map((s) => (
            <motion.button
              type="button"
              role="radio"
              aria-checked={s.id === spreadId}
              key={s.id}
              className={`fan-btn ${s.id === spreadId ? "active" : ""}`}
              onClick={() => setSpread(s.id)}
              onHoverStart={() => setHovered(s.id)}
              onHoverEnd={() => setHovered(null)}
              onFocus={() => setHovered(s.id)}
              onBlur={() => setHovered(null)}
              whileTap={{ scale: 0.97 }}
            >
              <Fan count={s.positions.length} open={s.id === spreadId || s.id === hovered} />
              <span className="fan-name">{s.name}</span>
            </motion.button>
          ))}
        </div>

        {/* The description of whichever spread you are pointing at (or have chosen) */}
        <div className="spread-info frame">
          <AnimatePresence mode="wait">
            {shown && (
              <motion.div
                key={shown.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
              >
                <p>{shown.description}</p>
                <p className="positions">{shown.positions.map((p) => p.name).join("  ·  ")}</p>
                <p className="best">Best for: {shown.when_to_use}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <motion.div variants={item}>
        <label>Depth</label>
        <div className="moons" role="radiogroup">
          {DEPTHS.map((d) => (
            <motion.button
              type="button"
              role="radio"
              aria-checked={d.id === depth}
              key={d.id}
              className={`moon-btn ${d.id === depth ? "active" : ""}`}
              title={d.hint}
              onClick={() => setDepth(d.id)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Moon phase={d.phase} />
              <span>{d.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      <motion.div variants={item}>
        <button type="submit" className="seal" disabled={!question.trim()}>
          Draw the Cards
        </button>
      </motion.div>
    </motion.form>
  );
}
