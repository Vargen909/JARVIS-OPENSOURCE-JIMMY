"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Atom, LayoutGrid } from "lucide-react";
import { BobCore } from "@/components/bob/bob-core";
import { BobBackground } from "@/components/bob/bob-background";
import { cn } from "@/lib/utils";

export type ViewType = "core" | "launcher";

interface AppChromeProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  onOpenCustomize?: () => void;
  children: React.ReactNode;
  /** Full-screen mode (Core view) — minimal chrome. */
  fullscreen?: boolean;
  /** Fullscreen only: fade UI out on idle. */
  navIdle?: boolean;
  /** Fullscreen only: fully hide UI (Neural Focus Mode). */
  navHidden?: boolean;
}

const VIEWS: { id: ViewType; label: string; Icon: typeof Atom }[] = [
  { id: "core", label: "Core", Icon: Atom },
  { id: "launcher", label: "Workspace", Icon: LayoutGrid },
];

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
    <nav
      aria-label="View navigation"
      className={cn(
        "relative flex items-center gap-0.5 p-1 rounded-2xl",
        "bg-white/[0.03] border border-white/[0.07]",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]",
        className
      )}
    >
      {VIEWS.map(({ id, label, Icon }) => {
        const isActive = activeView === id;
        return (
          <motion.button
            key={id}
            type="button"
            onClick={() => onViewChange(id)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            aria-label={label}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative flex items-center gap-2 px-4 h-9 rounded-xl",
              "text-[12px] font-medium tracking-wide",
              "transition-colors duration-200 outline-none",
              "focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-1 focus-visible:ring-offset-bg",
              isActive ? "text-ink" : "text-ink-mute hover:text-ink-dim"
            )}
          >
            {/* Animated active pill */}
            {isActive && (
              <motion.div
                layoutId="viewActivePill"
                className={cn(
                  "absolute inset-0 rounded-xl",
                  "bg-white/[0.07] border border-white/[0.1]",
                  "shadow-[0_1px_3px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]"
                )}
                transition={{ type: "spring", stiffness: 480, damping: 36 }}
              />
            )}

            {/* Active accent underline */}
            {isActive && (
              <motion.div
                layoutId="viewAccentLine"
                className="absolute bottom-[3px] left-1/2 -translate-x-1/2 h-[2px] w-4 rounded-full"
                style={{ background: "rgb(var(--accent-glow) / 0.7)" }}
                transition={{ type: "spring", stiffness: 480, damping: 36 }}
              />
            )}

            <Icon
              className="relative z-10 h-[14px] w-[14px] shrink-0"
              strokeWidth={isActive ? 2.1 : 1.6}
              aria-hidden
            />
            <span className="relative z-10 hidden sm:inline">{label}</span>
          </motion.button>
        );
      })}
    </nav>
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
  // ── Core: fullscreen cinematic with floating toggle ───────────────────────
  if (fullscreen) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-bg relative flex flex-col">
        <BobBackground />

        <AnimatePresence>
          {!navHidden && (
            <motion.div
              key="floating-nav"
              initial={{ opacity: 0, y: -16 }}
              animate={{
                opacity: navIdle ? 0 : 1,
                y: navIdle ? -10 : 0,
              }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "fixed left-1/2 -translate-x-1/2 z-[var(--z-floating-nav)]",
                navIdle && "pointer-events-none"
              )}
              style={{ top: "calc(env(safe-area-inset-top, 0px) + 1.25rem)" }}
            >
              <ViewToggle activeView={activeView} onViewChange={onViewChange} />
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className="relative z-[var(--z-content)] flex-1 min-h-0 flex flex-col"
          style={{ paddingTop: navHidden ? 0 : "var(--bob-floating-nav-h)" }}
        >
          {children}
        </div>
      </div>
    );
  }

  // ── Workspace: full header with branding + toggle ─────────────────────────
  return (
    <div className="h-screen w-screen flex flex-col bg-bg relative overflow-hidden">
      <BobBackground />

      {/* Header */}
      <header
        className={cn(
          "relative z-[var(--z-chrome)] shrink-0",
          "flex items-center justify-between gap-3 px-5 sm:px-8",
          "border-b border-white/[0.035]",
          "bg-bg/50 backdrop-blur-2xl",
          // Subtle top accent line
          "before:absolute before:top-0 before:inset-x-0 before:h-px",
          "before:bg-gradient-to-r before:from-transparent before:via-accent/20 before:to-transparent",
          "before:pointer-events-none"
        )}
        style={{ height: "var(--bob-nav-h)" }}
      >
        {/* Branding */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-2.5 shrink-0"
        >
          <BobCore variant="compact" size={24} className="shrink-0" />
          <span className="font-semibold text-[13px] tracking-wide text-ink leading-none">
            B.O.B
          </span>
          <span
            className="text-[8px] px-1.5 py-[3px] rounded-full font-mono tracking-[0.2em] uppercase"
            style={{
              background: "rgb(var(--accent) / 0.08)",
              color: "rgb(var(--accent) / 0.65)",
              border: "1px solid rgb(var(--accent) / 0.14)",
            }}
          >
            OS
          </span>
        </motion.div>

        {/* Toggle */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="absolute left-1/2 -translate-x-1/2"
        >
          <ViewToggle activeView={activeView} onViewChange={onViewChange} />
        </motion.div>

        {/* Right spacer — keeps toggle centered */}
        <div className="shrink-0 w-[80px]" aria-hidden />
      </header>

      {/* Body */}
      <div className="relative z-[var(--z-content)] flex flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
}
