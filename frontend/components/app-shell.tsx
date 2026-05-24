"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SettingsDrawer } from "./settings-drawer";
import { MemoryDrawer } from "./memory-drawer";
import { CustomizeLayout } from "./customize-layout";
import { WebViewPanel } from "./WebViewPanel";
import { CoreView } from "./core-view";
import { CommandCenterView } from "./views/command-center-view";
import { ChatView } from "./views/chat-view";
import { MemoryView } from "./views/memory-view";
import { DeveloperView } from "./views/developer-view";
import { AppChrome } from "./shell/app-chrome";
import type { ViewType } from "./view-navigation";
import { useWebView } from "@/hooks/useWebView";

export function AppShell() {
  const webView = useWebView();
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [confidential, setConfidential] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [memoryDrawerOpen, setMemoryDrawerOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  /** Default: iconic Core home screen */
  const [activeView, setActiveView] = useState<ViewType>("core");

  const handleViewChange = (v: ViewType) => {
    if (v === "settings") {
      setSettingsOpen(true);
      return;
    }
    if (v === "customize") {
      setCustomizeOpen(true);
      return;
    }
    setActiveView(v);
  };

  const overlays = (
    <>
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <MemoryDrawer open={memoryDrawerOpen} onClose={() => setMemoryDrawerOpen(false)} />
      <CustomizeLayout open={customizeOpen} onClose={() => setCustomizeOpen(false)} />
      {webView.isOpen && (
        <WebViewPanel url={webView.url} onClose={webView.close} />
      )}
    </>
  );

  // ── Core View (fullscreen cinematic) ─────────────────────────────────────
  if (activeView === "core") {
    return (
      <>
        <AppChrome
          activeView={activeView}
          onViewChange={handleViewChange}
          onOpenCustomize={() => setCustomizeOpen(true)}
          fullscreen
        >
          <AnimatePresence mode="wait">
            <motion.div
              key="core"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.35 }}
              className="h-full"
            >
              <CoreView
                conversationId={conversationId}
                onConversationCreated={(id) => setConversationId(id)}
                confidential={confidential}
              />
            </motion.div>
          </AnimatePresence>
        </AppChrome>
        {overlays}
      </>
    );
  }

  // ── All other views: chrome + routed content ─────────────────────────────
  return (
    <>
      <AppChrome
        activeView={activeView}
        onViewChange={handleViewChange}
        onOpenCustomize={() => setCustomizeOpen(true)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-1 min-h-0 w-full"
          >
            {activeView === "command-center" && (
              <CommandCenterView
                conversationId={conversationId}
                onConversationCreated={(id) => setConversationId(id)}
                confidential={confidential}
                onOpenSettings={() => setSettingsOpen(true)}
                onOpenMemory={() => setActiveView("memory")}
              />
            )}

            {activeView === "chat" && (
              <ChatView
                conversationId={conversationId}
                onConversationCreated={(id) => setConversationId(id)}
                onSelectConversation={setConversationId}
                onNewChat={() => setConversationId(null)}
                confidential={confidential}
                onToggleConfidential={() => setConfidential((v) => !v)}
                onOpenSettings={() => setSettingsOpen(true)}
                onOpenMemory={() => setActiveView("memory")}
                onOpenCustomize={() => setCustomizeOpen(true)}
                onOpenWebView={webView.openUrl}
              />
            )}

            {activeView === "memory" && <MemoryView />}
            {activeView === "developer" && <DeveloperView />}
          </motion.div>
        </AnimatePresence>
      </AppChrome>
      {overlays}
    </>
  );
}
