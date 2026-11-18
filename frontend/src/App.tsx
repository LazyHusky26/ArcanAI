import { AnimatePresence, motion } from "framer-motion";
import { useEffect, type ReactNode } from "react";
import AskScreen from "./components/AskScreen";
import Atmosphere from "./components/Atmosphere";
import GhostCursor from "./components/GhostCursor";
import ReadingScreen from "./components/ReadingScreen";
import SettingsModal from "./components/SettingsModal";
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
  const { phase, error, loadSpreads, loadSettings, reset, settingsOpen, setSettingsOpen, cursorOn } = useStore();

  useEffect(() => {
    loadSpreads();
    loadSettings();
  }, [loadSpreads, loadSettings]);

  const onTable = phase === "drawing" || phase === "reading" || phase === "done";

  return (
    <>
      <Atmosphere />
      {cursorOn && (
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
      <button className="gear" onClick={() => setSettingsOpen(true)} aria-label="Open settings">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M10.55 4.54 L10.78 2.07 L13.22 2.07 L13.45 4.54 A 7.6 7.6 0 0 1 16.25 5.70 L18.16 4.12 L19.88 5.84 L18.30 7.75 A 7.6 7.6 0 0 1 19.46 10.55 L21.93 10.78 L21.93 13.22 L19.46 13.45 A 7.6 7.6 0 0 1 18.30 16.25 L19.88 18.16 L18.16 19.88 L16.25 18.30 A 7.6 7.6 0 0 1 13.45 19.46 L13.22 21.93 L10.78 21.93 L10.55 19.46 A 7.6 7.6 0 0 1 7.75 18.30 L5.84 19.88 L4.12 18.16 L5.70 16.25 A 7.6 7.6 0 0 1 4.54 13.45 L2.07 13.22 L2.07 10.78 L4.54 10.55 A 7.6 7.6 0 0 1 5.70 7.75 L4.12 5.84 L5.84 4.12 L7.75 5.70 A 7.6 7.6 0 0 1 10.55 4.54Z" />
          <circle cx="12" cy="12" r="3.1" />
        </svg>
      </button>
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
      <AnimatePresence>{settingsOpen && <SettingsModal />}</AnimatePresence>
    </>
  );
}
