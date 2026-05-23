"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Settings2 } from "lucide-react";
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
import { MemoryView } from "./views/memory-view";
import { DeveloperView } from "./views/developer-view";
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

  /** Views that show the sidebar conversation list */
  const chatViews: ViewType[] = ["command-center", "chat"];
  const showSidebar =
    chatViews.includes(activeView) && state.sidebar !== "hidden";
  const sidebarCompact = state.sidebar === "compact";

  const hasRightRail =
    activeView === "command-center" &&
    (state.panels.systemStatus ||
      state.panels.activityFeed ||
      state.panels.tasksStrip);

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

  // ── Full-screen Core View ──────────────────────────────────────────────────
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

  // ── Standard shell layout (topbar + sidebar + main + right rail) ───────────
  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Premium top navigation bar ────────────────────────────────────── */}
      <header className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-2.5 border-b border-white/[0.04] bg-bg/60 backdrop-blur-xl z-20 relative">
        {/* Brand */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2.5"
        >
          <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
          </div>
          <span className="font-semibold text-[15px]">Jarvis</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 font-mono">
            v2
          </span>
        </motion.div>

        {/* Center navigation */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <ViewNavigation
            activeView={activeView}
            onViewChange={handleViewChange}
            compact
          />
        </div>

        {/* Right actions */}
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <button
            className="btn-ghost py-1.5 px-3 text-xs"
            onClick={() => setCustomizeOpen(true)}
            title="Customize layout"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Customize</span>
          </button>
        </motion.div>
      </header>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar (only for chat/command-center views) */}
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

        {/* Main content — animated view transition */}
        <main className="flex-1 min-w-0 flex flex-col min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className={cn(
                "flex-1 flex flex-col min-h-0",
                activeView !== "command-center" && activeView !== "chat" && "overflow-hidden"
              )}
            >
              {(activeView === "command-center" || activeView === "chat") && (
                <ChatPanel
                  conversationId={conversationId}
                  onConversationCreated={(id) => setConversationId(id)}
                  confidential={confidential}
                  onToggleConfidential={() => setConfidential((v) => !v)}
                  onOpenCustomize={() => setCustomizeOpen(true)}
                  sidebarHidden={!showSidebar}
                  onOpenWebView={webView.openUrl}
                />
              )}
              {activeView === "memory" && <MemoryView />}
              {activeView === "developer" && <DeveloperView />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Right rail (command-center only) */}
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
      </div>

      {/* ── Drawers & overlays ────────────────────────────────────────────── */}
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <MemoryDrawer open={memoryOpen} onClose={() => setMemoryOpen(false)} />
      <CustomizeLayout open={customizeOpen} onClose={() => setCustomizeOpen(false)} />
      {webView.isOpen && (
        <WebViewPanel url={webView.url} onClose={webView.close} />
      )}
    </div>
  );
}
