"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Atom,
  Brain,
  Code,
  EyeOff,
  LayoutDashboard,
  LayoutGrid,
  Lock,
  MessageSquare,
  Palette,
  Plus,
  Search,
  Settings as SettingsIcon,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useJarvis } from "@/components/providers";
import { api } from "@/lib/api";
import type { ConversationOut } from "@/lib/types";
import type { ViewType } from "@/components/shell/app-chrome";
import { cn } from "@/lib/utils";

interface CommandOverlayProps {
  open: boolean;
  onClose: () => void;
  activeView: ViewType;
  onSelectView: (v: ViewType) => void;
  onOpenSettings: () => void;
  onOpenCustomize: () => void;
  onOpenMemory: () => void;
  onNewConversation: () => void;
  onToggleConfidential: () => void;
  onToggleFocusMode: () => void;
  onToggleVoiceMute: () => void;
  confidential: boolean;
  voiceMuted: boolean;
  focusMode: boolean;
}

interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  group: "Views" | "Recent" | "Actions";
  run: () => void;
}

/**
 * Cinematic command palette — F1 / TAB.
 *
 * Searchable list of views, recent conversations, and quick actions.
 * Keyboard nav: ↑ / ↓ / Enter / Escape. Hand-rolled (no cmdk dep) so
 * it stays consistent with the B.O.B aesthetic and weighs nothing extra.
 */
export function CommandOverlay({
  open,
  onClose,
  activeView,
  onSelectView,
  onOpenSettings,
  onOpenCustomize,
  onOpenMemory,
  onNewConversation,
  onToggleConfidential,
  onToggleFocusMode,
  onToggleVoiceMute,
  confidential,
  voiceMuted,
  focusMode,
}: CommandOverlayProps) {
  const { activeUser } = useJarvis();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset query on open.
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setCursor(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  const items = useMemo<CommandItem[]>(() => {
    const viewItems: CommandItem[] = [
      {
        id: "view:launcher",
        label: "Workspace",
        hint: "OS launcher grid",
        icon: LayoutGrid,
        group: "Views",
        run: () => {
          onSelectView("launcher");
          onClose();
        },
      },
      {
        id: "view:core",
        label: "Core",
        hint: "Cinematic neural home",
        icon: Atom,
        group: "Views",
        run: () => {
          onSelectView("core");
          onClose();
        },
      },
    ];

    const actionItems: CommandItem[] = [
      {
        id: "action:new-conversation",
        label: "New conversation",
        icon: Plus,
        group: "Actions",
        run: onNewConversation,
      },
      {
        id: "action:focus-mode",
        label: focusMode ? "Exit Neural Focus Mode" : "Enter Neural Focus Mode",
        hint: "F5",
        icon: focusMode ? EyeOff : Sparkles,
        group: "Actions",
        run: onToggleFocusMode,
      },
      {
        id: "action:voice-mute",
        label: voiceMuted ? "Unmute B.O.B voice" : "Mute B.O.B voice",
        hint: "F4",
        icon: voiceMuted ? VolumeX : Volume2,
        group: "Actions",
        run: () => {
          onToggleVoiceMute();
          onClose();
        },
      },
      {
        id: "action:confidential",
        label: confidential ? "Confidential mode on" : "Toggle confidential",
        icon: Lock,
        group: "Actions",
        run: () => {
          onToggleConfidential();
          onClose();
        },
      },
      {
        id: "action:settings",
        label: "Open settings",
        icon: SettingsIcon,
        group: "Actions",
        run: onOpenSettings,
      },
      {
        id: "action:customize",
        label: "Customize layout",
        icon: Palette,
        group: "Actions",
        run: onOpenCustomize,
      },
      {
        id: "action:memory",
        label: "Open memory",
        icon: Brain,
        group: "Actions",
        run: onOpenMemory,
      },
    ];

    return [...viewItems, ...actionItems];
  }, [
    onSelectView,
    onClose,
    onNewConversation,
    onToggleFocusMode,
    onToggleVoiceMute,
    onToggleConfidential,
    onOpenSettings,
    onOpenCustomize,
    onOpenMemory,
    confidential,
    voiceMuted,
    focusMode,
  ]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        (i.hint?.toLowerCase().includes(q) ?? false)
    );
  }, [items, query]);

  // Clamp cursor when filtered changes.
  useEffect(() => {
    if (cursor >= filtered.length) setCursor(0);
  }, [filtered.length, cursor]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => (c + 1) % Math.max(1, filtered.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => (c - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[cursor];
      if (item) item.run();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  // Group rendering ordering.
  const groups = useMemo(() => {
    const order: Array<CommandItem["group"]> = ["Views", "Recent", "Actions"];
    return order
      .map((g) => ({
        group: g,
        items: filtered.filter((i) => i.group === g),
      }))
      .filter((g) => g.items.length > 0);
  }, [filtered]);

  // Compute global cursor index per filtered item to highlight correctly.
  const cursorMap = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((i, idx) => map.set(i.id, idx));
    return map;
  }, [filtered]);

  // Mark activeView in views group label
  const activeViewId = `view:${activeView}`;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="command-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[var(--z-modal)] flex items-start justify-center pt-[12vh] px-4 backdrop-blur-xl bg-black/60"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl rounded-2xl border border-white/[0.08] bg-bg-card/90 backdrop-blur-2xl shadow-2xl overflow-hidden"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
              <Search className="h-4 w-4 text-ink-mute shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKey}
                placeholder="Search views, conversations, actions…"
                className="flex-1 bg-transparent outline-none text-[15px] text-ink placeholder:text-ink-mute"
              />
              <kbd className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded bg-white/[0.05] text-ink-mute border border-white/[0.06]">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[58vh] overflow-y-auto">
              {groups.length === 0 && (
                <div className="px-5 py-8 text-center text-sm text-ink-mute">
                  No matches
                </div>
              )}
              {groups.map((g) => (
                <div key={g.group} className="py-2">
                  <div className="px-5 pt-2 pb-1 text-[10px] uppercase tracking-widest text-ink-mute">
                    {g.group}
                  </div>
                  {g.items.map((item) => {
                    const Icon = item.icon;
                    const idx = cursorMap.get(item.id) ?? -1;
                    const active = idx === cursor;
                    const isCurrentView = item.id === activeViewId;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onMouseEnter={() => setCursor(idx)}
                        onClick={item.run}
                        className={cn(
                          "w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors",
                          active
                            ? "bg-accent/15 text-ink"
                            : "text-ink-dim hover:bg-white/[0.03]"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4 shrink-0",
                            active ? "text-accent" : "text-ink-mute"
                          )}
                        />
                        <span className="flex-1 text-sm truncate">
                          {item.label}
                        </span>
                        {isCurrentView && (
                          <span className="text-[10px] text-accent font-mono">
                            current
                          </span>
                        )}
                        {item.hint && (
                          <span className="text-[11px] text-ink-mute font-mono">
                            {item.hint}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06] text-[11px] text-ink-mute">
              <span>
                <kbd className="font-mono">↑↓</kbd> navigate ·{" "}
                <kbd className="font-mono">↵</kbd> select
              </span>
              <span className="font-mono">F1 / TAB to toggle</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
