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
    load();
  }, [activeUser?.id, currentConversationId]);

  const remove = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this conversation?")) return;
    await api.deleteConversation(id);
    if (id === currentConversationId) onNewChat();
    load();
  };

  return (
    <aside
      className={cn(
        "hidden md:flex shrink-0 flex-col border-r border-white/[0.04] bg-bg-soft/40 backdrop-blur-xl density-gap",
        compact ? "w-56 p-3" : "w-72 p-4"
      )}
    >
      <div className="flex items-center gap-2 px-2 py-1.5">
        <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-accent" />
        </div>
        {!compact && (
          <div className="leading-tight">
            <div className="font-semibold">Jarvis</div>
            <div className="text-[11px] text-ink-mute">your assistant</div>
          </div>
        )}
      </div>

      <ProfileSwitcher compact={compact} />

      <button onClick={onNewChat} className="btn-primary w-full justify-center">
        <Plus className="w-4 h-4" /> {!compact && "New chat"}
      </button>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-1 pr-1">
        {!compact && (
          <div className="text-[11px] uppercase tracking-wide text-ink-mute px-2 py-2">
            Conversations
          </div>
        )}
        {loading && (
          <div className="text-xs text-ink-mute px-2">Loading…</div>
        )}
        {!loading && conversations.length === 0 && (
          <div className="text-xs text-ink-mute px-2 py-2">No chats yet.</div>
        )}
        {conversations.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelectConversation(c.id)}
            className={cn(
              "group w-full text-left flex items-start gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors",
              c.id === currentConversationId
                ? "bg-white/[0.06] text-ink"
                : "text-ink-dim hover:bg-white/[0.04]"
            )}
          >
            <MessageSquare className="w-4 h-4 mt-0.5 shrink-0" />
            <span className="flex-1 truncate">{c.title || "New chat"}</span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => remove(c.id, e)}
              onKeyDown={(e) => {
                if (e.key === "Enter")
                  remove(c.id, e as unknown as React.MouseEvent);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-ink-mute hover:text-rose-400"
              aria-label="Delete conversation"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-1 border-t border-white/[0.04] pt-3">
        <button
          className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-dim hover:bg-white/[0.04]"
          onClick={onOpenCustomize}
        >
          <LayoutGrid className="w-4 h-4" /> {!compact && "Anpassa layout"}
        </button>
        <button
          className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-dim hover:bg-white/[0.04]"
          onClick={onOpenMemory}
        >
          <Brain className="w-4 h-4" /> {!compact && "Memory"}
        </button>
        <button
          className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-dim hover:bg-white/[0.04]"
          onClick={onOpenSettings}
        >
          <Settings className="w-4 h-4" /> {!compact && "Settings"}
        </button>
      </div>
    </aside>
  );
}
