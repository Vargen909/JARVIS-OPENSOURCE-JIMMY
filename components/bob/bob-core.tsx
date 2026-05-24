"use client";

import { motion } from "framer-motion";
import { BobOrbitalRings } from "./bob-orbital-rings";
import { BobParticles } from "./bob-particles";
import { BobNetwork } from "./bob-network";
import { BobGlow } from "./bob-glow";
import { BobPulse } from "./bob-pulse";
import {
  applyIntensity,
  getBobMotion,
  resolveBobSize,
  type BobSize,
  type BobState,
  type BobVariant,
} from "./use-bob-motion";

interface BobCoreProps {
  /** Visual style. cinematic = home/core, network = command center, minimal = chat empty, compact = headers */
  variant?: BobVariant;
  state?: BobState;
  /** isThinking/isSpeaking/isListening helpers (state takes precedence if given). */
  isThinking?: boolean;
  isSpeaking?: boolean;
  isListening?: boolean;
  size?: BobSize;
  /** Center text. Defaults to "B.O.B" — pass empty string to hide. */
  label?: string;
  /** Multiplier on glow intensity and animation speed. 1 = baseline, >1 = more active (audio-reactive). */
  intensity?: number;
  className?: string;
}

/**
 * The single source of truth for the B.O.B neural identity.
 *
 * One component, four visual variants, six animation states, infinite size
 * combinations. All sub-components share motion timing via use-bob-motion so
 * orb, particles, glow, pulses, and network feel like one organism.
 */
export function BobCore({
  variant = "cinematic",
  state: stateProp,
  isThinking,
  isSpeaking,
  isListening,
  size = "lg",
  label = "B.O.B",
  intensity = 1,
  className,
}: BobCoreProps) {
  const state: BobState =
    stateProp ??
    (isSpeaking
      ? "speaking"
      : isThinking
        ? "thinking"
        : isListening
          ? "listening"
          : "idle");

  const px = resolveBobSize(size);
  const m = applyIntensity(getBobMotion(state), intensity);
  const center = px / 2;
  const coreR = px * 0.085 * (1 + Math.max(0, intensity - 1) * 0.18);

  // Compact variant: tiny breathing dot for headers/badges. No rings.
  if (variant === "compact") {
    return (
      <div
        className={className}
        style={{ width: px, height: px, position: "relative" }}
      >
        <motion.div
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgb(var(--accent-glow) / 0.45) 0%, transparent 65%)",
          }}
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{
            duration: m.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <div
          aria-hidden
          className="absolute rounded-full"
          style={{
            left: "30%",
            top: "30%",
            width: "40%",
            height: "40%",
            background:
              "radial-gradient(circle at 35% 35%, white 0%, rgb(var(--accent)) 50%, rgb(var(--accent-glow)) 100%)",
            boxShadow: `0 0 ${px * 0.35}px rgb(var(--accent-glow) / 0.7)`,
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        width: px,
        height: px,
        maxWidth: "100%",
        maxHeight: "100%",
        position: "relative",
      }}
    >
      <BobGlow state={state} />

      {/* Variant-specific decoration */}
      {variant === "cinematic" && <BobOrbitalRings state={state} size={px} />}
      {variant === "network" && <BobNetwork state={state} size={px} />}
      {variant === "minimal" && (
        <BobOrbitalRings state={state} size={px} />
      )}

      {variant === "cinematic" && (
        <BobParticles state={state} size={px} />
      )}
      {variant === "minimal" && (
        <BobParticles state={state} size={px} density={0.5} />
      )}

      {/* Core orb — common to all non-compact variants */}
      <svg
        width={px}
        height={px}
        viewBox={`0 0 ${px} ${px}`}
        className="absolute inset-0 pointer-events-none"
        aria-hidden
      >
        <defs>
          <radialGradient id="bob-core-grad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="white" />
            <stop offset="40%" stopColor="rgb(var(--accent))" />
            <stop offset="100%" stopColor="rgb(var(--accent-glow))" />
          </radialGradient>
          <filter id="bob-core-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer halo */}
        <motion.circle
          cx={center}
          cy={center}
          r={coreR * 2.5}
          fill="rgb(var(--accent))"
          opacity={0.16 * m.glowIntensity}
          filter="url(#bob-core-glow)"
          animate={{ r: [coreR * 2.3, coreR * 2.85, coreR * 2.3] }}
          transition={{ duration: m.duration, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Mid glow */}
        <motion.circle
          cx={center}
          cy={center}
          r={coreR * 1.65}
          fill="rgb(var(--accent))"
          opacity={0.4 * m.glowIntensity}
          filter="url(#bob-core-glow)"
          animate={{ r: [coreR * 1.55, coreR * 1.85, coreR * 1.55] }}
          transition={{
            duration: m.duration * 0.7,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        {/* Core sphere */}
        <motion.circle
          cx={center}
          cy={center}
          r={coreR * 2.2}
          fill="url(#bob-core-grad)"
          filter="url(#bob-core-glow)"
          animate={{ r: [coreR * 2.1, coreR * 2.4, coreR * 2.1] }}
          transition={{
            duration: m.duration * 0.55,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        {/* Inner stroke */}
        <motion.circle
          cx={center}
          cy={center}
          r={coreR * 1.4}
          fill="none"
          stroke="white"
          strokeWidth="1"
          opacity={0.3}
          animate={{
            r: [coreR * 1.3, coreR * 1.5, coreR * 1.3],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: m.duration * 0.85,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Label */}
        {label && variant !== "minimal" && (
          <motion.text
            x={center}
            y={center}
            textAnchor="middle"
            dominantBaseline="central"
            fill="white"
            fontFamily="var(--font-mono), ui-monospace, monospace"
            fontWeight={700}
            letterSpacing="0.18em"
            filter="url(#bob-core-glow)"
            style={{ fontSize: Math.max(10, px * 0.07) }}
            animate={{ opacity: [0.85, 1, 0.85] }}
            transition={{
              duration: m.duration,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {label}
          </motion.text>
        )}

        {/* Scan line — cinematic only */}
        {variant === "cinematic" && label && (
          <motion.rect
            x={center - px * 0.06}
            y={center - px * 0.025}
            width={px * 0.12}
            height={2}
            fill="white"
            opacity={0.6}
            rx={1}
            animate={{
              y: [center - px * 0.03, center + px * 0.025, center - px * 0.03],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        )}
      </svg>

      <BobPulse state={state} size={px} />
    </div>
  );
}
