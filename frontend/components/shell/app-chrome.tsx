"use client";

import { motion } from "framer-motion";
import { Settings2, Atom, LayoutGrid } from "lucide-react";
import { BobCore } from "@/components/bob/bob-core";
import { BobBackground } from "@/components/bob/bob-background";
import { cn } from "@/lib/utils";

export type ViewType = "core" | "launcher";

interface AppChromeProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  onOpenCustomize: () => void;
  children: React.ReactNode;
  /** Full-screen mode (Core view) — nav floats, no top bar. */
  fullscreen?: boolean;
  /** Fullscreen only: fade the floating nav out on idle. */
  navIdle?: boolean;
  /** Fullscreen only: fully unmount the floating nav (Neural Focus Mode). */
  navHidden?: boolean;
}

export function AppChrome({
  activeView,
  onViewChange,
  onOpenCustomize,
  children,
  fullscreen = false,
  navIdle = false,
  navHidden = false,
}: AppChromeProps) {
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
            {/* Simple floating toggle: Core / Workspace */}
            <motion.div
              className="flex gap-1 p-1 rounded-full border border-white/[0.08] bg-bg-soft/70 backdrop-blur-2xl"
            >
              {(["core", "launcher"] as const).map((view) => (
                <motion.button
                  key={view}
                  type="button"
                  onClick={() => onViewChange(view)}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className={cn(
                    "relative flex items-center justify-center gap-1.5 w-9 h-9 rounded-full transition-colors duration-150",
                    activeView === view
                      ? "text-ink"
                      : "text-ink-mute hover:text-ink-dim"
                  )}
                >
                  {activeView === view && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 bg-white/[0.07] border border-white/[0.08] rounded-full"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                  {view === "core" ? (
                    <Atom className="h-4 w-4 relative z-10" strokeWidth={1.5} />
                  ) : (
                    <LayoutGrid className="h-4 w-4 relative z-10" strokeWidth={1.5} />
                  )}
                </motion.button>
              ))}
            </motion.div>
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

  return (
    <div className="h-screen w-screen flex flex-col bg-bg relative overflow-hidden">
      <BobBackground />

      {/* ── Top header ── */}
      <header
        className="relative z-[var(--z-chrome)] shrink-0 flex items-center justify-between gap-3 px-5 sm:px-7 border-b border-white/[0.035] bg-bg/70 backdrop-blur-2xl"
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

        {/* Simple nav toggle: Core / Workspace — hidden on mobile */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="hidden md:flex gap-1 p-1 rounded-full border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl"
        >
          {(["core", "launcher"] as const).map((view) => (
            <motion.button
              key={view}
              type="button"
              onClick={() => onViewChange(view)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              title={view === "core" ? "Core" : "Workspace"}
              className={cn(
                "relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors duration-150",
                activeView === view
                  ? "text-ink"
                  : "text-ink-mute hover:text-ink-dim"
              )}
            >
              {activeView === view && (
                <motion.div
                  layoutId="activeHeaderNav"
                  className="absolute inset-0 bg-white/[0.07] border border-white/[0.08] rounded-lg"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              {view === "core" ? (
                <>
                  <Atom className="h-3.5 w-3.5 relative z-10" strokeWidth={2} />
                  <span className="relative z-10 font-medium">Core</span>
                </>
              ) : (
                <>
                  <LayoutGrid className="h-3.5 w-3.5 relative z-10" strokeWidth={2} />
                  <span className="relative z-10 font-medium">Workspace</span>
                </>
              )}
            </motion.button>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-2 shrink-0"
        >
          <button
            type="button"
            className="btn-ghost py-1.5 px-3 text-xs gap-1.5 text-ink-mute hover:text-ink"
            onClick={onOpenCustomize}
            title="Customize"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Customize</span>
          </button>
        </motion.div>
      </header>

      {/* ── Mobile nav strip ── */}
      <div
        className="md:hidden relative z-[var(--z-chrome)] shrink-0 flex justify-center items-center border-b border-white/[0.035] bg-bg/40 backdrop-blur"
        style={{ height: "var(--bob-mobile-nav-h)" }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="flex gap-1 p-1 rounded-full border border-white/[0.08] bg-white/[0.03] backdrop-blur"
        >
          {(["core", "launcher"] as const).map((view) => (
            <motion.button
              key={view}
              type="button"
              onClick={() => onViewChange(view)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              title={view === "core" ? "Core" : "Workspace"}
              className={cn(
                "relative flex items-center justify-center w-10 h-10 rounded-lg transition-colors duration-150",
                activeView === view
                  ? "text-ink"
                  : "text-ink-mute hover:text-ink-dim"
              )}
            >
              {activeView === view && (
                <motion.div
                  layoutId="activeMobileNav"
                  className="absolute inset-0 bg-white/[0.07] border border-white/[0.08] rounded-lg"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              {view === "core" ? (
                <Atom className="h-4 w-4 relative z-10" strokeWidth={1.5} />
              ) : (
                <LayoutGrid className="h-4 w-4 relative z-10" strokeWidth={1.5} />
              )}
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* ── Body ── */}
      <div className={cn("relative z-[var(--z-content)] flex flex-1 min-h-0")}>
        {children}
      </div>
    </div>
  );
}
