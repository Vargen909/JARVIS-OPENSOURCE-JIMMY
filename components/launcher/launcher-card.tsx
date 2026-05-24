"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ACCENT_MAP } from "./launcher-accents";
import type { LauncherItem } from "@/lib/launcher-items";

interface LauncherCardProps {
  item: LauncherItem;
  onClick: () => void;
}

export function LauncherCard({ item, onClick }: LauncherCardProps) {
  const a = ACCENT_MAP[item.accent];
  const Icon = item.icon;
  const isSoon = item.status === "soon";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={isSoon ? {} : { y: -2, scale: 1.02 }}
      whileTap={isSoon ? {} : { scale: 0.97 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      aria-label={item.label}
      aria-disabled={isSoon ? "true" : undefined}
      className={cn(
        "group relative flex flex-col items-center justify-center gap-3 pt-5 pb-4",
        "aspect-square w-full rounded-2xl",
        "bg-bg-card/35 backdrop-blur-xl",
        "border border-white/[0.055]",
        "transition-all duration-250",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:ring-offset-1 focus-visible:ring-offset-bg",
        !isSoon && [
          "hover:bg-bg-card/60",
          "hover:border-white/[0.1]",
          a.borderHover,
          "cursor-pointer",
        ],
        isSoon && "cursor-default opacity-50 hover:opacity-60",
      )}
    >
      {/* Subtle inner glow on hover */}
      {!isSoon && (
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, rgb(var(--accent-glow) / 0.06) 0%, transparent 70%)",
          }}
          aria-hidden
        />
      )}

      {/* "Soon" pill */}
      {isSoon && (
        <span
          className={cn(
            "absolute top-2.5 right-2.5",
            "text-[8px] font-medium tracking-[0.16em] uppercase",
            "px-1.5 py-0.5 rounded-full border",
            a.pillBorder,
            a.pillText,
          )}
        >
          Soon
        </span>
      )}

      {/* Icon */}
      <div
        className={cn(
          "relative flex items-center justify-center",
          "w-11 h-11 rounded-xl",
          a.iconBg,
          a.iconBgHover,
          "transition-colors duration-200",
        )}
      >
        <Icon
          className={cn("h-5 w-5 relative z-10 transition-colors duration-200", a.icon)}
          strokeWidth={1.5}
          aria-hidden
        />
      </div>

      {/* Label */}
      <span
        className={cn(
          "text-[10px] font-medium tracking-[0.14em] uppercase",
          "text-ink-mute group-hover:text-ink-dim",
          "transition-colors duration-200",
          "px-1 text-center leading-tight max-w-full truncate",
        )}
      >
        {item.label}
      </span>
    </motion.button>
  );
}
