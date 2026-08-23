export const DEFAULT_PAGE_LAYOUT = Object.freeze({
  format: 'A4_P',
  pageWidthMm: 210,
  pageHeightMm: 297,
  marginsMm: Object.freeze({
    top: 15,
    right: 15,
    bottom: 15,
    left: 15
  })
});

export function marginsToOsmdUnits(containerWidthPx, layout = DEFAULT_PAGE_LAYOUT, zoom = 1) {
  const safeWidth = Math.max(1, Number(containerWidthPx) || 1);
  const safeZoom = Math.max(0.01, Number(zoom) || 1);
  const pageWidthUnits = safeWidth / safeZoom / 10;
  const mmToUnits = pageWidthUnits / layout.pageWidthMm;
  const m = layout.marginsMm;

  return {
    top: m.top * mmToUnits,
    right: m.right * mmToUnits,
    bottom: m.bottom * mmToUnits,
    left: m.left * mmToUnits
  };
}
