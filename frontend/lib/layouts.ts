export type LayoutId =
  | "focus"
  | "command-center"
  | "compact"
  | "minimal"
  | "developer"
  | "family"
  | "creative";

export type BrainSize = "sm" | "md" | "lg";
export type Density = "compact" | "default" | "spacious";
export type SidebarMode = "full" | "compact" | "hidden";

export interface LayoutPanels {
  neuralCore: boolean;
  systemStatus: boolean;
  activityFeed: boolean;
  tasksStrip: boolean;
  quickActions: boolean;
}

export interface LayoutPreset {
  id: LayoutId;
  label: string;
  description: string;
  panels: LayoutPanels;
  brainSize: BrainSize;
  density: Density;
  sidebar: SidebarMode;
}

export const LAYOUT_PRESETS: LayoutPreset[] = [
  {
    id: "focus",
    label: "Focus",
    description: "Big neural brain, minimal side panels.",
    panels: {
      neuralCore: true,
      systemStatus: false,
      activityFeed: false,
      tasksStrip: false,
      quickActions: false,
    },
    brainSize: "lg",
    density: "spacious",
    sidebar: "compact",
  },
  {
    id: "command-center",
    label: "Command Center",
    description: "Dashboard with tasks, system status, and activity.",
    panels: {
      neuralCore: true,
      systemStatus: true,
      activityFeed: true,
      tasksStrip: true,
      quickActions: true,
    },
    brainSize: "md",
    density: "default",
    sidebar: "full",
  },
  {
    id: "compact",
    label: "Compact",
    description: "Smaller panels, more information visible.",
    panels: {
      neuralCore: true,
      systemStatus: true,
      activityFeed: false,
      tasksStrip: true,
      quickActions: true,
    },
    brainSize: "sm",
    density: "compact",
    sidebar: "compact",
  },
  {
    id: "minimal",
    label: "Minimal",
    description: "Mostly chat and brain, very clean.",
    panels: {
      neuralCore: true,
      systemStatus: false,
      activityFeed: false,
      tasksStrip: false,
      quickActions: false,
    },
    brainSize: "md",
    density: "spacious",
    sidebar: "hidden",
  },
  {
    id: "developer",
    label: "Developer Mode",
    description: "Project, files, tasks and coding panels visible.",
    panels: {
      neuralCore: true,
      systemStatus: true,
      activityFeed: true,
      tasksStrip: true,
      quickActions: true,
    },
    brainSize: "sm",
    density: "compact",
    sidebar: "full",
  },
  {
    id: "family",
    label: "Family Mode",
    description: "Softer layout, simpler cards, less technical.",
    panels: {
      neuralCore: true,
      systemStatus: false,
      activityFeed: false,
      tasksStrip: true,
      quickActions: true,
    },
    brainSize: "md",
    density: "spacious",
    sidebar: "full",
  },
  {
    id: "creative",
    label: "Creative Mode",
    description: "Larger idea board and visual workspace.",
    panels: {
      neuralCore: true,
      systemStatus: false,
      activityFeed: true,
      tasksStrip: false,
      quickActions: true,
    },
    brainSize: "lg",
    density: "default",
    sidebar: "compact",
  },
];

export const DEFAULT_LAYOUT_ID: LayoutId = "command-center";

export function getLayoutPreset(id: LayoutId): LayoutPreset {
  return LAYOUT_PRESETS.find((p) => p.id === id) ?? LAYOUT_PRESETS[1];
}

export function brainScale(size: BrainSize): number {
  switch (size) {
    case "sm":
      return 0.75;
    case "lg":
      return 1.25;
    default:
      return 1;
  }
}
