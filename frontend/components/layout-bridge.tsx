"use client";

import { LayoutProvider } from "@/lib/use-layout-store";
import { useJarvis } from "./providers";

export function LayoutBridge({ children }: { children: React.ReactNode }) {
  const { activeUser } = useJarvis();
  return (
    <LayoutProvider userId={activeUser?.id ?? null}>
      {children}
    </LayoutProvider>
  );
}
