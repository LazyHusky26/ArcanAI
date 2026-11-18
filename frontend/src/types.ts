// Shapes of the data the backend sends (see backend/src/arcanai/api.py)

export type Depth = "quick" | "detailed" | "deep";

export interface Spread {
  id: string;
  name: string;
  description: string;
  when_to_use: string;
  example_question: string;
  positions: { name: string; meaning: string }[];
}

export interface DrawnCard {
  position: string;
  position_meaning: string;
  card: string;
  orientation: "upright" | "reversed";
}

export interface Settings {
  has_key: boolean;
  key_hint: string; // last 4 characters only; the full key never comes back
  model: string;
  cursor: boolean | null; // null = never chosen
}

export interface ModelInfo {
  id: string;
  name: string;
}
