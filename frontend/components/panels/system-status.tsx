"use client";

const METRICS = [
  { label: "CPU", value: 23 },
  { label: "GPU", value: 68 },
  { label: "RAM", value: 64 },
  { label: "Lagring", value: 48 },
  { label: "Nätverk", value: 82 },
];

export function SystemStatus() {
  return (
    <div className="panel p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Systemstatus</h3>
        <span className="chip text-[10px] text-ink-mute border-ink-mute/30">demo</span>
      </div>
      <div className="space-y-3">
        {METRICS.map((m) => (
          <div key={m.label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-ink-dim">{m.label}</span>
              <span className="text-ink font-medium">{m.value}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent-soft to-accent-glow transition-all duration-500"
                style={{ width: `${m.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
