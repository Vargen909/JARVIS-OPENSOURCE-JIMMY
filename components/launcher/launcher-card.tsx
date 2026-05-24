"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ACCENT_MAP } from "./launcher-accents";
import type { LauncherItem } from "@/lib/launcher-items";

interface LauncherCardProps {
  item: LauncherItem;
  onClick: () => void;
}

/**
 * Standard launcher tile.
 *
 * Dark glass panel · per-card accent icon · accent line · hover lift + glow.
 * Keyboard-accessible; disabled state for "soon" items preserves visual
 * weight but prevents navigation.
 */
export function LauncherCard({ item, onClick }: LauncherCardProps) {
  const a = ACCENT_MAP[item.accent];
  const Icon = item.icon;
  const isSoon = item.status === "soon";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={isSoon ? {} : { y: -3, scale: 1.025 }}
      whileTap={isSoon ? {} : { scale: 0.97 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      aria-label={item.label}
      aria-disabled={isSoon ? "true" : undefined}
      className={cn(
        // Base panel
        "group relative flex flex-col items-center justify-center gap-3",
        "aspect-square w-full rounded-2xl",
        "bg-bg-card/40 backdrop-blur-xl",
        "border border-white/[0.07]",
        "shadow-card",
        "transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        // Hover state (real items only)
        !isSoon && [
          "hover:bg-bg-card/60",
          a.borderHover,
          "cursor-pointer",
        ],
        // Soon items: slightly dimmed, no pointer
        isSoon && "cursor-default opacity-60 hover:opacity-70",
      )}
    >
      {/* "Soon" pill — top right */}
      {isSoon && (
        <span
          className={cn(
            "absolute top-2.5 right-2.5",
            "text-[9px] font-medium tracking-[0.14em] uppercase",
            "px-1.5 py-0.5 rounded-full border",
            a.pillBorder,
            a.pillText,
          )}
        >
          Soon
        </span>
      )}

      {/* Icon container */}
      <div
        className={cn(
          "relative flex items-center justify-center",
          "w-12 h-12 rounded-xl",
          a.iconBg,
          a.iconBgHover,
          "transition-colors duration-200",
        )}
      >
        {/* Subtle radial glow behind icon */}
        <div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 50%, currentColor 0%, transparent 70%)`,
            filter: "blur(8px)",
          }}
          aria-hidden
        />
        <Icon
          className={cn("h-6 w-6 relative z-10 transition-colors duration-200", a.icon)}
          strokeWidth={1.5}
          aria-hidden
        />
      </div>

      {/* Label */}
      <span
        className={cn(
          "text-[11px] font-medium tracking-[0.16em] uppercase",
          "text-ink-dim group-hover:text-ink",
          "transition-colors duration-200",
          "px-1 text-center leading-tight max-w-full truncate",
        )}
      >
        {item.label}
      </span>

      {/* Accent line */}
      <div
        className={cn("w-6 h-px opacity-50 group-hover:opacity-80 transition-opacity duration-200", a.line)}
        aria-hidden
      />
    </motion.button>
  );
}
