export function Loader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full bg-accent/20 blur-2xl animate-pulse-soft" />
        <div className="absolute inset-2 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-accent text-xl">
          ✦
        </div>
      </div>
      <div className="text-ink-dim text-sm tracking-wide">{label}</div>
    </div>
  );
}
