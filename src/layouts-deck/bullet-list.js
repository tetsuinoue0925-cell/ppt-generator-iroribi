// bullet-list: アイコン付き箇条書き。
// content = { pre_text?, items: [{ icon, strong, subtext }] }
const { header, usableW, richBlock, parseRich, stripHtml, CONTENT_BOTTOM } = require("./_deck");

module.exports = function bulletList(pptx, slide, theme, data) {
  const m = theme.margin;
  const w = usableW(theme);
  let top = header(slide, theme, data);
  const c = data.content || {};

  if (c.pre_text) {
    const txt = stripHtml(c.pre_text);
    if (txt) {
      slide.addText(parseRich(c.pre_text, theme, { fontSize: 13, color: theme.colors.primary }), {
        x: m,
        y: top,
        w,
        h: 0.4,
        valign: "top",
      });
      top += 0.5;
    }
  }

  const items = Array.isArray(c.items) ? c.items : [];
  if (!items.length) return;

  const gap = 0.14;
  const rowH = (CONTENT_BOTTOM - top - gap * (items.length - 1)) / items.length;

  items.forEach((it, i) => {
    const y = top + i * (rowH + gap);

    // アクセントのマーカ。
    slide.addShape("roundRect", {
      x: m,
      y: y + 0.05,
      w: 0.16,
      h: 0.16,
      fill: { color: theme.colors.accent },
      line: { type: "none" },
      rectRadius: 0.03,
    });

    const runs = [];
    if (it.strong) {
      runs.push(...parseRich(it.strong, theme, { fontSize: 14, bold: true, color: theme.colors.primary }));
      if (it.subtext) runs[runs.length - 1].options.breakLine = true;
    }
    if (it.subtext) {
      runs.push(...parseRich(it.subtext, theme, { fontSize: 12, color: theme.colors.subtle }));
    }

    slide.addText(runs, {
      x: m + 0.3,
      y,
      w: w - 0.3,
      h: rowH,
      valign: "top",
      lineSpacingMultiple: 1.15,
    });
  });
};
