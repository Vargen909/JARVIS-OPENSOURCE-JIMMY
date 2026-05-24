import type { Metadata } from "next";
import Script from "next/script";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { BobProvider } from "@/components/providers";
import { LayoutBridge } from "@/components/layout-bridge";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "B.O.B — Your personal AI operating system",
  description:
    "Open-source, plug-and-play personal AI operating system. Multi-user, multi-engine, private.",
};

/**
 * Pre-hydration script:
 *  1. Migrates any legacy "jarvis.*" localStorage keys to "bob.*"
 *  2. Reads the active user's stored layout
 *  3. Sets data-palette / data-density / --glow-intensity / --brain-scale
 *     before React hydrates so the page never flashes the wrong theme.
 */
const PRE_HYDRATE_SCRIPT = `
(function(){
  try {
    /* ── 1. Migrate legacy keys to bob.* ── */
    var legacyMap = {
      'jarvis.activeUserId': 'bob.activeUserId',
      'jarvis.layout.guest': 'bob.layout.guest'
    };
    for (var oldK in legacyMap) {
      var newK = legacyMap[oldK];
      var v = localStorage.getItem(oldK);
      if (v != null && localStorage.getItem(newK) == null) {
        localStorage.setItem(newK, v);
        localStorage.removeItem(oldK);
      }
    }
    /* per-user layout keys */
    var keysToRename = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf('jarvis.layout.user:') === 0) keysToRename.push(k);
    }
    for (var j = 0; j < keysToRename.length; j++) {
      var oldKey = keysToRename[j];
      var newKey = 'bob.layout.user:' + oldKey.split(':')[1];
      var val = localStorage.getItem(oldKey);
      if (val != null && localStorage.getItem(newKey) == null) {
        localStorage.setItem(newKey, val);
        localStorage.removeItem(oldKey);
      }
    }

    /* ── 2. Read active layout ── */
    var uid = localStorage.getItem('bob.activeUserId');
    var key = uid ? 'bob.layout.user:' + uid : 'bob.layout.guest';
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
    <html
      lang="en"
      className={`dark ${inter.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <head>
        <Script
          id="bob-theme-hydrate"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: PRE_HYDRATE_SCRIPT }}
        />
      </head>
      <body className="min-h-screen font-sans">
        <BobProvider>
          <LayoutBridge>{children}</LayoutBridge>
        </BobProvider>
      </body>
    </html>
  );
}
