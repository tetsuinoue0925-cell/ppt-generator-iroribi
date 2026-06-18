// section-title: 章区切り。content = { h2, p }
const { usableW, cornerLogo } = require("./_deck");

module.exports = function sectionTitle(pptx, slide, theme, data) {
  const m = theme.margin;
  const w = usableW(theme);
  const c = data.content || {};

  cornerLogo(slide, theme);

  slide.addText(c.h2 || data.title || "", {
    x: m,
    y: 1.9,
    w,
    h: 1.0,
    fontFace: theme.fonts.heading,
    fontSize: 30,
    bold: true,
    color: theme.colors.primary,
    align: "left",
    valign: "middle",
  });

  // アクセント下線。
  slide.addShape("rect", {
    x: m,
    y: 2.95,
    w: 2.4,
    h: 0.045,
    fill: { color: theme.colors.accent },
    line: { type: "none" },
  });

  if (c.p) {
    slide.addText(c.p, {
      x: m,
      y: 3.2,
      w,
      h: 0.6,
      fontFace: theme.fonts.body,
      fontSize: 16,
      color: theme.colors.subtle,
      valign: "top",
    });
  }
};
