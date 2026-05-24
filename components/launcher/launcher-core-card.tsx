"use client";

import { motion } from "framer-motion";
import { BobCore } from "@/components/bob/bob-core";
import { cn } from "@/lib/utils";

interface LauncherCoreCardProps {
  onClick: () => void;
}

/**
 * Special B.O.B identity card — the premium orb centerpiece of the launcher.
 * Uses the live BobCore orb, deeper glow, and elevated visual weight to
 * feel like the heart of the OS.
 */
export function LauncherCoreCard({ onClick }: LauncherCoreCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -3, scale: 1.025 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      aria-label="B.O.B – Neural AI Core"
      className={cn(
        "group relative flex flex-col items-center justify-center gap-2.5 pt-4 pb-4",
        "aspect-square w-full rounded-2xl",
        "bg-bg-card/50 backdrop-blur-xl",
        "border border-accent/15",
        "transition-all duration-250",
        "hover:border-accent/35",
        "cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/50 focus-visible:ring-offset-1 focus-visible:ring-offset-bg",
        "overflow-hidden",
      )}
    >
      {/* Cinematic depth glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500 opacity-60 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(ellipse 90% 80% at 50% 30%, rgb(var(--accent-glow) / 0.18) 0%, transparent 70%)",
        }}
        aria-hidden
      />

      {/* Bottom glow edge */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-px pointer-events-none opacity-40 group-hover:opacity-80 transition-opacity duration-400"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgb(var(--accent-glow) / 0.7), transparent)",
        }}
        aria-hidden
      />

      {/* Live orb */}
      <div className="relative z-10 flex-shrink-0">
        <BobCore
          variant="minimal"
          state="idle"
          size={76}
          label=""
          intensity={0.9}
        />
      </div>

      {/* Label */}
      <span
        className={cn(
          "relative z-10",
          "text-[10px] font-semibold tracking-[0.25em] uppercase",
          "text-accent/80 group-hover:text-accent",
          "transition-colors duration-200",
        )}
      >
        B.O.B
      </span>

      {/* Subtle accent line */}
      <div
        className="relative z-10 w-6 h-px opacity-40 group-hover:opacity-70 transition-all duration-300 group-hover:w-10"
        style={{ background: "rgb(var(--accent-glow))" }}
        aria-hidden
      />
    </motion.button>
  );
}
