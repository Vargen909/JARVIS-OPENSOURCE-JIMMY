"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Opt {
  value: string;
  label: string;
}

export function Select({
  value,
  onChange,
  options,
  className,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Opt[];
  className?: string;
  disabled?: boolean;
}) {
  return (
    <div className={cn("relative", className)}>
      <select
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input appearance-none pr-9 cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-bg-card">
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-mute pointer-events-none" />
    </div>
  );
}
