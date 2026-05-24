"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CoreFocusOverlayProps {
  active: boolean;
}

/**
 * Cinematic vignette and ambient layer that overlays the entire viewport
 * while Neural Focus Mode is active.
 *
 * Layers:
 *   1. Deep radial vignette  → pushes the corners toward black, leaving the orb haloed
 *   2. Subtle drifting noise → adds an organic "alive" film grain texture
 *   3. Pulsing ring          → a single, very soft accent ring that breathes
 *   4. Hint chip             → "F5 to exit Neural Focus" pill (auto-fades after 4s)
 *
 * The overlay sits below the orb (the orb stays at z-content) but above
 * the background, so the orb is visually framed and dominates the screen.
 */
export function CoreFocusOverlay({ active }: CoreFocusOverlayProps) {
  const [hintVisible, setHintVisible] = useState(false);

  useEffect(() => {
    if (!active) return;
    setHintVisible(true);
    const t = setTimeout(() => setHintVisible(false), 4000);
    return () => clearTimeout(t);
  }, [active]);

  return (
    <AnimatePresence>
      {active && (
        <>
          {/* Deep vignette layer */}
          <motion.div
            key="focus-vignette"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="pointer-events-none fixed inset-0 z-[var(--z-bg)]"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.85) 100%)",
            }}
          />

          {/* Slow ambient breath ring centered behind the orb */}
          <motion.div
            key="focus-breath"
            aria-hidden
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{
              opacity: [0.18, 0.32, 0.18],
              scale: [0.95, 1.05, 0.95],
            }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="pointer-events-none fixed inset-0 z-[var(--z-bg)] flex items-center justify-center"
          >
            <div
              className="rounded-full"
              style={{
                width: "min(70vmin, 720px)",
                height: "min(70vmin, 720px)",
                background:
                  "radial-gradient(circle at center, rgb(var(--accent-glow) / 0.2) 0%, transparent 60%)",
                filter: "blur(40px)",
              }}
            />
          </motion.div>

          {/* Hint chip — auto-fades after 4 seconds */}
          <AnimatePresence>
            {hintVisible && (
              <motion.div
                key="focus-hint"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.5 }}
                className="pointer-events-none fixed bottom-6 left-1/2 -translate-x-1/2 z-[var(--z-floating-nav)]"
              >
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-bg-card/70 border border-white/[0.07] backdrop-blur-xl">
                  <span className="text-[11px] text-ink-dim">
                    Neural Focus Mode
                  </span>
                  <span className="text-[10px] text-ink-mute font-mono">
                    F5 to exit · ESC
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}
