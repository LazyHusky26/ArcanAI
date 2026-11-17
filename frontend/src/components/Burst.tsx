import { motion } from "framer-motion";

const SPARKS = 12;

// A ring of light plus sparks flying outward; plays once when it mounts (when a card is revealed)
export default function Burst() {
  return (
    <div className="burst" aria-hidden>
      <motion.span
        className="burst-ring"
        initial={{ scale: 0.6, opacity: 0.9 }}
        animate={{ scale: 2.2, opacity: 0 }}
        transition={{ duration: 0.9, delay: 0.3, ease: "easeOut" }}
      />
      {Array.from({ length: SPARKS }, (_, i) => {
        const a = (i / SPARKS) * Math.PI * 2;
        return (
          <motion.span
            key={i}
            className="spark"
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(a) * 110, y: Math.sin(a) * 150, opacity: 0, scale: 0 }}
            transition={{ duration: 0.9, delay: 0.35, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}
