"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  MessageSquare,
  Settings,
  Brain,
  Sparkles,
  Trash2,
  LayoutGrid,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useJarvis } from "./providers";
import { api } from "@/lib/api";
import type { ConversationOut } from "@/lib/types";
import { ProfileSwitcher } from "./profile-switcher";
import { cn } from "@/lib/utils";

export function Sidebar({
  compact = false,
  currentConversationId,
  onSelectConversation,
  onNewChat,
  onOpenSettings,
  onOpenMemory,
  onOpenCustomize,
}: {
  compact?: boolean;
  currentConversationId: number | null;
  onSelectConversation: (id: number) => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
  onOpenMemory: () => void;
  onOpenCustomize: () => void;
}) {
  const { activeUser } = useJarvis();
  const [conversations, setConversations] = useState<ConversationOut[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!activeUser) return;
    setLoading(true);
    try {
      const list = await api.listConversations(activeUser.id);
      setConversations(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [activeUser?.id, currentConversationId]);

  const remove = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this conversation?")) return;
    await api.deleteConversation(id);
    if (id === currentConversationId) onNewChat();
    void load();
  };

  return (
    <aside
      className={cn(
        "hidden md:flex shrink-0 flex-col border-r border-white/[0.04] bg-bg-soft/40 backdrop-blur-xl density-gap",
        compact ? "w-56 p-3" : "w-72 p-4"
      )}
    >
      {/* ── Brand ── */}
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-2.5 px-2 py-1.5"
      >
        <div className="w-8 h-8 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-accent" />
        </div>
        {!compact && (
          <div className="leading-tight">
            <div className="font-semibold text-[15px]">B.O.B</div>
            <div className="text-[11px] text-ink-mute">Neural Operating System</div>
          </div>
        )}
      </motion.div>

      <ProfileSwitcher compact={compact} />

      {/* ── New chat ── */}
      <button onClick={onNewChat} className="btn-primary w-full justify-center">
        <Plus className="w-4 h-4" />
        {!compact && "New chat"}
      </button>

      {/* ── Conversations ── */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-0.5 pr-0.5">
        {!compact && (
          <div className="section-label px-2 py-2">Conversations</div>
        )}
        {loading && (
          <div className="flex items-center gap-1.5 px-2 py-2 text-xs text-ink-mute">
            <span className="dot-pulse text-accent" />
            Loading…
          </div>
        )}
        {!loading && conversations.length === 0 && (
          <div className="text-xs text-ink-mute px-2 py-3">No chats yet.</div>
        )}
        <AnimatePresence initial={false}>
          {conversations.map((c) => (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              onClick={() => onSelectConversation(c.id)}
              className={cn(
                "group w-full text-left flex items-start gap-2 rounded-xl px-2.5 py-2 text-sm transition-all",
                c.id === currentConversationId
                  ? "bg-accent/10 border border-accent/20 text-ink"
                  : "text-ink-dim hover:bg-white/[0.04] hover:text-ink"
              )}
            >
              <MessageSquare className="w-4 h-4 mt-0.5 shrink-0 opacity-60" />
              <span className="flex-1 truncate">{c.title || "New chat"}</span>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => remove(c.id, e)}
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    remove(c.id, e as unknown as React.MouseEvent);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-ink-mute hover:text-rose-400 rounded-md p-0.5"
                aria-label="Delete conversation"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Footer actions ── */}
      <div className="space-y-0.5 border-t border-white/[0.04] pt-3">
        {!compact && (
          <div className="section-label px-2 py-1.5">Settings</div>
        )}
        {[
          { icon: LayoutGrid, label: "Anpassa layout", action: onOpenCustomize },
          { icon: Brain, label: "Memory", action: onOpenMemory },
          { icon: Settings, label: "Settings", action: onOpenSettings },
        ].map(({ icon: Icon, label, action }) => (
          <button
            key={label}
            className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink-dim hover:bg-white/[0.04] hover:text-ink transition-colors"
            onClick={action}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {!compact && label}
          </button>
        ))}
      </div>
    </aside>
  );
}
