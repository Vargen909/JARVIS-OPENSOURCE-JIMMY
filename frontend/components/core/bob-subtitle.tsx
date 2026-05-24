"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { BobState } from "@/lib/bob-state";

interface BobSubtitleProps {
  state: BobState;
  subtitle: string;
  /** Amplitud 0-2 för speaking-bars. */
  intensity?: number;
  minimal?: boolean;
}

/**
 * Minimal cinematic subtitle shown beneath the B.O.B orb.
 * One component, one responsibility: show the right text + animation
 * for the current state. Max 3 lines, fades in/out in 250 ms.
 */
export function BobSubtitle({
  state,
  subtitle,
  intensity = 1,
  minimal = false,
}: BobSubtitleProps) {
  if (minimal) return null;

  return (
    <div className="mt-6 flex flex-col items-center w-full max-w-2xl px-6">
      <AnimatePresence mode="wait">
        {state === "thinking" || state === "transcribing" ? (
          <motion.div
            key="thinking"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center gap-2"
          >
            <div className="flex items-center gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-accent"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
            <span className="text-sm text-ink-mute">{subtitle}</span>
          </motion.div>
        ) : state === "speaking" || state === "action_executing" ? (
          <motion.div
            key="speaking"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center gap-3 text-center"
          >
            <div className="flex items-center gap-1.5">
              {[...Array(7)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-accent rounded-full"
                  animate={{
                    height: [4, 16 * (0.6 + intensity * 0.4), 4],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.05 }}
                />
              ))}
            </div>
            <p className="text-sm text-ink-dim line-clamp-3 max-w-lg">{subtitle}</p>
          </motion.div>
        ) : state === "recording_command" || state === "wake_detected" ? (
          <motion.div
            key="listening"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-2"
          >
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-accent rounded-full"
                animate={{ height: [8, 8 + 14 * intensity, 8] }}
                transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.1 }}
              />
            ))}
            <span className="ml-2 text-sm text-accent font-medium">{subtitle}</span>
          </motion.div>
        ) : state === "error" ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="text-center"
          >
            <p className="text-sm text-red-400 max-w-md line-clamp-3">{subtitle}</p>
          </motion.div>
        ) : state === "muted" ? (
          <motion.div
            key="muted"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="text-center"
          >
            <p className="text-sm text-ink-mute opacity-60">{subtitle}</p>
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="text-center"
          >
            {state === "idle" ? (
              <>
                <h2 className="text-2xl font-light text-ink">
                  Hej! Hur kan jag hjälpa?
                </h2>
                <p className="text-sm text-ink-mute mt-1.5 opacity-60">
                  Säg "Hej B.O.B" eller skriv ett kommando.
                </p>
              </>
            ) : (
              <p className="text-sm text-ink-mute opacity-50">{subtitle}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
