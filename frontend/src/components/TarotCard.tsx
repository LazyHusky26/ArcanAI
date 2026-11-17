import { motion } from "framer-motion";
import { useState } from "react";
import type { DrawnCard } from "../types";

// "The Fool" -> "the-fool": the image filename in public/cards/
const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

interface Props {
  card: DrawnCard;
  revealed: boolean;
  onFlip: () => void;
}

export default function TarotCard({ card, revealed, onFlip }: Props) {
  // If there is no image yet for this card, show its name instead
  const [imgFailed, setImgFailed] = useState(false);
  const reversed = card.orientation === "reversed";

  return (
    <div className="slot">
      <div className="slot-label">{card.position}</div>
      <motion.button
        className="card"
        onClick={onFlip}
        animate={{ rotateY: revealed ? 180 : 0 }}
        transition={{ duration: 0.7, ease: "easeInOut" }}
        whileHover={revealed ? undefined : { y: -6 }}
        aria-label={revealed ? `${card.card}, ${card.orientation}` : `Reveal the card for ${card.position}`}
      >
        <div className="face back" />
        <div className="face front">
          {/* A reversed card is the same image turned upside down */}
          <div className="front-inner" style={{ transform: reversed ? "rotate(180deg)" : undefined }}>
            {imgFailed ? (
              <span className="card-name">{card.card}</span>
            ) : (
              <img src={`/cards/${slug(card.card)}.webp`} alt={card.card} onError={() => setImgFailed(true)} />
            )}
          </div>
        </div>
      </motion.button>
      <div className={`slot-caption ${revealed ? "shown" : ""}`}>
        {card.card}
        {reversed ? " (reversed)" : ""}
      </div>
    </div>
  );
}
