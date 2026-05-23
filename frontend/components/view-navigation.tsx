"use client";

import { motion } from "framer-motion";
import { Atom, LayoutDashboard, MessageSquare, Code, Brain, Settings, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewType =
  | "core"
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
  { id: "command-center", label: "Command", icon: LayoutDashboard },
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "developer", label: "Developer", icon: Code },
  { id: "memory", label: "Memory", icon: Brain },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "customize", label: "Customize", icon: Palette },
];

export function ViewNavigation({ activeView, onViewChange, compact }: ViewNavigationProps) {
  const items = compact ? VIEWS.slice(0, 5) : VIEWS;
  return (
    <motion.nav
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex gap-1 p-1.5 rounded-2xl border border-white/[0.06] bg-bg-card/60 backdrop-blur-xl",
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
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            title={view.label}
            className={cn(
              "relative flex items-center gap-2 px-3 py-2 rounded-xl transition-colors",
              compact && "w-10 h-10 justify-center px-0 py-0 rounded-full",
              isActive
                ? "text-accent"
                : "text-ink-mute hover:text-ink"
            )}
          >
            {isActive && (
              <motion.div
                layoutId={compact ? "activeViewBgCompact" : "activeViewBg"}
                className={cn(
                  "absolute inset-0 bg-accent/15 border border-accent/30",
                  compact ? "rounded-full" : "rounded-xl"
                )}
                initial={false}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <Icon className="h-4 w-4 relative z-10" />
            {!compact && (
              <span className="text-sm font-medium relative z-10">{view.label}</span>
            )}
          </motion.button>
        );
      })}
    </motion.nav>
  );
}
