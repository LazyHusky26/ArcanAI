import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useState, type PointerEvent } from "react";
import type { DrawnCard } from "../types";

// "The Fool" -> "the-fool": the image filename in public/cards/
const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const START_Y = -30; // lines the pile up with the centre of the collapsing ring
const SLOT_EXTRA = 84; // height of a slot beyond the card itself (label, caption, gaps)

// Mirrors the CSS (--pad, --gap, --card-w), so each card knows where it will land and where the pile is
function layout(index: number, total: number) {
  const vw = window.innerWidth;
  const phone = vw <= 600;
  const pad = phone ? 16 : 20;
  const gap = phone ? 12 : 24;
  const w = Math.min(160, Math.max(88, (vw - 2 * pad - 2 * gap - 1) / 3));
  const h = w * 1.4125;
  const perRow = Math.max(1, Math.floor((Math.min(980, vw) - 2 * pad + gap) / (w + gap)));
  const row = Math.floor(index / perRow);
  const inRow = Math.min(perRow, total - row * perRow);
  return {
    x: ((inRow - 1) / 2 - (index % perRow)) * (w + gap), // from the slot to the middle of its row
    y: START_Y - row * (h + SLOT_EXTRA + gap), // cards on lower rows start higher up
  };
}

interface Props {
  card: DrawnCard;
  index: number;
  total: number;
  revealed: boolean;
  onFlip: () => void;
}

// Layers, outside in: deal-in (slot) > idle float > tilt toward the mouse > flip (the button)
export default function TarotCard({ card, index, total, revealed, onFlip }: Props) {
  // Look in the card's folder first (cards/wands/ace-of-wands.webp), then loose in cards/; if neither exists, show the name
  const suit = /of (Wands|Cups|Swords|Pentacles)$/.exec(card.card)?.[1];
  const sources = [`/cards/${suit ? suit.toLowerCase() : "major"}/${slug(card.card)}.webp`, `/cards/${slug(card.card)}.webp`];
  const [attempt, setAttempt] = useState(0);
  const imgFailed = attempt >= sources.length;
  const [landed, setLanded] = useState(false);
  const reversed = card.orientation === "reversed";

  const delay = 0.35 + index * 0.18; // wait for the ring to gather, then deal one card at a time

  // Where the card starts: stacked in the middle of the row, where the deck was
  const [start] = useState(() => layout(index, total));
  const [startTilt] = useState((index - (total - 1) / 2) * -10 + (Math.random() - 0.5) * 12);

  // Mouse position over the card (0 to 1) drives a springy 3D tilt and a moving glare
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(my, [0, 1], [12, -12]), { stiffness: 200, damping: 18 });
  const rotateY = useSpring(useTransform(mx, [0, 1], [-12, 12]), { stiffness: 200, damping: 18 });
  const gx = useTransform(mx, (v) => `${v * 100}%`);
  const gy = useTransform(my, (v) => `${v * 100}%`);
  const glare = useMotionTemplate`radial-gradient(circle at ${gx} ${gy}, rgba(190, 235, 255, 0.28), transparent 55%)`;

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  };
  const onLeave = () => {
    mx.set(0.5);
    my.set(0.5);
  };

  return (
    <motion.div
      className="slot"
      // Starts as a loose pile where the ring collapsed (already visible, so there is no gap), then flies out
      initial={{ x: start.x, y: start.y, rotate: startTilt, scale: 0.8, opacity: 0, filter: "blur(4px)" }}
      animate={{ x: 0, y: [null, -120, 0], rotate: 0, scale: 1, opacity: 1, filter: "blur(0px)" }}
      // x, rotate and scale are springs (they overshoot and settle); y is an arc up and over, so the path curves
      transition={{
        x: { type: "spring", stiffness: 85, damping: 13, delay },
        rotate: { type: "spring", stiffness: 70, damping: 11, delay },
        scale: { type: "spring", stiffness: 120, damping: 14, delay },
        y: { duration: 1, times: [0, 0.4, 1], ease: "easeInOut", delay },
        opacity: { duration: 0.2, delay },
        filter: { duration: 0.6, delay },
      }}
      onAnimationComplete={() => setLanded(true)}
    >
      <div className={`slot-label ${landed ? "shown" : ""}`}>{card.position}</div>

      <motion.div
        className={`card-wrap ${landed ? "landed" : ""}`}
        animate={landed ? { y: [0, -7, 0] } : { y: 0 }}
        transition={{ duration: 3 + index * 0.4, repeat: Infinity, ease: "easeInOut" }}
      >
        {landed && (
          <motion.span
            className="land-ring"
            initial={{ scale: 0.9, opacity: 0.8 }}
            animate={{ scale: 1.6, opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
        )}

        <motion.div
          className="tilt"
          style={{ rotateX, rotateY, transformPerspective: 800 }}
          onPointerMove={onMove}
          onPointerLeave={onLeave}
        >
          <motion.button
            className={`card ${revealed ? "revealed" : ""}`}
            onClick={onFlip}
            aria-pressed={revealed}
            aria-label={revealed ? `${card.card}, ${card.orientation}` : `Reveal the card for ${card.position}`}
            animate={{ rotateY: revealed ? 180 : 0 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
            whileHover={revealed ? undefined : { y: -8 }}
          >
            <div className="face back" />
            <div className="face front">
              {/* A reversed card is the same image turned upside down */}
              <div className="front-inner" style={{ transform: reversed ? "rotate(180deg)" : undefined }}>
                {imgFailed ? (
                  <span className="card-name">{card.card}</span>
                ) : (
                  <img src={sources[attempt]} alt={card.card} onError={() => setAttempt((a) => a + 1)} />
                )}
              </div>
            </div>
          </motion.button>
          <motion.div className="glare" style={{ background: glare }} />
        </motion.div>
      </motion.div>

      <div className={`slot-caption ${revealed ? "shown" : ""}`}>
        {card.card}
        {reversed && <span className="tag">reversed</span>}
      </div>
    </motion.div>
  );
}
