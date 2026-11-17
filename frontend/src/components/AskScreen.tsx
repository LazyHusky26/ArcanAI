import { motion } from "framer-motion";
import { useStore } from "../store";
import type { Depth } from "../types";

const DEPTHS: { id: Depth; label: string; hint: string }[] = [
  { id: "quick", label: "Quick", hint: "A short take on each card" },
  { id: "detailed", label: "Detailed", hint: "A fuller reading" },
  { id: "deep", label: "Deep", hint: "Symbolism and context" },
];

// Children fade up one after another
const container = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } };
const item = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.55 } } };

export default function AskScreen() {
  const { spreads, spreadId, depth, question, setSpread, setDepth, setQuestion, startReading } = useStore();
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
      <motion.h1 variants={item}>ArcanAI</motion.h1>
      <motion.p variants={item} className="tagline">
        Ask your question. The cards will answer.
      </motion.p>

      <motion.div variants={item}>
        <label htmlFor="question">Your question</label>
        <textarea
          id="question"
          value={question}
          maxLength={500}
          rows={3}
          placeholder={selected?.example_question ?? "What do you want to know?"}
          onChange={(e) => setQuestion(e.target.value)}
        />
      </motion.div>

      <motion.div variants={item}>
        <label>Choose a spread</label>
        <div className="spreads">
          {spreads.map((s) => (
            <motion.button
              type="button"
              key={s.id}
              className={`spread ${s.id === spreadId ? "active" : ""}`}
              onClick={() => setSpread(s.id)}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              <strong>{s.name}</strong>
              <span>{s.description}</span>
              <em>Best for: {s.when_to_use}</em>
            </motion.button>
          ))}
        </div>
      </motion.div>

      <motion.div variants={item}>
        <label>Depth</label>
        <div className="depths">
          {DEPTHS.map((d) => (
            <motion.button
              type="button"
              key={d.id}
              className={`depth ${d.id === depth ? "active" : ""}`}
              title={d.hint}
              onClick={() => setDepth(d.id)}
              whileTap={{ scale: 0.95 }}
            >
              {d.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      <motion.div variants={item}>
        <button type="submit" className="primary" disabled={!question.trim()}>
          Draw the cards
        </button>
      </motion.div>
    </motion.form>
  );
}
