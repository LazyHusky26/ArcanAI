import { create } from "zustand";
import { getSpreads, streamReading } from "./api";
import type { Depth, DrawnCard, Spread } from "./types";

// ask: the form | drawing: waiting for the cards | reading: cards shown, text streaming
// done: finished | error: something failed
export type Phase = "ask" | "drawing" | "reading" | "done" | "error";

interface State {
  phase: Phase;
  spreads: Spread[];
  spreadId: string;
  depth: Depth;
  question: string;
  cards: DrawnCard[];
  revealed: boolean[]; // which cards have been flipped face-up
  text: string;
  error: string;
  loadSpreads: () => Promise<void>;
  setSpread: (id: string) => void;
  setDepth: (d: Depth) => void;
  setQuestion: (q: string) => void;
  flip: (i: number) => void;
  revealAll: () => void;
  startReading: () => Promise<void>;
  reset: () => void;
}

export const useStore = create<State>((set, get) => ({
  phase: "ask",
  spreads: [],
  spreadId: "three_card",
  depth: "detailed",
  question: "",
  cards: [],
  revealed: [],
  text: "",
  error: "",

  loadSpreads: async () => {
    try {
      set({ spreads: await getSpreads() });
    } catch (e) {
      set({ phase: "error", error: (e as Error).message });
    }
  },
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
  reset: () => set({ phase: "ask", cards: [], revealed: [], text: "", error: "" }),
}));
