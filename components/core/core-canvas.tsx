"use client";

import { motion, AnimatePresence } from "framer-motion";
import { BobCore } from "@/components/bob/bob-core";

export interface CoreCanvasProps {
  size: number;
  pending: boolean;
  speaking: boolean;
  listening: boolean;
  /** Reply text shown briefly under the orb while speaking. */
  lastReplyContent?: string;
  /** The user's most recent message — echoed under the orb so the user can see what was sent. */
  lastUserMessage?: string | null;
  /** Name shown in the idle greeting. */
  userName?: string;
  /** External audio-reactive multiplier (1 = baseline). */
  intensity?: number;
  /** Hide all centerpiece text. Used in Neural Focus Mode. */
  minimal?: boolean;
}

/**
 * Centerpiece of Core Mode: the cinematic B.O.B orb plus a single
 * state-aware text block that morphs between thinking, speaking,
 * listening, and ready states. The orb is the visual anchor; text
 * is secondary and fades cleanly between states.
 */
export function CoreCanvas({
  size,
  pending,
  speaking,
  listening,
  lastReplyContent,
  lastUserMessage,
  userName,
  intensity = 1,
  minimal = false,
}: CoreCanvasProps) {
  const showUserEcho = !minimal && !!lastUserMessage && (pending || speaking);

  return (
    <div className="relative z-10 flex-1 min-h-0 flex flex-col items-center justify-center w-full px-6">
      <AnimatePresence>
        {showUserEcho && (
          <motion.div
            key="user-echo"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="mb-4 max-w-xl px-4 py-2 rounded-2xl bg-white/[0.04] border border-white/[0.06] text-center"
          >
            <p className="text-[11px] uppercase tracking-widest text-ink-mute mb-1">
              You
            </p>
            <p className="text-sm text-ink line-clamp-2">{lastUserMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <BobCore
          variant="cinematic"
          size={size}
          isThinking={pending}
          isSpeaking={speaking}
          isListening={listening}
          intensity={intensity}
        />
      </motion.div>

      <AnimatePresence mode="wait">
        {minimal ? null : pending ? (
          <motion.div
            key="thinking"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-6 flex flex-col items-center gap-2"
          >
            <div className="flex items-center gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-accent"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
            <span className="text-sm text-ink-mute">Processing…</span>
          </motion.div>
        ) : speaking && lastReplyContent ? (
          <motion.div
            key="speaking"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-6 flex flex-col items-center gap-3 max-w-2xl px-6 text-center"
          >
            <div className="flex items-center gap-1.5">
              {[...Array(7)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-accent rounded-full"
                  animate={{
                    height: [4, 16 * (0.7 + intensity * 0.3), 4],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 0.4,
                    repeat: Infinity,
                    delay: i * 0.05,
                  }}
                />
              ))}
            </div>
            <p className="text-sm text-ink-dim line-clamp-3">
              {lastReplyContent}
            </p>
          </motion.div>
        ) : listening ? (
          <motion.div
            key="listening"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-6 flex items-center gap-1.5"
          >
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-accent rounded-full"
                animate={{ height: [8, 8 + 14 * intensity, 8] }}
                transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.1 }}
              />
            ))}
            <span className="ml-2 text-sm text-accent">Listening…</span>
          </motion.div>
        ) : (
          <motion.div
            key="ready"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-6 text-center"
          >
            <h2 className="text-2xl font-light text-ink">
              {userName ? `Hi ${userName}, how can I help?` : "How can I help?"}
            </h2>
            <p className="text-sm text-ink-mute mt-1.5">
              Type a command or press the microphone.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
