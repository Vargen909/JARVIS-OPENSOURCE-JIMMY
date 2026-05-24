"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
      {/* Deep ambient background */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% -10%, rgb(var(--accent-glow) / 0.08) 0%, transparent 65%)",
        }}
      />

      <div className="relative z-10 flex-1 max-w-[1200px] mx-auto w-full px-5 sm:px-8 py-10">

        {/* Header — minimal, typographic */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 flex items-end justify-between"
        >
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-ink-mute font-medium mb-2">
              B.O.B OS
            </p>
            <h1 className="text-[26px] font-light tracking-tight text-ink leading-none">
              Workspace
            </h1>
          </div>
          <p className="text-xs text-ink-mute pb-0.5 hidden sm:block">
            Välj ett område att arbeta i
          </p>
        </motion.div>

        {/* Launcher grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="grid gap-3"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 124px), 1fr))",
          }}
        >
          {LAUNCHER_ITEMS.map((item, i) =>
            item.variant === "core" ? (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: i * 0.018, ease: [0.22, 1, 0.36, 1] }}
              >
                <LauncherCoreCard
                  onClick={() => handleAction(item.action, item.label)}
                />
              </motion.div>
            ) : (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, delay: i * 0.018, ease: [0.22, 1, 0.36, 1] }}
              >
                <LauncherCard
                  item={item}
                  onClick={() => handleAction(item.action, item.label)}
                />
              </motion.div>
            )
          )}
        </motion.div>
      </div>

      <LauncherToast visible={toastVisible} label={toastLabel} />
    </div>
  );
}
