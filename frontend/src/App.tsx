import { AnimatePresence, motion } from "framer-motion";
import { useEffect, type ReactNode } from "react";
import AskScreen from "./components/AskScreen";
import Atmosphere from "./components/Atmosphere";
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

  return (
    <>
      <Atmosphere />
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
