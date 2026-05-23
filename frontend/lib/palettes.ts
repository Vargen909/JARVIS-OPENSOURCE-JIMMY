export const PALETTES = [
  { id: "neural-blue", label: "Neural Blue", swatch: "#7c9cff" },
  { id: "violet", label: "Violet Core", swatch: "#a855f7" },
  { id: "green", label: "Cyber Green", swatch: "#34d399" },
  { id: "arctic", label: "Arctic White", swatch: "#e7ebf2" },
  { id: "dark-matter", label: "Dark Matter", swatch: "#3b3f4a" },
  { id: "amber", label: "Warm Amber", swatch: "#f59e0b" },
] as const;

export type PaletteId = (typeof PALETTES)[number]["id"];

export const DEFAULT_PALETTE_ID: PaletteId = "neural-blue";

export function getPalette(id: PaletteId) {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}
