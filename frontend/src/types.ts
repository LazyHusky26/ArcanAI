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
