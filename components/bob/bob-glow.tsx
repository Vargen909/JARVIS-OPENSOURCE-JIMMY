"use client";

import { motion } from "framer-motion";
import { getBobMotion, type BobState } from "./use-bob-motion";

interface BobGlowProps {
  state: BobState;
  /** 0..1 strength multiplier (also reads --glow-intensity via CSS). */
  strength?: number;
}

/**
 * Layered radial glow halos for the B.O.B core. Two soft layers + one
 * structural inner halo. Color is driven by --accent / --accent-glow so it
 * reacts to palette changes.
 */
export function BobGlow({ state, strength = 1 }: BobGlowProps) {
  const m = getBobMotion(state);
  const intensity = m.glowIntensity * strength;

  return (
    <>
      <motion.div
        aria-hidden
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgb(var(--accent-glow) / 0.55) 0%, transparent 60%)",
          opacity: 0.35 * intensity,
          filter: `blur(calc(8px * var(--glow-intensity, 1)))`,
        }}
        animate={{
          opacity: [0.25 * intensity, 0.55 * intensity, 0.25 * intensity],
        }}
        transition={{
          duration: m.duration * 1.4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        aria-hidden
        className="absolute inset-[-15%] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgb(var(--accent) / 0.30) 0%, transparent 55%)",
          opacity: 0.28 * intensity,
        }}
        animate={{
          scale: [1, 1.04, 1],
          opacity: [0.18 * intensity, 0.32 * intensity, 0.18 * intensity],
        }}
        transition={{
          duration: m.duration * 1.7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </>
  );
}
