import { create } from "zustand";
import { getSettings, getSpreads, saveSettings, streamReading } from "./api";
import type { Depth, DrawnCard, Spread } from "./types";

// welcome: first screen, checks the setup | ask: the form | drawing: waiting for the cards
// reading: cards shown, text streaming | done: finished | error: something failed
export type Phase = "welcome" | "ask" | "drawing" | "reading" | "done" | "error";

// What the welcome screen found: still checking, backend down, no key, no model, or good to go
export type Status = "checking" | "offline" | "no_key" | "no_model" | "ready";

interface State {
  phase: Phase;
  status: Status;
  spreads: Spread[];
  spreadId: string;
  depth: Depth;
  question: string;
  cards: DrawnCard[];
  revealed: boolean[]; // which cards have been flipped face-up
  text: string;
  error: string;
  settingsOpen: boolean;
  cursorOn: boolean;
  setSettingsOpen: (open: boolean) => void;
  setCursorOn: (on: boolean) => void;
  init: () => Promise<void>;
  begin: () => void;
  setSpread: (id: string) => void;
  setDepth: (d: Depth) => void;
  setQuestion: (q: string) => void;
  flip: (i: number) => void;
  revealAll: () => void;
  startReading: () => Promise<void>;
  reset: () => void;
}

export const useStore = create<State>((set, get) => ({
  phase: "welcome",
  status: "checking",
  spreads: [],
  spreadId: "three_card",
  depth: "detailed",
  question: "",
  cards: [],
  revealed: [],
  text: "",
  error: "",
  settingsOpen: false,
  cursorOn: true, // on until the user turns it off in Settings

  setSettingsOpen: (settingsOpen) => {
    set({ settingsOpen });
    if (!settingsOpen) get().init(); // the key or model may have changed, so check again
  },
  setCursorOn: (cursorOn) => {
    set({ cursorOn });
    saveSettings({ cursor: cursorOn }).catch(() => {}); // the switch still works if saving fails
  },

  // Checks the backend and the saved key/model. Runs at start and whenever Settings closes.
  init: async () => {
    try {
      const { has_key, model, cursor } = await getSettings();
      const status: Status = !has_key ? "no_key" : !model ? "no_model" : "ready";
      if (cursor !== null) set({ cursorOn: cursor });
      if (status === "ready" && get().spreads.length === 0) set({ spreads: await getSpreads() });
      set({ status });
    } catch {
      set({ status: "offline" });
    }
    // If the key went away while on the question form, go back to the welcome screen
    if (get().phase === "ask" && get().status !== "ready") set({ phase: "welcome" });
  },
  begin: () => set({ phase: "ask" }),

  setSpread: (spreadId) => set({ spreadId }),
  setDepth: (depth) => set({ depth }),
  setQuestion: (question) => set({ question }),
  flip: (i) => set((s) => ({ revealed: s.revealed.map((r, j) => (j === i ? true : r)) })),
  // Flip the remaining cards one after another (not all at once) so the reveal feels staged
  revealAll: () => {
    get().revealed.forEach((done, i) => {
      if (!done) setTimeout(() => get().flip(i), i * 350);
    });
  },

  startReading: async () => {
    const { question, spreadId, depth } = get();
    set({ phase: "drawing", cards: [], revealed: [], text: "", error: "" });
    await streamReading(
      { question, spread: spreadId, depth },
      {
        // Cards are decided early but stay hidden (phase stays "drawing") until the AI starts answering
        onCards: (cards) => set({ cards, revealed: cards.map(() => false) }),
        onText: (piece) =>
          set((s) => ({ text: s.text + piece, phase: s.phase === "drawing" ? "reading" : s.phase })),
        onDone: () => set({ phase: "done" }),
        onError: (error) => set({ phase: "error", error }),
      },
    );
  },
  reset: () => {
    set({ phase: get().spreads.length ? "ask" : "welcome", cards: [], revealed: [], text: "", error: "" });
    get().init();
  },
}));
