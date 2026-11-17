import { useStore } from "../store";
import type { Depth } from "../types";

const DEPTHS: { id: Depth; label: string; hint: string }[] = [
  { id: "quick", label: "Quick", hint: "A short take on each card" },
  { id: "detailed", label: "Detailed", hint: "A fuller reading" },
  { id: "deep", label: "Deep", hint: "Symbolism and context" },
];

export default function AskScreen() {
  const { spreads, spreadId, depth, question, setSpread, setDepth, setQuestion, startReading } = useStore();
  const selected = spreads.find((s) => s.id === spreadId);

  return (
    <form
      className="ask"
      onSubmit={(e) => {
        e.preventDefault();
        if (question.trim()) startReading();
      }}
    >
      <h1>ArcanAI</h1>
      <p className="tagline">Ask your question. The cards will answer.</p>

      <label htmlFor="question">Your question</label>
      <textarea
        id="question"
        value={question}
        maxLength={500}
        rows={3}
        placeholder={selected?.example_question ?? "What do you want to know?"}
        onChange={(e) => setQuestion(e.target.value)}
      />

      <label>Choose a spread</label>
      <div className="spreads">
        {spreads.map((s) => (
          <button
            type="button"
            key={s.id}
            className={`spread ${s.id === spreadId ? "active" : ""}`}
            onClick={() => setSpread(s.id)}
          >
            <strong>{s.name}</strong>
            <span>{s.description}</span>
            <em>Best for: {s.when_to_use}</em>
          </button>
        ))}
      </div>

      <label>Depth</label>
      <div className="depths">
        {DEPTHS.map((d) => (
          <button
            type="button"
            key={d.id}
            className={`depth ${d.id === depth ? "active" : ""}`}
            title={d.hint}
            onClick={() => setDepth(d.id)}
          >
            {d.label}
          </button>
        ))}
      </div>

      <button type="submit" className="primary" disabled={!question.trim()}>
        Draw the cards
      </button>
    </form>
  );
}
