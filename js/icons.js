// Hand-drawn, line-only glyphs inspired by the actual petroglyph and
// artifact motifs described in the trail data (ships, spirals, etc.)
// rather than generic map pins.

const GLYPHS = {
  trailhead: `<path d="M12 3 L12 15 M6 8 L18 8 M4 15 Q12 22 20 15" />`,
  geology: `<path d="M3 18 L9 7 L13 13 L16 9 L21 18 Z" />`,
  archaeology: `<path d="M8 4 L16 4 L15 9 Q15 14 12 16 Q9 14 9 9 Z M9 9 L15 9" />`,
  "rock-art": `<path d="M3 15 Q12 9 21 15 L18 15 Q12 12 6 15 Z M12 5 Q15 5 15 8 Q15 5 12 5 Q9 5 9 8 Q9 5 12 5 Z" />`,
  settlement: `<path d="M4 20 L4 11 L12 5 L20 11 L20 20 Z M4 15 L20 15 M9 20 L9 15 M15 20 L15 15" />`,
  path: `<path d="M6 20 Q8 16 6 12 Q4 8 7 4 M18 20 Q16 16 18 12 Q20 8 17 4" stroke-dasharray="2 3" />`,
  artifact: `<circle cx="12" cy="12" r="7" /><path d="M19 12 L23 12 M8 9 Q12 6 16 9" />`,
  museum: `<path d="M4 9 L12 4 L20 9 M5 9 L5 19 M9 9 L9 19 M15 9 L15 19 M19 9 L19 19 M3 19 L21 19" />`
};

function waypointIcon(type, active) {
  const glyph = GLYPHS[type] || GLYPHS.settlement;
  const stroke = active ? "#C1873A" : "#1A1613";
  const bg = active ? "#1A1613" : "#F6F1E7";
  const size = active ? 34 : 28;
  return L.divIcon({
    className: "wp-icon",
    html: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"
             stroke="${stroke}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"
             style="background:${bg}; border-radius:50%; border:1.5px solid ${stroke}; padding:4px; box-shadow:0 1px 4px rgba(0,0,0,0.25);">
             ${glyph}
           </svg>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
}
