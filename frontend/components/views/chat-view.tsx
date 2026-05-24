"use client";

import { Sidebar } from "@/components/sidebar";
import { ChatPanel } from "@/components/chat/chat-panel";
import { useLayout } from "@/lib/use-layout-store";
import { cn } from "@/lib/utils";

interface ChatViewProps {
  conversationId: number | null;
  onConversationCreated: (id: number) => void;
  onSelectConversation: (id: number) => void;
  onNewChat: () => void;
  confidential: boolean;
  onToggleConfidential: () => void;
  onOpenSettings: () => void;
  onOpenMemory: () => void;
  onOpenCustomize: () => void;
  onOpenWebView?: (url: string) => void;
}

/**
 * Dedicated chat workspace: conversation sidebar + full chat panel.
 */
export function ChatView({
  conversationId,
  onConversationCreated,
  onSelectConversation,
  onNewChat,
  confidential,
  onToggleConfidential,
  onOpenSettings,
  onOpenMemory,
  onOpenCustomize,
  onOpenWebView,
}: ChatViewProps) {
  const { state } = useLayout();
  const showSidebar = state.sidebar !== "hidden";

  return (
    <div className="flex flex-1 min-h-0 h-full">
      {showSidebar && (
        <Sidebar
          compact={state.sidebar === "compact"}
          currentConversationId={conversationId}
          onSelectConversation={onSelectConversation}
          onNewChat={onNewChat}
          onOpenSettings={onOpenSettings}
          onOpenMemory={onOpenMemory}
          onOpenCustomize={onOpenCustomize}
        />
      )}
      <div className={cn("flex-1 min-w-0 flex flex-col", !showSidebar && "w-full")}>
        <ChatPanel
          conversationId={conversationId}
          onConversationCreated={onConversationCreated}
          confidential={confidential}
          onToggleConfidential={onToggleConfidential}
          onOpenCustomize={onOpenCustomize}
          sidebarHidden={!showSidebar}
          onOpenWebView={onOpenWebView}
        />
      </div>
    </div>
  );
}
