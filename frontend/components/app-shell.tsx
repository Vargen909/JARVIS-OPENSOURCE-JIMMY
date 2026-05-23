"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "./sidebar";
import { ChatPanel } from "./chat/chat-panel";
import { SettingsDrawer } from "./settings-drawer";
import { MemoryDrawer } from "./memory-drawer";
import { CustomizeLayout } from "./customize-layout";
import { WebViewPanel } from "./WebViewPanel";
import { SystemStatus } from "./panels/system-status";
import { ActivityFeed } from "./panels/activity-feed";
import { TasksStrip } from "./panels/tasks-strip";
import { CoreView } from "./core-view";
import { ViewNavigation, type ViewType } from "./view-navigation";
import { useLayout } from "@/lib/use-layout-store";
import { cn } from "@/lib/utils";
import { useWebView } from "@/hooks/useWebView";

export function AppShell() {
  const { state } = useLayout();
  const webView = useWebView();
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [confidential, setConfidential] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [activeView, setActiveView] = useState<ViewType>("command-center");

  const showSidebar = state.sidebar !== "hidden";
  const sidebarCompact = state.sidebar === "compact";

  const hasRightRail =
    state.panels.systemStatus ||
    state.panels.activityFeed ||
    state.panels.tasksStrip;

  const handleViewChange = (v: ViewType) => {
    if (v === "settings") {
      setSettingsOpen(true);
      return;
    }
    if (v === "memory") {
      setMemoryOpen(true);
      return;
    }
    if (v === "customize") {
      setCustomizeOpen(true);
      return;
    }
    setActiveView(v);
  };

  // Cinematic Core View — full-screen, real backend, no sidebars
  if (activeView === "core") {
    return (
      <div className="h-screen w-screen overflow-hidden bg-bg relative">
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-40">
          <ViewNavigation activeView={activeView} onViewChange={handleViewChange} />
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key="core"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.3 }}
            className="h-full pt-20"
          >
            <CoreView
              conversationId={conversationId}
              onConversationCreated={(id) => setConversationId(id)}
              confidential={confidential}
            />
          </motion.div>
        </AnimatePresence>
        <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
        <MemoryDrawer open={memoryOpen} onClose={() => setMemoryOpen(false)} />
        <CustomizeLayout open={customizeOpen} onClose={() => setCustomizeOpen(false)} />
        {webView.isOpen && (
          <WebViewPanel url={webView.url} onClose={webView.close} />
        )}
      </div>
    );
  }

  // Default Command Center layout (existing behaviour preserved)
  return (
    <div className="min-h-screen flex">
      {showSidebar && (
        <Sidebar
          compact={sidebarCompact}
          currentConversationId={conversationId}
          onSelectConversation={setConversationId}
          onNewChat={() => setConversationId(null)}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenMemory={() => setMemoryOpen(true)}
          onOpenCustomize={() => setCustomizeOpen(true)}
        />
      )}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Compact pill nav at top of main column for quick view switch */}
        <div className="flex justify-center pt-3 pb-1">
          <ViewNavigation
            activeView={activeView}
            onViewChange={handleViewChange}
            compact
          />
        </div>
        <ChatPanel
          conversationId={conversationId}
          onConversationCreated={(id) => setConversationId(id)}
          confidential={confidential}
          onToggleConfidential={() => setConfidential((v) => !v)}
          onOpenCustomize={() => setCustomizeOpen(true)}
          sidebarHidden={!showSidebar}
          onOpenWebView={webView.openUrl}
        />
      </main>
      <AnimatePresence>
        {hasRightRail && (
          <motion.aside
            key="right-rail"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.25 }}
            className={cn(
              "hidden xl:flex w-80 shrink-0 flex-col gap-3 p-4 border-l border-white/[0.04] bg-bg-soft/30 backdrop-blur-xl overflow-y-auto",
              state.density === "compact" && "gap-2 p-3"
            )}
          >
            {state.panels.systemStatus && <SystemStatus />}
            {state.panels.activityFeed && <ActivityFeed />}
            {state.panels.tasksStrip && <TasksStrip />}
          </motion.aside>
        )}
      </AnimatePresence>
      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
      <MemoryDrawer open={memoryOpen} onClose={() => setMemoryOpen(false)} />
      <CustomizeLayout
        open={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
      />
      {webView.isOpen && (
        <WebViewPanel url={webView.url} onClose={webView.close} />
      )}
    </div>
  );
}
