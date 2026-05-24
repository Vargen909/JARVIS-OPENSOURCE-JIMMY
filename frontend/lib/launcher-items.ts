/**
 * B.O.B OS Launcher – item registry.
 *
 * Single source of truth for all launcher cards. Each item is pure data;
 * rendering is handled by LauncherCard / LauncherCoreCard.
 */

import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AudioLines,
  BarChart3,
  BookOpen,
  Box,
  Brain,
  BrainCircuit,
  Bug,
  Calendar,
  Cloud,
  Code,
  Database,
  Folder,
  Globe,
  Inbox,
  LayoutDashboard,
  Lightbulb,
  ListChecks,
  Power,
  Rocket,
  Settings,
  ShieldCheck,
  Star,
  StickyNote,
  Terminal,
  Users,
} from "lucide-react";
import type { ViewType } from "@/components/shell/app-chrome";

// ── Accent palette ──────────────────────────────────────────────────────────

export type AccentKey =
  | "blue"
  | "violet"
  | "cyan"
  | "emerald"
  | "amber"
  | "rose"
  | "sky"
  | "slate"
  | "indigo"
  | "orange"
  | "teal"
  | "purple"
  | "green"
  | "yellow";

// ── Action union ─────────────────────────────────────────────────────────────

export type LauncherAction =
  | { kind: "view"; view: ViewType }
  | { kind: "settings" }
  | { kind: "customize" }
  | { kind: "webview"; url: string }
  | { kind: "soon" };

// ── Item shape ───────────────────────────────────────────────────────────────

export interface LauncherItem {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  accent: AccentKey;
  status: "available" | "soon";
  /** "core" renders as the special BobCore card; "default" = standard icon card. */
  variant?: "default" | "core";
  action: LauncherAction;
}

// ── Registry ─────────────────────────────────────────────────────────────────

export const LAUNCHER_ITEMS: LauncherItem[] = [
  // ── Special: B.O.B Core ─────────────────────────────────────────────────
  {
    id: "core",
    label: "B.O.B",
    description: "Neural AI core",
    icon: Brain,
    accent: "blue",
    status: "available",
    variant: "core",
    action: { kind: "view", view: "core" },
  },

  // ── Row 1 ────────────────────────────────────────────────────────────────
  {
    id: "workspace",
    label: "Workspace",
    description: "Module grid",
    icon: LayoutDashboard,
    accent: "blue",
    status: "available",
    action: { kind: "view", view: "launcher" },
  },
  {
    id: "settings",
    label: "Settings",
    description: "Preferences & API keys",
    icon: Settings,
    accent: "slate",
    status: "available",
    action: { kind: "settings" },
  },
  {
    id: "notes",
    label: "Notes",
    description: "Saved thoughts",
    icon: StickyNote,
    accent: "amber",
    status: "available",
    action: { kind: "view", view: "launcher" },
  },
  {
    id: "browser",
    label: "Browser",
    description: "Integrated web view",
    icon: Globe,
    accent: "sky",
    status: "available",
    action: { kind: "webview", url: "https://www.google.com" },
  },
  {
    id: "code-mode",
    label: "Code Mode",
    description: "Developer workspace",
    icon: Code,
    accent: "cyan",
    status: "available",
    action: { kind: "view", view: "launcher" },
  },

  // ── Row 2 ────────────────────────────────────────────────────────────────
  {
    id: "terminal",
    label: "Terminal",
    description: "System terminal",
    icon: Terminal,
    accent: "emerald",
    status: "soon",
    action: { kind: "soon" },
  },
  {
    id: "files",
    label: "Files",
    description: "File workspace",
    icon: Folder,
    accent: "orange",
    status: "soon",
    action: { kind: "soon" },
  },
  {
    id: "tasks",
    label: "Tasks",
    description: "Task management",
    icon: ListChecks,
    accent: "blue",
    status: "soon",
    action: { kind: "soon" },
  },
  {
    id: "documents",
    label: "Documents",
    description: "Document library",
    icon: BookOpen,
    accent: "indigo",
    status: "soon",
    action: { kind: "soon" },
  },
  {
    id: "cloud",
    label: "Cloud",
    description: "Cloud services",
    icon: Cloud,
    accent: "blue",
    status: "soon",
    action: { kind: "soon" },
  },

  // ── Row 3 ────────────────────────────────────────────────────────────────
  {
    id: "analytics",
    label: "Analytics",
    description: "Usage & insights",
    icon: BarChart3,
    accent: "violet",
    status: "soon",
    action: { kind: "soon" },
  },
  {
    id: "sandbox",
    label: "Sandbox",
    description: "Experimental playground",
    icon: Box,
    accent: "indigo",
    status: "soon",
    action: { kind: "soon" },
  },
  {
    id: "security",
    label: "Security",
    description: "Privacy & safety",
    icon: ShieldCheck,
    accent: "emerald",
    status: "soon",
    action: { kind: "soon" },
  },
  {
    id: "database",
    label: "Database",
    description: "Data management",
    icon: Database,
    accent: "sky",
    status: "soon",
    action: { kind: "soon" },
  },
  {
    id: "ai-models",
    label: "AI Models",
    description: "Model management",
    icon: BrainCircuit,
    accent: "purple",
    status: "soon",
    action: { kind: "soon" },
  },

  // ── Row 4 ────────────────────────────────────────────────────────────────
  {
    id: "debugger",
    label: "Debugger",
    description: "Debug tools",
    icon: Bug,
    accent: "rose",
    status: "soon",
    action: { kind: "soon" },
  },
  {
    id: "deploy",
    label: "Deploy",
    description: "Deployment pipeline",
    icon: Rocket,
    accent: "green",
    status: "soon",
    action: { kind: "soon" },
  },
  {
    id: "voice-console",
    label: "Voice Console",
    description: "Voice & speech",
    icon: AudioLines,
    accent: "cyan",
    status: "soon",
    action: { kind: "soon" },
  },
  {
    id: "favorites",
    label: "Favorites",
    description: "Saved items",
    icon: Star,
    accent: "amber",
    status: "soon",
    action: { kind: "soon" },
  },
  {
    id: "team",
    label: "Team",
    description: "Profiles & users",
    icon: Users,
    accent: "indigo",
    status: "soon",
    action: { kind: "soon" },
  },

  // ── Row 5 ────────────────────────────────────────────────────────────────
  {
    id: "calendar",
    label: "Calendar",
    description: "Schedule & events",
    icon: Calendar,
    accent: "blue",
    status: "soon",
    action: { kind: "soon" },
  },
  {
    id: "activity",
    label: "Activity",
    description: "Recent actions",
    icon: Activity,
    accent: "teal",
    status: "soon",
    action: { kind: "soon" },
  },
  {
    id: "inbox",
    label: "Inbox",
    description: "Messages & alerts",
    icon: Inbox,
    accent: "violet",
    status: "soon",
    action: { kind: "soon" },
  },
  {
    id: "ideas",
    label: "Ideas",
    description: "Idea board",
    icon: Lightbulb,
    accent: "yellow",
    status: "soon",
    action: { kind: "soon" },
  },
  {
    id: "shutdown",
    label: "Shutdown",
    description: "End session",
    icon: Power,
    accent: "rose",
    status: "soon",
    action: { kind: "soon" },
  },
];
