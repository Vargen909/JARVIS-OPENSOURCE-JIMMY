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
      whileHover={isSoon ? { opacity: 0.65 } : { y: -3, scale: 1.025 }}
      whileTap={isSoon ? {} : { scale: 0.96, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      aria-label={item.label}
      aria-disabled={isSoon ? "true" : undefined}
      className={cn(
        "group relative flex flex-col items-center justify-center gap-3",
        "pt-5 pb-4 aspect-square w-full rounded-2xl",
        "bg-bg-card/30 backdrop-blur-xl",
        "border border-white/[0.05]",
        "transition-[background-color,border-color,box-shadow] duration-250",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/30",
        !isSoon && [
          "hover:bg-bg-card/55",
          "hover:border-white/[0.09]",
          a.borderHover,
          "hover:shadow-[0_4px_24px_-6px_rgba(0,0,0,0.5)]",
          "cursor-pointer",
        ],
        isSoon && "cursor-default opacity-45",
      )}
    >
      {/* Top ambient glow on hover */}
      {!isSoon && (
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 75% 55% at 50% 0%, rgb(var(--accent-glow) / 0.055) 0%, transparent 70%)",
          }}
          aria-hidden
        />
      )}

      {/* "Soon" label */}
      {isSoon && (
        <span
          className={cn(
            "absolute top-2 right-2.5",
            "text-[7px] font-semibold tracking-[0.18em] uppercase",
            "px-1.5 py-[2px] rounded-full border",
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
          "w-10 h-10 rounded-xl",
          a.iconBg,
          a.iconBgHover,
          "transition-colors duration-200",
        )}
      >
        <Icon
          className={cn("h-[18px] w-[18px] relative z-10 transition-colors duration-200", a.icon)}
          strokeWidth={1.6}
          aria-hidden
        />
      </div>

      {/* Label */}
      <span
        className={cn(
          "text-[9.5px] font-medium tracking-[0.14em] uppercase",
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
