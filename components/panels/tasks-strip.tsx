"use client";

const TASKS = [
  { title: "Bygg RVG Dashboard", progress: 57 },
  { title: "Uppdatera API-dokumentation", progress: 80 },
  { title: "Testa Ollama-integration", progress: 30 },
];

export function TasksStrip() {
  return (
    <div className="panel p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Aktiva uppgifter</h3>
        <span className="chip text-[10px] text-ink-mute border-ink-mute/30">demo</span>
      </div>
      <ul className="space-y-3">
        {TASKS.map((t) => (
          <li key={t.title}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-ink-dim truncate pr-2">{t.title}</span>
              <span className="text-accent shrink-0">{t.progress}%</span>
            </div>
            <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-accent/80"
                style={{ width: `${t.progress}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
