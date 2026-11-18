import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import AskScreen from "./components/AskScreen";
import Atmosphere from "./components/Atmosphere";
import GhostCursor from "./components/GhostCursor";
import ReadingScreen from "./components/ReadingScreen";
import { useStore } from "./store";

// Wraps each screen so it fades in and the old one fades out
function Screen({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const { phase, error, loadSpreads, reset } = useStore();

  useEffect(() => {
    loadSpreads();
  }, [loadSpreads]);

  const onTable = phase === "drawing" || phase === "reading" || phase === "done";
  // The smoke cursor is skipped for people who asked their system to reduce motion
  const [calm] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  return (
    <>
      <Atmosphere />
      {!calm && (
        <div className="ghost-layer">
          <GhostCursor
            color="#5d8fb3"
            style={{ opacity: 0.7 }}
            size={45}
            trailLength={18}
            inertia={0.25}
            turbulence={0.5}
            drift={0.3}
            bloomStrength={0.35}
            grainIntensity={0.05}
            detail={0.8}
            brightness={0.6}
            bloomRadius={1}
            edgeIntensity={0}
            fadeDelayMs={600}
            fadeDurationMs={900}
            clickPuff
            intro
          />
        </div>
      )}
      <main>
      <AnimatePresence mode="wait">
        {phase === "ask" && (
          <Screen key="ask">
            <AskScreen />
          </Screen>
        )}
        {onTable && (
          <Screen key="table">
            <ReadingScreen />
          </Screen>
        )}
        {phase === "error" && (
          <Screen key="error">
            <div className="center error">
              <p>{error}</p>
              <button className="seal" onClick={reset}>
                Try again
              </button>
            </div>
          </Screen>
        )}
      </AnimatePresence>
      </main>
    </>
  );
}
