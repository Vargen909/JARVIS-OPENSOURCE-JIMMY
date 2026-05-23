import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const MODES = [
  { id: "work", label: "Work", emoji: "💼" },
  { id: "personal", label: "Personal", emoji: "🏠" },
  { id: "family", label: "Family", emoji: "👨‍👩‍👧" },
  { id: "creative", label: "Creative", emoji: "🎨" },
  { id: "study", label: "Study", emoji: "📚" },
  { id: "custom", label: "Custom", emoji: "✨" },
] as const;

export const PERFORMANCE_MODES = [
  { id: "optimal", label: "Optimal", emoji: "⚡" },
  { id: "performance", label: "Performance", emoji: "🚀" },
  { id: "balanced", label: "Balanced", emoji: "⚖️" },
  { id: "economy", label: "Economy", emoji: "🪫" },
  { id: "multitask", label: "Multitask", emoji: "🔀" },
] as const;

export const SECURITY_LEVELS = [
  { id: "strict", label: "Strict", emoji: "🔒", note: "Ask before every action" },
  { id: "balanced", label: "Balanced", emoji: "⚖️", note: "Ask only for sensitive actions" },
  { id: "relaxed", label: "Relaxed", emoji: "🔓", note: "Ask only for irreversible actions" },
] as const;
