"use client";

import { useState } from "react";
import { useJarvis } from "@/components/providers";
import { api } from "@/lib/api";
import { useLayout } from "@/lib/use-layout-store";
import { OperatingModesRail } from "./dashboard/operating-modes-rail";
import { DashboardCenter } from "./dashboard/dashboard-center";
import { DashboardStatusRail } from "./dashboard/dashboard-status-rail";
import { CommandBar } from "./dashboard/command-bar";

interface CommandCenterViewProps {
  conversationId: number | null;
  onConversationCreated: (id: number) => void;
  confidential: boolean;
  onOpenSettings: () => void;
  onOpenMemory: () => void;
}

/**
 * v0 Command Center: 3-column dashboard with real chat via command bar.
 */
export function CommandCenterView({
  conversationId,
  onConversationCreated,
  confidential,
  onOpenSettings,
  onOpenMemory,
}: CommandCenterViewProps) {
  const { activeUser, refresh } = useJarvis();
  const { state } = useLayout();
  const [pending, setPending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  if (!activeUser) return null;

  const showLeft = state.sidebar !== "hidden";
  const showRight = !state.compactMode;
  const compact = state.compactMode;

  const send = async (text: string) => {
    if (!text.trim() || pending) return;
    setError(null);
    setPending(true);
    setStatusMessage("Analyserar…");
    try {
      const res = await api.chat({
        user_id: activeUser.id,
        conversation_id: conversationId ?? undefined,
        message: text,
        confidential,
      });
      setStatusMessage("Svar mottaget");
      if (!conversationId) {
        onConversationCreated(res.conversation_id);
        refresh();
      }
      setTimeout(() => setStatusMessage(undefined), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      setStatusMessage(undefined);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-1 min-h-0 h-full">
      {showLeft && (
        <OperatingModesRail
          isCompact={compact}
          onOpenSettings={onOpenSettings}
          onOpenMemory={onOpenMemory}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <DashboardCenter isThinking={pending} statusMessage={statusMessage} />
        <div className="shrink-0 px-6 pb-8 pt-2">
          {error && (
            <p className="text-sm text-rose-400 text-center mb-2">{error}</p>
          )}
          <CommandBar onSend={send} isThinking={pending} />
        </div>
      </div>

      {showRight && <DashboardStatusRail isCompact={compact} />}
    </div>
  );
}
