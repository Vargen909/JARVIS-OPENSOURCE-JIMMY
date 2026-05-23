"use client";

const EVENTS = [
  { time: "09:42", text: "Genererade komponent Header.tsx" },
  { time: "09:38", text: "Analyserade projektmapp" },
  { time: "09:31", text: "Sparade minnesanteckning" },
  { time: "09:15", text: "Bytte till Work Mode" },
];

export function ActivityFeed() {
  return (
    <div className="panel p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Aktivitetsflöde</h3>
        <span className="chip text-[10px] text-ink-mute border-ink-mute/30">demo</span>
      </div>
      <ul className="space-y-2">
        {EVENTS.map((e) => (
          <li key={e.time + e.text} className="flex gap-2 text-xs">
            <span className="text-ink-mute shrink-0 w-10">{e.time}</span>
            <span className="text-ink-dim">{e.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
