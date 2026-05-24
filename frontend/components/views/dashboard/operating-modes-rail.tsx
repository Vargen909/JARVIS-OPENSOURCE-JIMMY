"use client";

import { motion } from "framer-motion";
import {
  Briefcase,
  Heart,
  Palette,
  GraduationCap,
  Users,
  FolderOpen,
  Brain,
  Settings,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useJarvis } from "@/components/providers";
import { api } from "@/lib/api";
import { MODES, cn } from "@/lib/utils";
import { ProfileSwitcher } from "@/components/profile-switcher";

const MODE_ICONS: Record<string, typeof Briefcase> = {
  work: Briefcase,
  personal: Heart,
  creative: Palette,
  study: GraduationCap,
  family: Users,
  custom: Sparkles,
};

const MODE_COLORS: Record<string, string> = {
  work: "text-blue-400",
  personal: "text-pink-400",
  creative: "text-purple-400",
  study: "text-green-400",
  family: "text-amber-400",
  custom: "text-cyan-400",
};

/** UI-only project placeholders */
const DEMO_PROJECTS = [
  { id: "1", name: "Q2 Strategy", count: 12 },
  { id: "2", name: "Website Redesign", count: 8 },
  { id: "3", name: "Mobile App", count: 5 },
];

interface OperatingModesRailProps {
  isCompact?: boolean;
  onOpenSettings: () => void;
  onOpenMemory: () => void;
}

export function OperatingModesRail({
  isCompact = false,
  onOpenSettings,
  onOpenMemory,
}: OperatingModesRailProps) {
  const { activeUser, refresh } = useJarvis();
  if (!activeUser) return null;

  const activeMode = activeUser.operating_mode;

  const setMode = async (modeId: string) => {
    await api.updateUser(activeUser.id, {
      operating_mode: modeId as (typeof MODES)[number]["id"],
    });
    refresh();
  };

  return (
    <motion.aside
      initial={{ x: -16, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={cn(
        "h-full flex flex-col border-r border-white/[0.06] bg-bg-card/30 backdrop-blur-xl shrink-0",
        isCompact ? "w-16" : "w-64"
      )}
    >
      <div className={cn("border-b border-white/[0.06]", isCompact ? "p-2" : "p-4")}>
        <div className={cn("flex items-center gap-2", isCompact && "justify-center")}>
          <div className="icon-badge-sm">
            <Sparkles className="w-4 h-4 text-accent" />
          </div>
          {!isCompact && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{activeUser.name}</p>
              <p className="text-[11px] text-ink-mute truncate">Jarvis OS</p>
            </div>
          )}
        </div>
        {!isCompact && (
          <div className="mt-3">
            <ProfileSwitcher compact />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        <div>
          {!isCompact && (
            <h3 className="section-label px-2 mb-2">Operating Mode</h3>
          )}
          <div className="space-y-1">
            {MODES.map((mode) => {
              const Icon = MODE_ICONS[mode.id] ?? Sparkles;
              const isActive = activeMode === mode.id;
              return (
                <motion.button
                  key={mode.id}
                  type="button"
                  onClick={() => void setMode(mode.id)}
                  whileHover={{ x: isCompact ? 0 : 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-sm",
                    isActive
                      ? "bg-accent/15 text-accent border border-accent/30"
                      : "text-ink-dim hover:bg-white/[0.04] hover:text-ink border border-transparent",
                    isCompact && "justify-center px-2"
                  )}
                  title={mode.label}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isActive && (MODE_COLORS[mode.id] ?? "text-accent")
                    )}
                  />
                  {!isCompact && (
                    <>
                      <span className="flex-1 text-left">{mode.label}</span>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                      )}
                    </>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {!isCompact && (
          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <h3 className="section-label">Projects</h3>
              <span className="chip text-[10px] py-0.5">UI only</span>
            </div>
            <div className="space-y-1">
              {DEMO_PROJECTS.map((project) => (
                <div
                  key={project.id}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-ink-dim text-sm border border-transparent"
                >
                  <FolderOpen className="h-4 w-4 shrink-0 opacity-60" />
                  <span className="flex-1 truncate">{project.name}</span>
                  <span className="text-xs bg-white/[0.05] px-1.5 py-0.5 rounded">
                    {project.count}
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-2 px-3 py-1 text-ink-mute text-xs">
                <ChevronRight className="h-3 w-3" />
                View all (coming soon)
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={cn("border-t border-white/[0.06] p-3 space-y-1", isCompact && "p-2")}>
        <button
          type="button"
          onClick={onOpenMemory}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-ink-dim hover:bg-white/[0.04] hover:text-ink transition-colors",
            isCompact && "justify-center px-2"
          )}
        >
          <Brain className="h-4 w-4" />
          {!isCompact && "Memory"}
        </button>
        <button
          type="button"
          onClick={onOpenSettings}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-ink-dim hover:bg-white/[0.04] hover:text-ink transition-colors",
            isCompact && "justify-center px-2"
          )}
        >
          <Settings className="h-4 w-4" />
          {!isCompact && "Settings"}
        </button>
      </div>
    </motion.aside>
  );
}
