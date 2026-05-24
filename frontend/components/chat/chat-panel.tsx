"use client";

import { useEffect, useRef, useState } from "react";
import { useJarvis } from "../providers";
import { api } from "@/lib/api";
import { mapChatError } from "@/lib/chat-errors";
import type { MessageOut } from "@/lib/types";
import { ChatHeader } from "./chat-header";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";

export function ChatPanel({
  conversationId,
  onConversationCreated,
  confidential,
  onToggleConfidential,
  onOpenCustomize,
  sidebarHidden,
  onOpenWebView,
}: {
  conversationId: number | null;
  onConversationCreated: (id: number) => void;
  confidential: boolean;
  onToggleConfidential: () => void;
  onOpenCustomize?: () => void;
  sidebarHidden?: boolean;
  onOpenWebView?: (url: string) => void;
}) {
  const { activeUser, refresh } = useJarvis();
  const [messages, setMessages] = useState<MessageOut[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    setError(null);
    if (!conversationId) {
      setMessages([]);
      return;
    }
    api
      .getConversation(conversationId)
      .then((c) => {
        if (alive) setMessages(c.messages);
      })
      .catch((e) => alive && setError(mapChatError(e).message));
    return () => {
      alive = false;
    };
  }, [conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, pending]);

  if (!activeUser) return null;

  const parseWebViewUrl = (message: string) => {
    const lower = message.toLowerCase();
    if (!lower.includes("öppna ") && !lower.includes("open ")) return null;

    const mapped = [
      ["instagram", "https://www.instagram.com"],
      ["youtube", "https://www.youtube.com"],
      ["gmail", "https://mail.google.com"],
      ["spotify", "https://open.spotify.com"],
    ] as const;

    for (const [name, url] of mapped) {
      if (lower.includes(name)) return url;
    }

    const match = message.match(/https?:\/\/[^\s]+/i);
    return match?.[0] ?? null;
  };

  const send = async (text: string): Promise<boolean> => {
    if (!text.trim() || pending) return false;
    setError(null);
    const webViewUrl = parseWebViewUrl(text);
    if (webViewUrl) onOpenWebView?.(webViewUrl);
    const optimistic: MessageOut = {
      id: Date.now(),
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);
    setPending(true);
    try {
      const res = await api.chat({
        user_id: activeUser.id,
        conversation_id: conversationId ?? undefined,
        message: text,
        confidential,
      });
      setMessages((m) => [...m, res.reply]);
      if (!conversationId) {
        onConversationCreated(res.conversation_id);
        refresh();
      }
      return true;
    } catch (e: unknown) {
      setError(mapChatError(e).message);
      setMessages((m) => m.filter((x) => x.id !== optimistic.id));
      return false;
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 w-full">
      <ChatHeader
        confidential={confidential}
        onToggleConfidential={onToggleConfidential}
        onOpenCustomize={onOpenCustomize}
        showCustomize={sidebarHidden}
      />
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
        <ChatMessages
          messages={messages}
          pending={pending}
          empty={messages.length === 0}
          onSuggestion={(text) => void send(text)}
        />
      </div>
      {error && (
        <div className="px-6 pb-2 text-sm text-rose-400">{error}</div>
      )}
      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-8 left-0 right-0 h-8 bg-gradient-to-b from-transparent to-bg"
        />
        <ChatInput onSend={send} disabled={pending} />
      </div>
    </div>
  );
}
