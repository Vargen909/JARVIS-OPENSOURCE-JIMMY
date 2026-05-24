"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SettingsDrawer } from "./settings-drawer";
import { MemoryDrawer } from "./memory-drawer";
import { CustomizeLayout } from "./customize-layout";
import { WebViewPanel } from "./WebViewPanel";
import { CoreView } from "./core/core-view";
import { CommandOverlay } from "./core/command-overlay";
import { CommandCenterView } from "./views/command-center-view";
import { ChatView } from "./views/chat-view";
import { MemoryView } from "./views/memory-view";
import { DeveloperView } from "./views/developer-view";
import { AppChrome } from "./shell/app-chrome";
import { nextViewInCycle, type ViewType } from "./view-navigation";
import { useWebView } from "@/hooks/useWebView";
import { useIdle } from "@/hooks/use-idle";
import { useLayout } from "@/lib/use-layout-store";
import { useCoreShortcuts, readVoiceMuted, writeVoiceMuted } from "./core/use-core-shortcuts";

export function AppShell() {
  const webView = useWebView();
  const layout = useLayout();
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [confidential, setConfidential] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [memoryDrawerOpen, setMemoryDrawerOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [commandOverlayOpen, setCommandOverlayOpen] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);
  /** Default: iconic Core home screen */
  const [activeView, setActiveView] = useState<ViewType>("core");

  useEffect(() => {
    setVoiceMuted(readVoiceMuted());
  }, []);

  // Global idle tracker — only used to fade the Core floating nav.
  const navIdle = useIdle({
    timeoutMs: 4000,
    disabled: activeView !== "core",
  });
  const focusMode = layout.state.coreFocusMode && activeView === "core";

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

  // Immersive keyboard shortcuts — wired globally; some are routed through
  // window CustomEvents so the active CoreView instance can react.
  useCoreShortcuts(
    {
      toggleCommandOverlay: () => setCommandOverlayOpen((o) => !o),
      cycleView: () => setActiveView((v) => nextViewInCycle(v)),
      toggleVoice: () => {
        if (activeView !== "core") setActiveView("core");
        window.dispatchEvent(new CustomEvent("bob:toggle-voice"));
      },
      toggleVoiceMute: () =>
        setVoiceMuted((v) => {
          const next = !v;
          writeVoiceMuted(next);
          return next;
        }),
      toggleFocusMode: () => {
        if (activeView !== "core") setActiveView("core");
        layout.dispatch({
          type: "SET_FOCUS_MODE",
          value: !layout.state.coreFocusMode,
        });
      },
      openCommandOverlay: () => setCommandOverlayOpen(true),
      escape: () => {
        // Priority: command overlay → focus mode → drawers
        if (commandOverlayOpen) return setCommandOverlayOpen(false);
        if (focusMode)
          return layout.dispatch({ type: "SET_FOCUS_MODE", value: false });
        if (settingsOpen) return setSettingsOpen(false);
        if (memoryDrawerOpen) return setMemoryDrawerOpen(false);
        if (customizeOpen) return setCustomizeOpen(false);
        if (webView.isOpen) return webView.close();
      },
      wakeBob: () => {
        if (activeView !== "core") setActiveView("core");
        window.dispatchEvent(new CustomEvent("bob:wake"));
      },
    },
    true
  );

  const overlays = (
    <>
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <MemoryDrawer open={memoryDrawerOpen} onClose={() => setMemoryDrawerOpen(false)} />
      <CustomizeLayout open={customizeOpen} onClose={() => setCustomizeOpen(false)} />
      <CommandOverlay
        open={commandOverlayOpen}
        onClose={() => setCommandOverlayOpen(false)}
        activeView={activeView}
        onSelectView={handleViewChange}
        onOpenSettings={() => {
          setCommandOverlayOpen(false);
          setSettingsOpen(true);
        }}
        onOpenCustomize={() => {
          setCommandOverlayOpen(false);
          setCustomizeOpen(true);
        }}
        onOpenMemory={() => {
          setCommandOverlayOpen(false);
          setActiveView("memory");
        }}
        onNewConversation={() => {
          setCommandOverlayOpen(false);
          setConversationId(null);
        }}
        onToggleConfidential={() => setConfidential((v) => !v)}
        onToggleFocusMode={() => {
          setCommandOverlayOpen(false);
          if (activeView !== "core") setActiveView("core");
          layout.dispatch({
            type: "SET_FOCUS_MODE",
            value: !layout.state.coreFocusMode,
          });
        }}
        onToggleVoiceMute={() =>
          setVoiceMuted((v) => {
            const next = !v;
            writeVoiceMuted(next);
            return next;
          })
        }
        confidential={confidential}
        voiceMuted={voiceMuted}
        focusMode={focusMode}
      />
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
          navIdle={navIdle || focusMode}
          navHidden={focusMode}
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
                focusMode={focusMode}
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
