import Markdown from "react-markdown";
import { useStore } from "../store";
import TarotCard from "./TarotCard";

export default function ReadingScreen() {
  const { phase, question, cards, revealed, text, flip, revealAll, reset } = useStore();
  const allRevealed = revealed.every(Boolean);

  return (
    <div className="reading-screen">
      <p className="asked">“{question}”</p>

      <div className="cards">
        {cards.map((c, i) => (
          <TarotCard key={i} card={c} revealed={revealed[i]} onFlip={() => flip(i)} />
        ))}
      </div>

      {!allRevealed && (
        <button className="secondary" onClick={revealAll}>
          Reveal all
        </button>
      )}

      <article className="reading">
        {text ? <Markdown>{text}</Markdown> : <p className="muted">The reading is taking shape…</p>}
        {phase === "reading" && text && <span className="cursor" />}
      </article>

      {phase === "done" && (
        <button className="primary" onClick={reset}>
          Ask another question
        </button>
      )}
    </div>
  );
}
