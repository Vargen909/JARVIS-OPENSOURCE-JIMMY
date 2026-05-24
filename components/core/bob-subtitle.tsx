"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { BobState } from "@/lib/bob-state";

interface BobSubtitleProps {
  state: BobState;
  subtitle: string;
  intensity?: number;
  minimal?: boolean;
}

/**
 * Cinematic subtitle beneath the B.O.B orb.
 * Calm, premium typography. Status in Swedish as per the design brief.
 */
export function BobSubtitle({
  state,
  subtitle,
  intensity = 1,
  minimal = false,
}: BobSubtitleProps) {
  if (minimal) return null;

  return (
    <div className="mt-8 flex flex-col items-center w-full max-w-xl px-6">
      <AnimatePresence mode="wait">
        {state === "thinking" || state === "transcribing" ? (
          <motion.div
            key="thinking"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 h-1 rounded-full bg-accent/70"
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}
                />
              ))}
            </div>
            <span className="text-[13px] text-ink-mute tracking-wide">{subtitle}</span>
          </motion.div>
        ) : state === "speaking" || state === "action_executing" ? (
          <motion.div
            key="speaking"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-4 text-center"
          >
            {/* Audio wave bars */}
            <div className="flex items-center gap-[3px]">
              {[...Array(9)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-[3px] bg-accent/60 rounded-full"
                  animate={{
                    height: [3, Math.max(6, 20 * (0.5 + intensity * 0.5)), 3],
                    opacity: [0.4, 0.9, 0.4],
                  }}
                  transition={{
                    duration: 0.5 + i * 0.03,
                    repeat: Infinity,
                    delay: i * 0.04,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
            <p className="text-[14px] font-light text-ink-dim line-clamp-3 max-w-sm leading-relaxed">
              {subtitle}
            </p>
          </motion.div>
        ) : state === "recording_command" || state === "wake_detected" ? (
          <motion.div
            key="listening"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3"
          >
            <div className="flex items-center gap-[3px]">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-[3px] bg-accent rounded-full"
                  animate={{ height: [5, 5 + 12 * intensity, 5] }}
                  transition={{ duration: 0.45, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
                />
              ))}
            </div>
            <span className="text-[13px] text-accent/90 font-medium tracking-wide">{subtitle}</span>
          </motion.div>
        ) : state === "error" ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <p className="text-[13px] text-rose-400/80 max-w-sm line-clamp-3">{subtitle}</p>
          </motion.div>
        ) : state === "muted" ? (
          <motion.div
            key="muted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-[12px] text-ink-mute/50 tracking-[0.12em] uppercase">{subtitle}</p>
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
            className="text-center space-y-2"
          >
            {state === "idle" || state === "passive_wake_listening" ? (
              <>
                <p className="text-[15px] font-light text-ink/70 leading-relaxed">
                  Säg{" "}
                  <span className="text-accent/80">&ldquo;Hej B.O.B&rdquo;</span>
                  {" "}eller skriv ett kommando
                </p>
              </>
            ) : (
              <p className="text-[13px] text-ink-mute/60 tracking-wide">{subtitle}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
