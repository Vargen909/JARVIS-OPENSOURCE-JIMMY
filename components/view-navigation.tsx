"use client";

import { motion } from "framer-motion";
import { Atom, LayoutDashboard, LayoutGrid, MessageSquare, Code, Brain, Settings, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewType =
  | "core"
  | "launcher"
  | "command-center"
  | "chat"
  | "developer"
  | "memory"
  | "settings"
  | "customize";

interface ViewNavigationProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  compact?: boolean;
}

const VIEWS: { id: ViewType; label: string; icon: typeof Atom }[] = [
  { id: "core", label: "Core", icon: Atom },
  { id: "launcher", label: "Workspace", icon: LayoutGrid },
  { id: "command-center", label: "Command", icon: LayoutDashboard },
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "developer", label: "Developer", icon: Code },
  { id: "memory", label: "Memory", icon: Brain },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "customize", label: "Customize", icon: Palette },
];

/**
 * Ordered list of "page" views (excludes drawers like Settings/Customize)
 * used by keyboard shortcuts to cycle through with F2.
 */
export const VIEW_CYCLE_ORDER: ViewType[] = [
  "launcher",
  "core",
  "command-center",
  "chat",
  "developer",
  "memory",
];

export function nextViewInCycle(current: ViewType): ViewType {
  const idx = VIEW_CYCLE_ORDER.indexOf(current);
  if (idx === -1) return VIEW_CYCLE_ORDER[0];
  return VIEW_CYCLE_ORDER[(idx + 1) % VIEW_CYCLE_ORDER.length];
}

export function ViewNavigation({ activeView, onViewChange, compact }: ViewNavigationProps) {
  const items = compact ? VIEWS.slice(0, 6) : VIEWS;
  return (
    <motion.nav
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "flex gap-0.5 p-1 rounded-2xl border border-white/[0.05] bg-bg-soft/70 backdrop-blur-2xl",
        compact && "p-1 rounded-full"
      )}
    >
      {items.map((view) => {
        const Icon = view.icon;
        const isActive = activeView === view.id;
        return (
          <motion.button
            key={view.id}
            type="button"
            onClick={() => onViewChange(view.id)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            title={view.label}
            className={cn(
              "relative flex items-center gap-1.5 px-3 py-2 rounded-xl transition-colors duration-150",
              compact && "w-9 h-9 justify-center px-0 py-0 rounded-full",
              isActive
                ? "text-ink"
                : "text-ink-mute hover:text-ink-dim"
            )}
          >
            {isActive && (
              <motion.div
                layoutId={compact ? "activeViewBgCompact" : "activeViewBg"}
                className={cn(
                  "absolute inset-0 bg-white/[0.07] border border-white/[0.08]",
                  compact ? "rounded-full" : "rounded-xl"
                )}
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <Icon className="h-3.5 w-3.5 relative z-10" strokeWidth={isActive ? 2 : 1.5} />
            {!compact && (
              <span className="text-[13px] font-medium relative z-10">{view.label}</span>
            )}
          </motion.button>
        );
      })}
    </motion.nav>
  );
}
