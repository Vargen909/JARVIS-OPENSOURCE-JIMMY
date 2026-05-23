import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { JarvisProvider } from "@/components/providers";
import { LayoutBridge } from "@/components/layout-bridge";

export const metadata: Metadata = {
  title: "Jarvis — Your personal AI assistant",
  description:
    "Open-source, plug-and-play personal AI assistant. Multi-user, multi-engine, private.",
};

const PRE_HYDRATE_SCRIPT = `
(function(){
  try {
    var uid = localStorage.getItem('jarvis.activeUserId');
    var key = uid ? 'jarvis.layout.user:' + uid : 'jarvis.layout.guest';
    var raw = localStorage.getItem(key);
    var root = document.documentElement;
    var palette = 'neural-blue';
    var density = 'default';
    var glow = '0.7';
    var brain = '1';
    if (raw) {
      var s = JSON.parse(raw);
      if (s.paletteId) palette = s.paletteId;
      if (s.density) density = s.density;
      if (s.glowIntensity != null) glow = String(s.glowIntensity);
      if (s.brainSize === 'sm') brain = '0.75';
      else if (s.brainSize === 'lg') brain = '1.25';
    }
    root.setAttribute('data-palette', palette);
    root.setAttribute('data-density', density);
    root.style.setProperty('--glow-intensity', glow);
    root.style.setProperty('--brain-scale', brain);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <Script
          id="jarvis-theme-hydrate"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: PRE_HYDRATE_SCRIPT }}
        />
      </head>
      <body className="min-h-screen font-sans">
        <JarvisProvider>
          <LayoutBridge>{children}</LayoutBridge>
        </JarvisProvider>
      </body>
    </html>
  );
}
