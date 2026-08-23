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

// Pikakirjoittimen automaattinen nuottigrafiikan vakioasettelu.
// Millimetrimitat koskevat A4-paperia. Järjestelmäväli on staff-space-
// pohjainen, jotta nuottikoon mukana skaalautuva pystyrakenne säilyy.
export const STANDARD_SCORE_LAYOUT = Object.freeze({
  titleTopMm: 14,
  titleHeightMm: 7,
  titleBottomMm: 7,
  titleBottomWithMetadataMm: 14,
  metadataTopMarginMm: 32,
  composerDistanceWithTitleMm: 17,
  composerDistanceWithoutTitleMm: 10,
  composerHeightMm: 4.5,
  minimumDistanceBetweenSystems: 8.5,
  minSkyBottomDistBetweenSystems: 3.0,
  tempoTextHeight: 2.3,
  tempoYSpacing: 0.7
});

export function mmToOsmdUnits(mm, containerWidthPx, layout = DEFAULT_PAGE_LAYOUT, zoom = 1) {
  const safeWidth = Math.max(1, Number(containerWidthPx) || 1);
  const safeZoom = Math.max(0.01, Number(zoom) || 1);
  const pageWidthUnits = safeWidth / safeZoom / 10;
  return Number(mm || 0) * pageWidthUnits / layout.pageWidthMm;
}

export function marginsToOsmdUnits(containerWidthPx, layout = DEFAULT_PAGE_LAYOUT, zoom = 1) {
  const m = layout.marginsMm;
  return {
    top: mmToOsmdUnits(m.top, containerWidthPx, layout, zoom),
    right: mmToOsmdUnits(m.right, containerWidthPx, layout, zoom),
    bottom: mmToOsmdUnits(m.bottom, containerWidthPx, layout, zoom),
    left: mmToOsmdUnits(m.left, containerWidthPx, layout, zoom)
  };
}

export function standardEngravingRules(settings = {}, containerWidthPx, layout = DEFAULT_PAGE_LAYOUT, zoom = 1) {
  const standard = STANDARD_SCORE_LAYOUT;
  const hasTitle = Boolean(String(settings.title || '').trim());
  const hasComposer = Boolean(String(settings.composer || '').trim());
  const hasTempo = Boolean(String(settings.tempoText || '').trim());
  const hasMetadata = hasComposer || hasTempo;

  // Kun kaikki otsikkotiedot ovat käytössä, ensimmäinen järjestelmä asettuu
  // noin 50 mm paperin yläreunasta. Ilman otsikkoa tyhjää otsikkoblokkia ei
  // varata, ja täysin ilman otsikkotietoja käytetään tavallista 15 mm marginaalia.
  const topMarginMm = hasTitle
    ? layout.marginsMm.top
    : (hasMetadata ? standard.metadataTopMarginMm : layout.marginsMm.top);

  return {
    hasTitle,
    hasComposer,
    pageTopMargin: mmToOsmdUnits(topMarginMm, containerWidthPx, layout, zoom),
    titleTopDistance: mmToOsmdUnits(standard.titleTopMm, containerWidthPx, layout, zoom),
    sheetTitleHeight: mmToOsmdUnits(standard.titleHeightMm, containerWidthPx, layout, zoom),
    titleBottomDistance: mmToOsmdUnits(
      hasMetadata ? standard.titleBottomWithMetadataMm : standard.titleBottomMm,
      containerWidthPx,
      layout,
      zoom
    ),
    systemComposerDistance: mmToOsmdUnits(
      hasTitle ? standard.composerDistanceWithTitleMm : standard.composerDistanceWithoutTitleMm,
      containerWidthPx,
      layout,
      zoom
    ),
    sheetComposerHeight: mmToOsmdUnits(standard.composerHeightMm, containerWidthPx, layout, zoom),
    minimumDistanceBetweenSystems: standard.minimumDistanceBetweenSystems,
    minSkyBottomDistBetweenSystems: standard.minSkyBottomDistBetweenSystems,
    instantaneousTempoTextHeight: standard.tempoTextHeight,
    tempoYSpacing: standard.tempoYSpacing
  };
}
