"use client";

import { EyeOff, Eye, LayoutGrid } from "lucide-react";
import { useJarvis } from "../providers";
import { Select } from "../ui/select";
import { api } from "@/lib/api";
import { MODES } from "@/lib/utils";
import { EnginePicker } from "./engine-picker";

export function ChatHeader({
  confidential,
  onToggleConfidential,
  onOpenCustomize,
  showCustomize,
}: {
  confidential: boolean;
  onToggleConfidential: () => void;
  onOpenCustomize?: () => void;
  showCustomize?: boolean;
}) {
  const { activeUser, refresh } = useJarvis();

  if (!activeUser) return null;

  const modeOpts = MODES.map((m) => ({
    value: m.id,
    label: `${m.emoji} ${m.label}`,
  }));

  const isChild = activeUser.role === "child";

  return (
    <header className="relative z-10 flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-3 border-b border-white/[0.04] bg-bg/40 backdrop-blur-xl">
      <div className="flex items-center gap-2 min-w-0 flex-shrink">
        <Select
          className="w-36 shrink-0"
          value={activeUser.operating_mode}
          onChange={async (v) => {
            await api.updateUser(activeUser.id, { operating_mode: v as "work" });
            refresh();
          }}
          options={modeOpts}
        />
        <EnginePicker />
      </div>

      <div className="flex items-center gap-2 flex-wrap justify-end">
        {confidential && (
          <span className="chip text-amber-300 border-amber-300/30 bg-amber-300/10">
            <span className="dot-pulse text-amber-300" /> Confidential
          </span>
        )}
        {showCustomize && onOpenCustomize && (
          <button
            className="btn-ghost"
            onClick={onOpenCustomize}
            title="Anpassa layout"
            aria-label="Anpassa layout"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        )}
        {!isChild && (
          <button
            className="btn-ghost"
            onClick={onToggleConfidential}
            title={confidential ? "Disable confidential mode" : "Enable confidential mode"}
            aria-label={confidential ? "Exit incognito" : "Incognito"}
          >
            {confidential ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span className="hidden sm:inline">
              {confidential ? "Exit incognito" : "Incognito"}
            </span>
          </button>
        )}
      </div>
    </header>
  );
}
