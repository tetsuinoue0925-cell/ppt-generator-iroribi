// timeline: フェーズの時系列。content = { items: [{ phase, title, description }] }
const { header, usableW, parseRich, CONTENT_BOTTOM } = require("./_deck");

module.exports = function timeline(pptx, slide, theme, data) {
  const m = theme.margin;
  const w = usableW(theme);
  const top = header(slide, theme, data);
  const c = data.content || {};
  const items = Array.isArray(c.items) ? c.items : [];
  if (!items.length) return;

  const gap = 0.3;
  const colW = (w - gap * (items.length - 1)) / items.length;
  const lineY = top + 0.18;

  // 接続線。
  slide.addShape("line", {
    x: m, y: lineY, w, h: 0,
    line: { color: theme.colors.cardBorder, width: 3 },
  });

  items.forEach((it, i) => {
    const x = m + i * (colW + gap);

    // ノードの丸（オレンジ縁）。OOXML の正しい楕円プリセットは "ellipse"。
    slide.addShape("ellipse", {
      x: x - 0.09, y: lineY - 0.09, w: 0.18, h: 0.18,
      fill: { color: "FFFFFF" },
      line: { color: theme.colors.accent, width: 2.5 },
    });

    if (it.phase) {
      slide.addText(it.phase, {
        x, y: lineY + 0.18, w: colW, h: 0.3,
        fontFace: theme.fonts.heading, fontSize: 12, bold: true,
        color: theme.colors.accent, charSpacing: 1,
      });
    }
    if (it.title) {
      slide.addText(parseRich(it.title, theme, { fontSize: 15, bold: true, color: theme.colors.primary }), {
        x, y: lineY + 0.52, w: colW, h: 0.5, valign: "top",
      });
    }
    if (it.description) {
      slide.addText(parseRich(it.description, theme, { fontSize: 12, color: theme.colors.subtle }), {
        x, y: lineY + 1.05, w: colW, h: CONTENT_BOTTOM - (lineY + 1.05), valign: "top",
        lineSpacingMultiple: 1.18,
      });
    }
  });
};
