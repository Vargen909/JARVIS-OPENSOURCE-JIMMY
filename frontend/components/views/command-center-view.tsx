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
 * 3-column dashboard with real chat via the command bar.
 *
 * Responsive:
 *   - <md (mobile):  center only
 *   - md..lg:        center + compact left rail
 *   - lg..xl:        center + full left rail
 *   - >=xl:          full 3-column with right rail
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

  const userWantsLeft = state.sidebar !== "hidden";
  const userWantsRight = !state.compactMode;
  const userWantsCompact = state.compactMode;

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
    <div className="flex flex-1 min-h-0 h-full w-full">
      {/* Left rail — hidden <md, compact md..lg, full >=lg */}
      {userWantsLeft && (
        <>
          <div className="hidden md:flex lg:hidden h-full">
            <OperatingModesRail
              isCompact
              onOpenSettings={onOpenSettings}
              onOpenMemory={onOpenMemory}
            />
          </div>
          <div className="hidden lg:flex h-full">
            <OperatingModesRail
              isCompact={userWantsCompact}
              onOpenSettings={onOpenSettings}
              onOpenMemory={onOpenMemory}
            />
          </div>
        </>
      )}

      {/* Center column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <DashboardCenter isThinking={pending} statusMessage={statusMessage} />
        <div className="shrink-0 px-4 sm:px-6 pb-6 sm:pb-8 pt-2">
          {error && (
            <p className="text-sm text-rose-400 text-center mb-2">{error}</p>
          )}
          <CommandBar onSend={send} isThinking={pending} />
        </div>
      </div>

      {/* Right rail — hidden <xl */}
      {userWantsRight && (
        <div className="hidden xl:flex h-full">
          <DashboardStatusRail isCompact={false} />
        </div>
      )}
    </div>
  );
}
