import { AnimatePresence, motion } from "framer-motion";
import Markdown, { type Components } from "react-markdown";
import { useStore } from "../store";
import DeckShuffle from "./DeckShuffle";
import TarotCard from "./TarotCard";

// Each paragraph or heading fades up when it first appears, so streamed text reveals gradually.
// (Defined once, outside the component, so React keeps existing paragraphs instead of replaying them.)
const fade = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 } };
const parts: Components = {
  h2: ({ children }) => <motion.h2 {...fade}>{children}</motion.h2>,
  h3: ({ children }) => <motion.h3 {...fade}>{children}</motion.h3>,
  p: ({ children }) => <motion.p {...fade}>{children}</motion.p>,
};

export default function ReadingScreen() {
  const { phase, question, cards, revealed, text, flip, revealAll, reset } = useStore();
  // Cards may already exist while the ring is still circling; they are only shown once the AI answers
  const hasCards = phase !== "drawing" && cards.length > 0;
  const allRevealed = hasCards && revealed.every(Boolean);

  return (
    <div className="reading-screen">
      <p className="asked">“{question}”</p>

      <div className="table">
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
          <button className="secondary" onClick={revealAll}>
            Reveal all
          </button>
        </div>
      )}

      {/* The reading appears once every card is face up; the text keeps streaming in behind the scenes */}
      <AnimatePresence>
        {allRevealed && (
          <motion.article
            className="reading"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            {text ? <Markdown components={parts}>{text}</Markdown> : <p className="muted">The reading is taking shape…</p>}
            {phase === "reading" && text && <span className="cursor" />}
          </motion.article>
        )}
      </AnimatePresence>

      {phase === "done" && allRevealed && (
        <button className="primary" onClick={reset}>
          Ask another question
        </button>
      )}
    </div>
  );
}
