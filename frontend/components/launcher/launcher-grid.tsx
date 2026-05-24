"use client";

import { LAUNCHER_ITEMS, type LauncherAction } from "@/lib/launcher-items";
import type { ViewType } from "@/components/shell/app-chrome";
import { LauncherCard } from "./launcher-card";
import { LauncherCoreCard } from "./launcher-core-card";

interface LauncherGridProps {
  onAction: (action: LauncherAction) => void;
}

/**
 * Responsive launcher grid.
 *
 * 2 cols on small screens → 3 → 4 → 5 on large desktops.
 * Maps each item from LAUNCHER_ITEMS to the appropriate card component.
 */
export function LauncherGrid({ onAction }: LauncherGridProps) {
  return (
    <div
      className="grid gap-3 sm:gap-4"
      style={{
        gridTemplateColumns:
          "repeat(auto-fill, minmax(min(100%, 130px), 1fr))",
      }}
    >
      {LAUNCHER_ITEMS.map((item) => {
        if (item.variant === "core") {
          return (
            <LauncherCoreCard
              key={item.id}
              onClick={() => onAction(item.action)}
            />
          );
        }
        return (
          <LauncherCard
            key={item.id}
            item={item}
            onClick={() => onAction(item.action)}
          />
        );
      })}
    </div>
  );
}
