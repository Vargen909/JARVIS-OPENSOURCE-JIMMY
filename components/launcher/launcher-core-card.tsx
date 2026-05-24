"use client";

import { motion } from "framer-motion";
import { BobCore } from "@/components/bob/bob-core";
import { cn } from "@/lib/utils";

interface LauncherCoreCardProps {
  onClick: () => void;
}

/**
 * Premium B.O.B identity card — the orb heart of the workspace launcher.
 * Elevated visual weight, deeper glow, smooth hover lift.
 */
export function LauncherCoreCard({ onClick }: LauncherCoreCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.03 }}
      whileTap={{ scale: 0.96, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      aria-label="B.O.B – Neural AI Core"
      className={cn(
        "group relative flex flex-col items-center justify-center gap-2.5",
        "pt-4 pb-4 aspect-square w-full rounded-2xl overflow-hidden",
        "bg-bg-card/45 backdrop-blur-xl",
        "border border-accent/12",
        "transition-[border-color,box-shadow] duration-300",
        "hover:border-accent/30",
        "hover:shadow-[0_8px_32px_-8px_rgb(var(--accent-glow)/0.35)]",
        "cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/40",
      )}
    >
      {/* Radial depth glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500 opacity-50 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(ellipse 90% 80% at 50% 25%, rgb(var(--accent-glow) / 0.16) 0%, transparent 65%)",
        }}
        aria-hidden
      />

      {/* Bottom edge glow line */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2/3 h-px pointer-events-none opacity-30 group-hover:opacity-70 group-hover:w-3/4 transition-all duration-500"
        style={{
          background: "linear-gradient(90deg, transparent, rgb(var(--accent-glow) / 0.8), transparent)",
        }}
        aria-hidden
      />

      {/* Live orb */}
      <div className="relative z-10 shrink-0">
        <BobCore
          variant="minimal"
          state="idle"
          size={70}
          label=""
          intensity={0.85}
        />
      </div>

      {/* Label */}
      <span
        className={cn(
          "relative z-10",
          "text-[9.5px] font-semibold tracking-[0.28em] uppercase",
          "text-accent/70 group-hover:text-accent",
          "transition-colors duration-200",
        )}
      >
        B.O.B
      </span>

      {/* Expanding accent line */}
      <motion.div
        className="relative z-10 h-px rounded-full opacity-35 group-hover:opacity-65"
        style={{ background: "rgb(var(--accent-glow))", width: "1.5rem" }}
        whileHover={{ width: "2.5rem" }}
        transition={{ duration: 0.3 }}
        aria-hidden
      />
    </motion.button>
  );
}
