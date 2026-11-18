import { AnimatePresence, motion } from "framer-motion";
import { Children, type ReactNode } from "react";
import Markdown, { type Components } from "react-markdown";
import { useStore } from "../store";
import Astrolabe from "./Astrolabe";
import DeckShuffle from "./DeckShuffle";
import TarotCard from "./TarotCard";

// Wraps the names of the drawn cards in a highlight, wherever they appear in the text.
// Case-sensitive on purpose, so ordinary words like "strength" or "justice" are left alone.
function Highlight({ children }: { children?: ReactNode }) {
  const cards = useStore((s) => s.cards);
  if (!cards.length) return <>{children}</>;
  const names = cards.map((c) => c.card.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`\\b(${names.join("|")})\\b`, "g");
  return (
    <>
      {Children.map(children, (child) =>
        typeof child === "string"
          ? child.split(re).map((part, i) => (i % 2 ? <span key={i} className="cardname">{part}</span> : part))
          : child,
      )}
    </>
  );
}

// Each paragraph or heading fades up (and sharpens) when it first appears, so streamed text reads like ink appearing.
// Defined once, outside the component, so React keeps existing paragraphs instead of replaying them.
const fade = {
  initial: { opacity: 0, y: 8, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.7 },
};
const parts: Components = {
  h2: ({ children }) => <motion.h2 {...fade}>{children}</motion.h2>,
  h3: ({ children }) => <motion.h3 {...fade}>{children}</motion.h3>,
  p: ({ children }) => (
    <motion.p {...fade}>
      <Highlight>{children}</Highlight>
    </motion.p>
  ),
  strong: ({ children }) => (
    <strong>
      <Highlight>{children}</Highlight>
    </strong>
  ),
  em: ({ children }) => (
    <em>
      <Highlight>{children}</Highlight>
    </em>
  ),
};

export default function ReadingScreen() {
  const { phase, question, cards, revealed, text, flip, revealAll, reset } = useStore();
  // Cards may already exist while the ring is still circling; they are only shown once the AI answers
  const hasCards = phase !== "drawing" && cards.length > 0;
  const allRevealed = hasCards && revealed.every(Boolean);

  return (
    <div className="reading-screen">
      <p className="asked">“{question}”</p>
      <div className="rule" />

      <div className="table">
        <Astrolabe className="runes" />
        <AnimatePresence>{phase === "drawing" && <DeckShuffle key="deck" />}</AnimatePresence>
        {hasCards &&
          cards.map((c, i) => (
            <TarotCard key={i} card={c} index={i} total={cards.length} revealed={revealed[i]} onFlip={() => flip(i)} />
          ))}
      </div>

      {phase === "drawing" && <p className="status">The cards are gathering their answer…</p>}

      {hasCards && !allRevealed && (
        <div className="hint">
          <p>Touch each card to reveal it.</p>
          <button className="ghost" onClick={revealAll}>
            Reveal all
          </button>
        </div>
      )}

      {/* The reading appears once every card is face up; the text keeps streaming in behind the scenes */}
      <AnimatePresence>
        {allRevealed && (
          <motion.article
            className="reading frame"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.9 }}
          >
            {text ? <Markdown components={parts}>{text}</Markdown> : <p className="muted">The reading is taking shape…</p>}
            {phase === "reading" && text && <span className="cursor" />}
          </motion.article>
        )}
      </AnimatePresence>

      {phase === "done" && allRevealed && (
        <button className="seal" onClick={reset}>
          Ask Another Question
        </button>
      )}
    </div>
  );
}
