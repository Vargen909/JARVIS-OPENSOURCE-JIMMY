"use client";

import { useEffect } from "react";
import { useJarvis } from "@/components/providers";
import { Onboarding } from "@/components/onboarding";
import { AppShell } from "@/components/app-shell";
import { Loader } from "@/components/ui/loader";

export default function Home() {
  const { loading, info, users, refresh } = useJarvis();

  useEffect(() => {
    if (!loading && (!info || users.length === 0)) {
      // Trigger refresh if backend wasn't reachable on first load.
      const t = setTimeout(refresh, 1500);
      return () => clearTimeout(t);
    }
  }, [loading, info, users.length, refresh]);

  if (loading) return <Loader label="Waking Jarvis…" />;

  if (!info) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="panel p-8 max-w-md text-center">
          <h1 className="text-2xl font-semibold mb-2">Can't reach Jarvis</h1>
          <p className="text-ink-dim text-sm mb-4">
            Make sure the backend is running on{" "}
            <code className="text-accent">{process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8765"}</code>.
          </p>
          <button className="btn-primary" onClick={() => refresh()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (users.length === 0 || info.needs_onboarding) {
    return <Onboarding />;
  }

  return <AppShell />;
}
