// qa-layout: 締め/次アクション。
// content = { title, description, items: [] }
const { header, usableW, parseRich, CONTENT_BOTTOM } = require("./_deck");

module.exports = function qaLayout(pptx, slide, theme, data) {
  const m = theme.margin;
  const w = usableW(theme);
  let top = header(slide, theme, data);
  const c = data.content || {};

  if (c.title) {
    slide.addText(parseRich(c.title, theme, { fontSize: 28, bold: true, color: theme.colors.primary }), {
      x: m, y: top, w, h: 0.8, valign: "top",
    });
    top += 0.9;
  }
  if (c.description) {
    slide.addText(parseRich(c.description, theme, { fontSize: 15, color: theme.colors.subtle }), {
      x: m, y: top, w, h: 0.5, valign: "top",
    });
    top += 0.65;
  }

  const items = Array.isArray(c.items) ? c.items : [];
  if (items.length) {
    const runs = [];
    items.forEach((it, i) => {
      if (i > 0 && runs.length) runs[runs.length - 1].options.breakLine = true;
      runs.push(...parseRich(it, theme, { fontSize: 15, color: theme.colors.primary }));
    });
    slide.addText(runs, {
      x: m, y: top, w, h: CONTENT_BOTTOM - top, valign: "top", lineSpacingMultiple: 1.5,
    });
  }
};
