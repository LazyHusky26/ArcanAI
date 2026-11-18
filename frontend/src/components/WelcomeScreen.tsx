import { useStore, type Status } from "../store";
import Sigil from "./Sigil";

// What to tell the visitor when something is missing (shown in red)
const PROBLEMS: Partial<Record<Status, string>> = {
  offline: "Can't reach the server. Start the backend, then try again.",
  no_key: "Before you begin, open Settings (the gear, top right) and paste your Gemini API key.",
  no_model: "Almost there. Open Settings (the gear, top right) and pick a model.",
};

export default function WelcomeScreen() {
  const { status, begin, init } = useStore();

  return (
    <div className="welcome">
      <header className="masthead">
        <Sigil />
        <h1>ArcanAI</h1>
        <p className="tagline">Ask, and the cards will answer.</p>
      </header>

      {status === "checking" && <p className="status">Waking the cards…</p>}
      {status === "ready" && (
        <>
          <p className="hint">Welcome. Take a breath, think of a question, and begin when you're ready.</p>
          <button className="seal" onClick={begin}>
            Begin
          </button>
        </>
      )}
      {PROBLEMS[status] && (
        <>
          <p className="problem" role="alert">
            {PROBLEMS[status]}
          </p>
          {status === "offline" && (
            <button className="ghost" onClick={init}>
              Try again
            </button>
          )}
        </>
      )}
    </div>
  );
}
