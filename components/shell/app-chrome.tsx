"use client";

import { motion } from "framer-motion";
import { Atom, LayoutGrid } from "lucide-react";
import { BobCore } from "@/components/bob/bob-core";
import { BobBackground } from "@/components/bob/bob-background";
import { cn } from "@/lib/utils";

export type ViewType = "core" | "launcher";

interface AppChromeProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  children: React.ReactNode;
  /** Full-screen mode (Core view) — minimal chrome. */
  fullscreen?: boolean;
  /** Fullscreen only: fade UI out on idle. */
  navIdle?: boolean;
  /** Fullscreen only: fully hide UI (Neural Focus Mode). */
  navHidden?: boolean;
}

/**
 * Simple two-button toggle between Core and Workspace views.
 */
function ViewToggle({
  activeView,
  onViewChange,
  className,
}: {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-1 p-1 rounded-full bg-white/[0.04] border border-white/[0.06]", className)}>
      <motion.button
        type="button"
        onClick={() => onViewChange("core")}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "relative flex items-center justify-center w-10 h-10 rounded-full transition-colors",
          activeView === "core" ? "text-ink" : "text-ink-mute hover:text-ink-dim"
        )}
        title="Core"
      >
        {activeView === "core" && (
          <motion.div
            layoutId="viewToggleBg"
            className="absolute inset-0 bg-white/[0.08] border border-white/[0.1] rounded-full"
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
          />
        )}
        <Atom className="w-4 h-4 relative z-10" strokeWidth={activeView === "core" ? 2 : 1.5} />
      </motion.button>
      <motion.button
        type="button"
        onClick={() => onViewChange("launcher")}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "relative flex items-center justify-center w-10 h-10 rounded-full transition-colors",
          activeView === "launcher" ? "text-ink" : "text-ink-mute hover:text-ink-dim"
        )}
        title="Workspace"
      >
        {activeView === "launcher" && (
          <motion.div
            layoutId="viewToggleBg"
            className="absolute inset-0 bg-white/[0.08] border border-white/[0.1] rounded-full"
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
          />
        )}
        <LayoutGrid className="w-4 h-4 relative z-10" strokeWidth={activeView === "launcher" ? 2 : 1.5} />
      </motion.button>
    </div>
  );
}

export function AppChrome({
  activeView,
  onViewChange,
  children,
  fullscreen = false,
  navIdle = false,
  navHidden = false,
}: AppChromeProps) {
  // Core view: fullscreen cinematic with floating toggle
  if (fullscreen) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-bg relative flex flex-col">
        <BobBackground />
        {!navHidden && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{
              opacity: navIdle ? 0 : 1,
              y: navIdle ? -10 : 0,
            }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className={cn(
              "fixed left-1/2 -translate-x-1/2 z-[var(--z-floating-nav)]",
              navIdle && "pointer-events-none"
            )}
            style={{ top: "calc(env(safe-area-inset-top, 0px) + 1.25rem)" }}
          >
            <ViewToggle activeView={activeView} onViewChange={onViewChange} />
          </motion.div>
        )}
        <div
          className="relative z-[var(--z-content)] flex-1 min-h-0 flex flex-col"
          style={{ paddingTop: navHidden ? 0 : "var(--bob-floating-nav-h)" }}
        >
          {children}
        </div>
      </div>
    );
  }

  // Workspace view: header with branding + toggle
  return (
    <div className="h-screen w-screen flex flex-col bg-bg relative overflow-hidden">
      <BobBackground />

      {/* ── Minimal header ── */}
      <header
        className="relative z-[var(--z-chrome)] shrink-0 flex items-center justify-between gap-3 px-5 sm:px-7 border-b border-white/[0.03] bg-bg/60 backdrop-blur-2xl"
        style={{ height: "var(--bob-nav-h)" }}
      >
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-2.5 shrink-0"
        >
          <BobCore variant="compact" size={26} className="shrink-0" />
          <span className="font-semibold text-[14px] tracking-wide text-ink">B.O.B</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent/8 text-accent/70 border border-accent/15 font-mono tracking-widest">
            OS
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <ViewToggle activeView={activeView} onViewChange={onViewChange} />
        </motion.div>
      </header>

      {/* ── Body ── */}
      <div className="relative z-[var(--z-content)] flex flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
}
