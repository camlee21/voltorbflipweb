// Central catalog of purchasable board themes. `id` matches the sprite
// filename suffix Tile.jsx already uses (e.g. "1_blastoise.png",
// "UnknownTile_blastoise.png"), and is also what gets stored in the
// Supabase `profiles.themes` array and the equipped-theme localStorage key.
//
// bgColour/accentColour are placeholders — swap in your actual palette
// whenever you wire these into the game's real background/accent CSS.

export const THEMES = [
  {
    id: "classic",
    label: "Classic",
    price: 0,
    bgColour: "#1b1f2a",
    accentColour: "#2c7644",
  },
  { id: "venusaur", label: "Venusaur", price: 1000, bgColour: "#12291a", accentColour: "#4caf50" },
  { id: "charizard", label: "Charizard", price: 1000, bgColour: "#401b12", accentColour: "#ff7a3d" },
  { id: "blastoise", label: "Blastoise", price: 1000, bgColour: "#173247", accentColour: "#3ea6d8" },
  { id: "pikachu", label: "Pikachu", price: 1500, bgColour: "#3d3208", accentColour: "#ffd93d" },
  { id: "sylveon", label: "Sylveon", price: 1500, bgColour: "#3d2130", accentColour: "#f7b6c2" },
  { id: "metagross", label: "Metagross", price: 3000, bgColour: "#292d33", accentColour: "#7fa0c9" },
  { id: "reshiram", label: "Reshiram", price: 5000, bgColour: "#232b32", accentColour: "#8fd3ff" },
  { id: "zekrom", label: "Zekrom", price: 5000, bgColour: "#16161c", accentColour: "#5dc9f7" },
];

export function getTheme(id) {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}