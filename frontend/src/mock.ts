import type { Depth, DrawnCard, Spread } from "./types";

// Placeholder data so the UI works without the backend (see USE_MOCK in api.ts)

export const MOCK_SPREADS: Spread[] = [
  {
    id: "one_card",
    name: "One Card",
    description:
      "Draw one card for a simple answer, message or piece of guidance: the main energy around your situation and what to focus on.",
    when_to_use: "A quick message or daily guidance.",
    example_question: "What energy should I focus on today?",
    positions: [{ name: "The Message", meaning: "The main energy around the situation, and the guidance to focus on" }],
  },
  {
    id: "three_card",
    name: "Three Cards",
    description: "Each of the three cards stands for a different part of your situation, so you can understand it more deeply.",
    when_to_use: "A specific question where you want clarity.",
    example_question: "Where is my career heading?",
    positions: [
      { name: "Past", meaning: "What led to the situation and still shapes it" },
      { name: "Present", meaning: "Where things stand right now" },
      { name: "Future", meaning: "Where things are heading if nothing changes" },
    ],
  },
  {
    id: "five_card",
    name: "Five Cards",
    description:
      "Five cards explore different layers of a question: what is happening, what is influencing it, and what you can do about it.",
    when_to_use: "A deeper reading about love, career, relationships, decisions or personal growth.",
    example_question: "Should I accept the job offer in another city?",
    positions: [
      { name: "Current Situation", meaning: "What is happening now" },
      { name: "Influences", meaning: "What is influencing the situation" },
      { name: "Hidden Obstacle", meaning: "What stands in the way, possibly unseen" },
      { name: "Advice or Action", meaning: "What the querent can do" },
      { name: "Possible Outcome", meaning: "Where this path may lead" },
    ],
  },
];

const MAJORS = [
  "The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor", "The Hierophant",
  "The Lovers", "The Chariot", "Strength", "The Hermit", "Wheel of Fortune", "Justice", "The Hanged Man",
  "Death", "Temperance", "The Devil", "The Tower", "The Star", "The Moon", "The Sun", "Judgement", "The World",
];
const RANKS = ["Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Page", "Knight", "Queen", "King"];
const SUITS = ["Wands", "Cups", "Swords", "Pentacles"];
const DECK = [...MAJORS, ...SUITS.flatMap((s) => RANKS.map((r) => `${r} of ${s}`))];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function draw(spread: Spread): DrawnCard[] {
  // Shuffle a copy, take the first N: no repeats
  const deck = [...DECK].sort(() => Math.random() - 0.5);
  return spread.positions.map((p, i) => ({
    position: p.name,
    position_meaning: p.meaning,
    card: deck[i],
    orientation: Math.random() < 0.5 ? "reversed" : "upright",
  }));
}

const SENTENCES = [
  "This card speaks of a quiet shift beneath the surface, something you may already sense but have not named.",
  "Notice where your energy goes without effort; that is often where the card is pointing.",
  "There is tension here between what you want and what feels safe, and neither side is wrong.",
  "The imagery asks you to slow down and look at the whole picture before you act.",
  "Old patterns are loosening their grip, though letting go may feel uncomfortable at first.",
  "Honesty with yourself is the strongest tool this card offers.",
];

function placeholderReading(question: string, cards: DrawnCard[], depth: Depth): string {
  const n = depth === "quick" ? 1 : depth === "detailed" ? 3 : 5;
  const perCard = cards
    .map((c, i) => {
      const body = Array.from({ length: n }, (_, k) => SENTENCES[(i + k) % SENTENCES.length]).join(" ");
      return `### ${c.position}: ${c.card} (${c.orientation})\n\n${body}`;
    })
    .join("\n\n");
  return [
    `## Overview\n\n*This is a placeholder reading; the backend is disconnected.* You asked: “${question}”. The cards below are drawn at random so you can test the animations.`,
    `## The Cards\n\n${perCard}`,
    `## How the Cards Connect\n\nTaken together, the cards describe a story of change, hesitation and choice. This part is a placeholder for the AI's own synthesis.`,
    `## Advice\n\nTake one small, honest step this week and see how it feels. Placeholder text ends here.`,
  ].join("\n\n");
}

interface Handlers {
  onCards: (cards: DrawnCard[]) => void;
  onText: (piece: string) => void;
  onDone: () => void;
  onError: (message: string) => void;
}

// Pretends to be the backend: a pause (cards being drawn), the cards, a pause (the AI thinking), then streamed text
export async function mockStream(body: { question: string; spread: string; depth: Depth }, h: Handlers) {
  const spread = MOCK_SPREADS.find((s) => s.id === body.spread);
  if (!spread || !body.question.trim()) return h.onError("Please enter a question.");
  await sleep(2400);
  const cards = draw(spread);
  h.onCards(cards);
  await sleep(1200);
  const tokens = placeholderReading(body.question, cards, body.depth).split(/(\s+)/);
  for (let i = 0; i < tokens.length; i += 2) {
    h.onText(tokens.slice(i, i + 2).join(""));
    await sleep(35);
  }
  h.onDone();
}
