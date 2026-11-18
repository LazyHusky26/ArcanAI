import { MOCK_SPREADS, mockStream } from "./mock";
import type { Depth, DrawnCard, Spread } from "./types";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
// Talks to the real backend by default. For UI work without it, create frontend/.env with VITE_USE_MOCK=true
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export async function getSpreads(): Promise<Spread[]> {
  if (USE_MOCK) return MOCK_SPREADS;
  const res = await fetch(`${API}/spreads`);
  if (!res.ok) throw new Error("Could not load the spreads.");
  return res.json();
}

interface Handlers {
  onCards: (cards: DrawnCard[]) => void;
  onText: (piece: string) => void;
  onDone: () => void;
  onError: (message: string) => void;
}

// POST the question, then read the Server-Sent Events stream piece by piece.
// (The browser's EventSource only does GET, so we read the stream with fetch.)
export async function streamReading(
  body: { question: string; spread: string; depth: Depth },
  h: Handlers,
): Promise<void> {
  if (USE_MOCK) return mockStream(body, h);
  let res: Response;
  try {
    res = await fetch(`${API}/reading`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return h.onError("Could not reach the server. Is the backend running?");
  }
  if (!res.ok || !res.body) {
    const detail = res.status === 400 ? (await res.json()).detail : "Something went wrong.";
    return h.onError(detail);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    // Events are separated by a blank line; keep any half-received event in the buffer
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";
    for (const raw of events) {
      const event = /^event: (.*)$/m.exec(raw)?.[1];
      const data = JSON.parse(/^data: (.*)$/m.exec(raw)?.[1] ?? "null");
      if (event === "cards") h.onCards(data);
      else if (event === "text") h.onText(data);
      else if (event === "done") h.onDone();
      else if (event === "error") h.onError(data);
    }
  }
}
