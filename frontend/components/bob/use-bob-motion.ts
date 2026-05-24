"use client";

/**
 * Shared timing & intensity configuration for the entire B.O.B neural system.
 *
 * Every component in the bob/ family pulls its animation rhythm from here so
 * the orb, particles, glows, and pulses feel like one coordinated organism
 * across every view.
 */

export type BobState =
  | "idle"
  | "thinking"
  | "speaking"
  | "listening"
  | "processing"
  | "active";

export type BobVariant = "cinematic" | "network" | "minimal" | "compact";

export type BobSize = "sm" | "md" | "lg" | "xl" | number;

export interface BobMotion {
  /** Base loop duration for breathing, glow, etc. (s) */
  duration: number;
  /** Multiplier on glow halos and core brightness (1 = baseline) */
  glowIntensity: number;
  /** Ring/particle rotation period at slowest layer (s) */
  ringSpeed: number;
  /** Whether the core is "active" (animated more vividly) */
  active: boolean;
}

const TABLE: Record<BobState, BobMotion> = {
  idle: { duration: 2.4, glowIntensity: 1.0, ringSpeed: 36, active: false },
  active: { duration: 1.8, glowIntensity: 1.2, ringSpeed: 28, active: true },
  listening: { duration: 1.4, glowIntensity: 1.25, ringSpeed: 22, active: true },
  thinking: { duration: 0.9, glowIntensity: 1.55, ringSpeed: 14, active: true },
  processing: { duration: 0.9, glowIntensity: 1.55, ringSpeed: 14, active: true },
  speaking: { duration: 0.5, glowIntensity: 1.85, ringSpeed: 9, active: true },
};

export function getBobMotion(state: BobState): BobMotion {
  return TABLE[state] ?? TABLE.idle;
}

const SIZE_PX: Record<Exclude<BobSize, number>, number> = {
  sm: 140,
  md: 240,
  lg: 340,
  xl: 460,
};

export function resolveBobSize(size: BobSize): number {
  return typeof size === "number" ? size : SIZE_PX[size];
}

/** Map the layout store's "sm" / "md" / "lg" brain size to a BobSize. */
export function brainSizeToBob(s: "sm" | "md" | "lg"): BobSize {
  return s;
}
