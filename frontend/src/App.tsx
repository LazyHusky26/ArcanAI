import { useEffect } from "react";
import AskScreen from "./components/AskScreen";
import ReadingScreen from "./components/ReadingScreen";
import { useStore } from "./store";

export default function App() {
  const { phase, error, loadSpreads, reset } = useStore();

  useEffect(() => {
    loadSpreads();
  }, [loadSpreads]);

  return (
    <main>
      {phase === "ask" && <AskScreen />}
      {phase === "drawing" && <p className="center muted">Drawing your cards…</p>}
      {(phase === "reading" || phase === "done") && <ReadingScreen />}
      {phase === "error" && (
        <div className="center error">
          <p>{error}</p>
          <button className="primary" onClick={reset}>
            Try again
          </button>
        </div>
      )}
    </main>
  );
}
