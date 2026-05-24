"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SettingsDrawer } from "./settings-drawer";
import { MemoryDrawer } from "./memory-drawer";
import { CustomizeLayout } from "./customize-layout";
import { WebViewPanel } from "./WebViewPanel";
import { CoreView } from "./core/core-view";
import { CommandOverlay } from "./core/command-overlay";
import { LauncherView } from "./views/launcher-view";
import { AppChrome, type ViewType } from "./shell/app-chrome";
import { useWebView } from "@/hooks/useWebView";
import { useIdle } from "@/hooks/use-idle";
import { useLayout } from "@/lib/use-layout-store";
import { useCoreShortcuts, readVoiceMuted, writeVoiceMuted } from "./core/use-core-shortcuts";
import { useJarvis } from "@/components/providers";
import { api } from "@/lib/api";

export function AppShell() {
  const webView = useWebView();
  const layout = useLayout();
  const { activeUser } = useJarvis();
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [confidential, setConfidential] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [memoryDrawerOpen, setMemoryDrawerOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [commandOverlayOpen, setCommandOverlayOpen] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [pendingVoiceToggle, setPendingVoiceToggle] = useState(0);
  const [pendingWake, setPendingWake] = useState(0);
  /** Default: Workspace launcher */
  const [activeView, setActiveView] = useState<ViewType>("launcher");

  useEffect(() => {
    setVoiceMuted(readVoiceMuted());
  }, []);

  // Global idle tracker — only used to fade the Core floating nav.
  const navIdle = useIdle({
    timeoutMs: 4000,
    disabled: activeView !== "core",
  });
  const focusMode = layout.state.coreFocusMode && activeView === "core";

  const handleViewChange = useCallback((v: ViewType) => {
    setActiveView(v);
  }, []);

  const coreActionCtx = useCallback(
    () => ({
      setActiveView: handleViewChange,
      setSettingsOpen,
      setMemoryDrawerOpen,
      setFocusMode: (b: boolean) =>
        layout.dispatch({ type: "SET_FOCUS_MODE", value: b }),
      openWebView: webView.openUrl,
      addMemory: async (content: string) => {
        if (!activeUser) return;
        await api.addMemory(activeUser.id, content, "note");
      },
      newConversation: () => setConversationId(null),
    }),
    [activeUser, handleViewChange, webView.openUrl, layout]
  );

  // When shortcuts request wake/voice from another view, wait until Core
  // has actually mounted before dispatching the CustomEvent.
  useEffect(() => {
    if (activeView !== "core") return;
    if (pendingVoiceToggle > 0) {
      window.dispatchEvent(new CustomEvent("bob:toggle-voice"));
      setPendingVoiceToggle(0);
    }
    if (pendingWake > 0) {
      window.dispatchEvent(new CustomEvent("bob:wake"));
      setPendingWake(0);
    }
  }, [activeView, pendingVoiceToggle, pendingWake]);

  // Keyboard shortcuts
  useCoreShortcuts(
    {
      toggleCommandOverlay: () => setCommandOverlayOpen((o) => !o),
      cycleView: () => setActiveView((v) => (v === "core" ? "launcher" : "core")),
      toggleVoice: () => {
        if (activeView !== "core") {
          setPendingVoiceToggle((n) => n + 1);
          setActiveView("core");
          return;
        }
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
        if (commandOverlayOpen) return setCommandOverlayOpen(false);
        if (focusMode)
          return layout.dispatch({ type: "SET_FOCUS_MODE", value: false });
        if (settingsOpen) return setSettingsOpen(false);
        if (memoryDrawerOpen) return setMemoryDrawerOpen(false);
        if (customizeOpen) return setCustomizeOpen(false);
        if (webView.isOpen) return webView.close();
      },
      wakeBob: () => {
        if (activeView !== "core") {
          setPendingWake((n) => n + 1);
          setActiveView("core");
          return;
        }
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
        onSelectView={(v) => {
          setCommandOverlayOpen(false);
          if (v === "core" || v === "launcher") {
            handleViewChange(v);
          }
        }}
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
          setMemoryDrawerOpen(true);
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
                voiceMuted={voiceMuted}
                actionCtx={coreActionCtx()}
              />
            </motion.div>
          </AnimatePresence>
        </AppChrome>
        {overlays}
      </>
    );
  }

  // ── Workspace View ─────────────────────────────────────────────────────────
  return (
    <>
      <AppChrome
        activeView={activeView}
        onViewChange={handleViewChange}
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
            <LauncherView
              onViewChange={handleViewChange}
              onOpenSettings={() => setSettingsOpen(true)}
              onOpenCustomize={() => setCustomizeOpen(true)}
              onOpenWebView={webView.openUrl}
            />
          </motion.div>
        </AnimatePresence>
      </AppChrome>
      {overlays}
    </>
  );
}
