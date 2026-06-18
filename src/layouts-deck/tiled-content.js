// tiled-content: ベージュのタイル3枚を横並び。
// content = { pre_text?, tiles: [tile, tile, tile] }
const { header, usableW, parseRich, stripHtml, renderColumnContent, CONTENT_BOTTOM } = require("./_deck");

module.exports = function tiledContent(pptx, slide, theme, data) {
  const m = theme.margin;
  const w = usableW(theme);
  let top = header(slide, theme, data);
  const c = data.content || {};

  if (c.pre_text && stripHtml(c.pre_text)) {
    slide.addText(parseRich(c.pre_text, theme, { fontSize: 12, color: theme.colors.subtle }), {
      x: m, y: top, w, h: 0.4, valign: "top",
    });
    top += 0.5;
  }

  const tiles = (Array.isArray(c.tiles) ? c.tiles : []).slice(0, 3);
  if (!tiles.length) return;

  const gap = 0.28;
  const tileW = (w - gap * (tiles.length - 1)) / tiles.length;
  const tileH = CONTENT_BOTTOM - top;

  tiles.forEach((t, i) => {
    renderColumnContent(pptx, slide, theme, t, {
      x: m + i * (tileW + gap), y: top, w: tileW, h: tileH, panel: true,
    });
  });
};
