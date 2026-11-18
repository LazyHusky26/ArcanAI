import { MOCK_SPREADS, mockStream } from "./mock";
import type { Depth, DrawnCard, ModelInfo, Settings, Spread } from "./types";

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

// ---------- Settings ----------
// Errors from the backend come as { detail: "..." }
async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    throw new Error("Could not reach the server. Is the backend running?");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(typeof body?.detail === "string" ? body.detail : "Something went wrong.");
  }
  return res.json();
}

const MOCK_SETTINGS: Settings = { has_key: true, key_hint: "mock", model: "mock-model", cursor: null };
const MOCK_MODELS: ModelInfo[] = [{ id: "mock-model", name: "Mock model" }];

export const getSettings = (): Promise<Settings> => (USE_MOCK ? Promise.resolve(MOCK_SETTINGS) : call("/settings"));

export const saveSettings = (changes: { model?: string; cursor?: boolean }): Promise<Settings> =>
  USE_MOCK ? Promise.resolve(MOCK_SETTINGS) : call("/settings", { method: "PUT", body: JSON.stringify(changes) });

// Checks the key with Gemini and saves it if it works; returns the text models
export const saveKey = async (apiKey: string): Promise<ModelInfo[]> =>
  USE_MOCK
    ? MOCK_MODELS
    : (await call<{ models: ModelInfo[] }>("/settings/key", { method: "POST", body: JSON.stringify({ api_key: apiKey }) })).models;

export const getModels = async (): Promise<ModelInfo[]> =>
  USE_MOCK ? MOCK_MODELS : (await call<{ models: ModelInfo[] }>("/settings/models")).models;

export const removeKey = (): Promise<Settings> =>
  USE_MOCK ? Promise.resolve(MOCK_SETTINGS) : call("/settings/key", { method: "DELETE" });
