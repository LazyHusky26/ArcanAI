import { motion } from "framer-motion";
import { useEffect, useState, type FormEvent } from "react";
import { getModels, getSettings, removeKey, saveKey, saveSettings } from "../api";
import { useStore } from "../store";
import type { ModelInfo, Settings } from "../types";

export default function SettingsModal() {
  const { setSettingsOpen, cursorOn, setCursorOn } = useStore();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [keyInput, setKeyInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const close = () => setSettingsOpen(false);

  // Load what is saved; if there is a key, load its models too
  useEffect(() => {
    (async () => {
      try {
        const s = await getSettings();
        setSettings(s);
        if (s.has_key) setModels(await getModels());
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const checkKey = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      setModels(await saveKey(keyInput)); // the backend checks the key and saves it only if it works
      setSettings(await getSettings());
      setKeyInput("");
    } catch (err) {
      setError((err as Error).message);
    }
    setBusy(false);
  };

  const pickModel = async (model: string) => {
    setError("");
    try {
      setSettings(await saveSettings({ model }));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const forgetKey = async () => {
    setError("");
    try {
      const s = await removeKey();
      setSettings(s);
      setModels([]);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const model = settings?.model ?? "";
  const known = models.some((m) => m.id === model);

  return (
    <motion.div
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={close}
    >
      <motion.div
        className="frame settings"
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 16, opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={close} aria-label="Close settings">
          ×
        </button>
        <h2>Settings</h2>

        <section>
          <h3>Gemini API key</h3>
          {settings?.has_key && (
            <p className="note">
              Key saved (ends in {settings.key_hint}).{" "}
              <button className="link" onClick={forgetKey}>
                Remove
              </button>
            </p>
          )}
          <form onSubmit={checkKey} className="key-form">
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder={settings?.has_key ? "Paste a new key to replace it" : "Paste your key"}
              autoComplete="off"
              spellCheck={false}
              aria-label="Gemini API key"
            />
            <button className="mini-btn" disabled={busy || !keyInput.trim()}>
              {busy ? "Checking…" : "Check"}
            </button>
          </form>
          <p className="note small">
            Get a free key at aistudio.google.com/apikey. It is saved on the computer running the backend, not in your browser.
          </p>
        </section>

        {models.length > 0 && (
          <section>
            <h3>Model</h3>
            <select value={model} onChange={(e) => pickModel(e.target.value)} aria-label="Model">
              {!model && <option value="">Choose a model</option>}
              {model && !known && <option value={model}>{model}</option>}
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </section>
        )}

        <section>
          <label className="toggle">
            <span>Smoke cursor effect</span>
            <input type="checkbox" checked={cursorOn} onChange={(e) => setCursorOn(e.target.checked)} />
            <i aria-hidden="true" />
          </label>
        </section>

        {error && <p className="modal-error">{error}</p>}
      </motion.div>
    </motion.div>
  );
}
