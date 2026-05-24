"use client";

import { motion } from "framer-motion";
import { getBobMotion, type BobState } from "./use-bob-motion";

interface BobPulseProps {
  state: BobState;
  size: number;
}

/**
 * State-driven ripples sitting OUTSIDE the orb. Listening pulses softly,
 * speaking emits expanding waves, thinking shows a spinner ring,
 * processing reuses the thinking spinner. Idle renders nothing.
 */
export function BobPulse({ state, size }: BobPulseProps) {
  const m = getBobMotion(state);
  const center = size / 2;

  if (state === "idle" || state === "active") return null;

  if (state === "listening") {
    return (
      <motion.div
        aria-hidden
        className="absolute rounded-full pointer-events-none"
        style={{
          left: center - size * 0.36,
          top: center - size * 0.36,
          width: size * 0.72,
          height: size * 0.72,
          border: "2px solid rgb(var(--accent) / 0.4)",
        }}
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.4, 0.75, 0.4],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    );
  }

  if (state === "thinking" || state === "processing") {
    return (
      <div
        aria-hidden
        className="absolute rounded-full pointer-events-none"
        style={{
          left: center - size * 0.39,
          top: center - size * 0.39,
          width: size * 0.78,
          height: size * 0.78,
          border: "2px solid transparent",
          borderTopColor: "rgb(var(--accent))",
          borderRightColor: "rgb(var(--accent))",
          opacity: 0.65,
          animation: `bob-spin ${m.duration * 1.1}s linear infinite`,
        }}
      />
    );
  }

  // speaking: 3 expanding ripples
  return (
    <>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={`speak-${i}`}
          aria-hidden
          className="absolute rounded-full pointer-events-none"
          style={{
            left: center - size * 0.13,
            top: center - size * 0.13,
            width: size * 0.26,
            height: size * 0.26,
            border: "1px solid rgb(var(--accent) / 0.45)",
          }}
          animate={{
            scale: [1, 3.4],
            opacity: [0.6, 0],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.4,
            ease: "easeOut",
          }}
        />
      ))}
    </>
  );
}
