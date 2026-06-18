// highlight-numbers: 大きな数値メトリクスを横並び。
// content = { numbers: [{ value, label, subtext }], footer? }
const { header, usableW, panel, parseRich, stripHtml, CONTENT_BOTTOM } = require("./_deck");

// "30<span>分以内</span>" → { num: "30", unit: "分以内" }
function splitValue(value) {
  const plain = stripHtml(value);
  const m = plain.match(/^\s*([0-9.,]+%?)(.*)$/);
  if (m) return { num: m[1], unit: m[2].trim() };
  return { num: plain, unit: "" };
}

module.exports = function highlightNumbers(pptx, slide, theme, data) {
  const m = theme.margin;
  const w = usableW(theme);
  const top = header(slide, theme, data);
  const c = data.content || {};
  const nums = Array.isArray(c.numbers) ? c.numbers : [];
  if (!nums.length) return;

  let bottom = CONTENT_BOTTOM;
  if (c.footer && stripHtml(c.footer)) bottom -= 1.2;

  const gap = 0.3;
  const cardW = (w - gap * (nums.length - 1)) / nums.length;
  const cardH = Math.min(2.3, bottom - top);
  const y = top;

  nums.forEach((n, i) => {
    const x = m + i * (cardW + gap);
    panel(pptx, slide, theme, { x, y, w: cardW, h: cardH });

    const { num, unit } = splitValue(n.value);
    slide.addText(
      [
        { text: num, options: { fontSize: 44, bold: true, color: theme.colors.accent, fontFace: theme.fonts.heading } },
        ...(unit ? [{ text: " " + unit, options: { fontSize: 18, bold: true, color: theme.colors.accent, fontFace: theme.fonts.heading } }] : []),
      ],
      { x: x + 0.1, y: y + 0.25, w: cardW - 0.2, h: 0.9, align: "center", valign: "middle" }
    );

    if (n.label) {
      slide.addText(n.label, {
        x: x + 0.1, y: y + 1.15, w: cardW - 0.2, h: 0.4,
        fontFace: theme.fonts.heading, fontSize: 14, bold: true, color: theme.colors.primary, align: "center",
      });
    }
    if (n.subtext) {
      slide.addText(stripHtml(n.subtext), {
        x: x + 0.1, y: y + 1.55, w: cardW - 0.2, h: 0.5,
        fontFace: theme.fonts.body, fontSize: 11, color: theme.colors.subtle, align: "center", valign: "top",
      });
    }
  });

  if (c.footer && stripHtml(c.footer)) {
    slide.addText(parseRich(c.footer, theme, { fontSize: 11, color: theme.colors.subtle }), {
      x: m, y: y + cardH + 0.15, w, h: bottom + 1.2 - (y + cardH + 0.15), valign: "top", lineSpacingMultiple: 1.15,
    });
  }
};
