"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { LAUNCHER_ITEMS, type LauncherAction } from "@/lib/launcher-items";
import { LauncherCard } from "@/components/launcher/launcher-card";
import { LauncherCoreCard } from "@/components/launcher/launcher-core-card";
import { LauncherToast } from "@/components/launcher/launcher-toast";
import type { ViewType } from "@/components/shell/app-chrome";

interface LauncherViewProps {
  onViewChange: (v: ViewType) => void;
  onOpenSettings: () => void;
  onOpenCustomize: () => void;
  onOpenWebView: (url: string) => void;
}

/**
 * B.O.B OS Workspace / Launcher.
 *
 * The landing screen: a 28-card OS-style grid with per-card accent colours,
 * a special animated B.O.B Core card, and "Coming soon" toasts for
 * placeholder items. All routing is delegated to AppShell callbacks.
 */
export function LauncherView({
  onViewChange,
  onOpenSettings,
  onOpenCustomize,
  onOpenWebView,
}: LauncherViewProps) {
  const [toastVisible, setToastVisible] = useState(false);
  const [toastLabel, setToastLabel] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((label: string) => {
    setToastLabel(label);
    setToastVisible(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 2400);
  }, []);

  const handleAction = useCallback(
    (action: LauncherAction, label: string) => {
      switch (action.kind) {
        case "view":
          onViewChange(action.view);
          break;
        case "settings":
          onOpenSettings();
          break;
        case "customize":
          onOpenCustomize();
          break;
        case "webview":
          onOpenWebView(action.url);
          break;
        case "soon":
          showToast(label);
          break;
      }
    },
    [onViewChange, onOpenSettings, onOpenCustomize, onOpenWebView, showToast]
  );

  return (
    <div className="relative flex flex-col h-full w-full min-h-0 overflow-y-auto">
      {/* Ambient background glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgb(var(--accent-glow) / 0.06) 0%, transparent 70%)",
        }}
        aria-hidden
      />

      <div className="relative z-10 flex-1 max-w-[1280px] mx-auto w-full px-6 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="mb-8"
        >
          <h1 className="text-2xl font-light tracking-tight text-ink">
            Workspace
          </h1>
          <p className="mt-1 text-sm text-ink-mute">Välj ett område</p>
        </motion.div>

        {/* Launcher grid */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08, ease: "easeOut" }}
          className="grid gap-3 sm:gap-4"
          style={{
            gridTemplateColumns:
              "repeat(auto-fill, minmax(min(100%, 130px), 1fr))",
          }}
        >
          {LAUNCHER_ITEMS.map((item) =>
            item.variant === "core" ? (
              <LauncherCoreCard
                key={item.id}
                onClick={() => handleAction(item.action, item.label)}
              />
            ) : (
              <LauncherCard
                key={item.id}
                item={item}
                onClick={() => handleAction(item.action, item.label)}
              />
            )
          )}
        </motion.div>
      </div>

      {/* "Coming soon" toast — fixed overlay, no extra libs */}
      <LauncherToast visible={toastVisible} label={toastLabel} />
    </div>
  );
}
