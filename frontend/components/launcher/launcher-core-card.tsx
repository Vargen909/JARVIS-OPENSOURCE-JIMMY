"use client";

import { motion } from "framer-motion";
import { BobCore } from "@/components/bob/bob-core";
import { cn } from "@/lib/utils";

interface LauncherCoreCardProps {
  onClick: () => void;
}

/**
 * Special B.O.B identity card.
 *
 * Uses the live BobCore orb instead of a static icon, giving the launcher's
 * "home" button a uniquely animated, premium AI-core feeling that stands apart
 * from the rest of the grid.
 */
export function LauncherCoreCard({ onClick }: LauncherCoreCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      aria-label="B.O.B – Neural AI Core"
      className={cn(
        "group relative flex flex-col items-center justify-center gap-3",
        "aspect-square w-full rounded-2xl",
        // Slightly more intense background to distinguish from plain cards
        "bg-gradient-to-b from-bg-card/60 to-bg-card/30 backdrop-blur-xl",
        "border border-accent/20",
        "shadow-glow",
        "transition-all duration-200",
        "hover:border-accent/40 hover:shadow-[0_0_32px_-8px_rgb(var(--accent-glow)/0.35)]",
        "cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        "overflow-hidden",
      )}
    >
      {/* Ambient neural glow in background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30 group-hover:opacity-50 transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(circle at 50% 42%, rgb(var(--accent-glow) / 0.28) 0%, transparent 65%)",
        }}
        aria-hidden
      />

      {/* Live orb — minimal variant keeps particles light, rings active */}
      <div className="relative z-10 flex-shrink-0">
        <BobCore
          variant="minimal"
          state="idle"
          size={80}
          label=""
          intensity={0.85}
        />
      </div>

      {/* Label */}
      <span
        className={cn(
          "relative z-10",
          "text-[11px] font-medium tracking-[0.22em] uppercase",
          "text-accent group-hover:text-white",
          "transition-colors duration-200",
        )}
      >
        B.O.B
      </span>

      {/* Accent line — uses global accent colour */}
      <div
        className="relative z-10 w-8 h-px bg-accent opacity-60 group-hover:opacity-100 transition-opacity duration-200"
        aria-hidden
      />
    </motion.button>
  );
}
