import { motion } from "framer-motion";

const COUNT = 10;
const RADIUS = 185; // px; wide enough that neighbouring cards don't overlap

// A ring of card backs orbiting in 3D while the reading is being prepared.
// Each card sits at its own angle around the circle; the whole ring spins.
export default function DeckShuffle() {
  return (
    <motion.div
      className="deck"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      // On exit the ring shrinks into the centre (while spinning faster, below); the dealt cards appear from that spot
      exit={{ opacity: 0, scale: 0.15, transition: { duration: 0.6, ease: "easeIn" } }}
    >
      <div className="deck-glow" />
      {/* A wider, slower ring of tiny lights turning the other way */}
      <motion.div className="ring-tilt" style={{ rotateX: -15 }}>
        <motion.div
          className="ring"
          animate={{ rotateY: -360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          {Array.from({ length: 28 }, (_, i) => (
            <div
              key={i}
              className="dust"
              style={{ transform: `rotateY(${(360 / 28) * i}deg) translateZ(255px) translateY(${(i % 5) * 14 - 28}px)` }}
            />
          ))}
        </motion.div>
      </motion.div>
      {/* Tilt the ring so we look down on it a little; the tilt gently sways */}
      <motion.div
        className="ring-tilt"
        animate={{ rotateX: [-20, -10, -20] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.div
          className="ring"
          animate={{ rotateY: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          exit={{ rotateY: 900, transition: { duration: 0.6, ease: "easeIn" } }}
        >
          {Array.from({ length: COUNT }, (_, i) => (
            <div
              key={i}
              className="orbit-card face back"
              style={{ transform: `rotateY(${(360 / COUNT) * i}deg) translateZ(${RADIUS}px)` }}
            />
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
