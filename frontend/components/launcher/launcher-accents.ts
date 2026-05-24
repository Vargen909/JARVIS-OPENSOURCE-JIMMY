/**
 * Per-card accent colour map.
 *
 * All class strings are written in full so Tailwind JIT can statically
 * detect them during the build — never use string interpolation on these.
 */

import type { AccentKey } from "@/lib/launcher-items";

export interface AccentClasses {
  /** Icon foreground colour */
  icon: string;
  /** Icon container background (resting) */
  iconBg: string;
  /** Icon container background (hover) */
  iconBgHover: string;
  /** Bottom accent line colour */
  line: string;
  /** Card border on hover */
  borderHover: string;
  /** "Soon" pill border + text */
  pillBorder: string;
  pillText: string;
}

export const ACCENT_MAP: Record<AccentKey, AccentClasses> = {
  blue: {
    icon: "text-blue-400",
    iconBg: "bg-blue-400/10",
    iconBgHover: "group-hover:bg-blue-400/20",
    line: "bg-blue-400",
    borderHover: "hover:border-blue-400/50",
    pillBorder: "border-blue-400/30",
    pillText: "text-blue-400/70",
  },
  violet: {
    icon: "text-violet-400",
    iconBg: "bg-violet-400/10",
    iconBgHover: "group-hover:bg-violet-400/20",
    line: "bg-violet-400",
    borderHover: "hover:border-violet-400/50",
    pillBorder: "border-violet-400/30",
    pillText: "text-violet-400/70",
  },
  cyan: {
    icon: "text-cyan-400",
    iconBg: "bg-cyan-400/10",
    iconBgHover: "group-hover:bg-cyan-400/20",
    line: "bg-cyan-400",
    borderHover: "hover:border-cyan-400/50",
    pillBorder: "border-cyan-400/30",
    pillText: "text-cyan-400/70",
  },
  emerald: {
    icon: "text-emerald-400",
    iconBg: "bg-emerald-400/10",
    iconBgHover: "group-hover:bg-emerald-400/20",
    line: "bg-emerald-400",
    borderHover: "hover:border-emerald-400/50",
    pillBorder: "border-emerald-400/30",
    pillText: "text-emerald-400/70",
  },
  amber: {
    icon: "text-amber-400",
    iconBg: "bg-amber-400/10",
    iconBgHover: "group-hover:bg-amber-400/20",
    line: "bg-amber-400",
    borderHover: "hover:border-amber-400/50",
    pillBorder: "border-amber-400/30",
    pillText: "text-amber-400/70",
  },
  rose: {
    icon: "text-rose-400",
    iconBg: "bg-rose-400/10",
    iconBgHover: "group-hover:bg-rose-400/20",
    line: "bg-rose-400",
    borderHover: "hover:border-rose-400/50",
    pillBorder: "border-rose-400/30",
    pillText: "text-rose-400/70",
  },
  sky: {
    icon: "text-sky-400",
    iconBg: "bg-sky-400/10",
    iconBgHover: "group-hover:bg-sky-400/20",
    line: "bg-sky-400",
    borderHover: "hover:border-sky-400/50",
    pillBorder: "border-sky-400/30",
    pillText: "text-sky-400/70",
  },
  slate: {
    icon: "text-slate-300",
    iconBg: "bg-slate-400/10",
    iconBgHover: "group-hover:bg-slate-400/20",
    line: "bg-slate-400",
    borderHover: "hover:border-slate-400/50",
    pillBorder: "border-slate-400/30",
    pillText: "text-slate-400/70",
  },
  indigo: {
    icon: "text-indigo-400",
    iconBg: "bg-indigo-400/10",
    iconBgHover: "group-hover:bg-indigo-400/20",
    line: "bg-indigo-400",
    borderHover: "hover:border-indigo-400/50",
    pillBorder: "border-indigo-400/30",
    pillText: "text-indigo-400/70",
  },
  orange: {
    icon: "text-orange-400",
    iconBg: "bg-orange-400/10",
    iconBgHover: "group-hover:bg-orange-400/20",
    line: "bg-orange-400",
    borderHover: "hover:border-orange-400/50",
    pillBorder: "border-orange-400/30",
    pillText: "text-orange-400/70",
  },
  teal: {
    icon: "text-teal-400",
    iconBg: "bg-teal-400/10",
    iconBgHover: "group-hover:bg-teal-400/20",
    line: "bg-teal-400",
    borderHover: "hover:border-teal-400/50",
    pillBorder: "border-teal-400/30",
    pillText: "text-teal-400/70",
  },
  purple: {
    icon: "text-purple-400",
    iconBg: "bg-purple-400/10",
    iconBgHover: "group-hover:bg-purple-400/20",
    line: "bg-purple-400",
    borderHover: "hover:border-purple-400/50",
    pillBorder: "border-purple-400/30",
    pillText: "text-purple-400/70",
  },
  green: {
    icon: "text-green-400",
    iconBg: "bg-green-400/10",
    iconBgHover: "group-hover:bg-green-400/20",
    line: "bg-green-400",
    borderHover: "hover:border-green-400/50",
    pillBorder: "border-green-400/30",
    pillText: "text-green-400/70",
  },
  yellow: {
    icon: "text-yellow-400",
    iconBg: "bg-yellow-400/10",
    iconBgHover: "group-hover:bg-yellow-400/20",
    line: "bg-yellow-400",
    borderHover: "hover:border-yellow-400/50",
    pillBorder: "border-yellow-400/30",
    pillText: "text-yellow-400/70",
  },
};
