// title レイアウト（表紙）。
// 対応データ:
//   - オブジェクト形式: title, elements.subtitle
//   - 配列形式: elements[] の role=title / subtitle / info, type=icon_placeholder(logo)
const { asArray } = require("./_shared");

module.exports = function title(pptx, slide, data, theme) {
  const m = theme.margin;
  const w = theme.layout.width - 2 * m;

  const els = asArray(data.elements);
  const byRole = (role) => els.find((e) => e && e.role === role);

  // 配列形式があればそれを優先、無ければオブジェクト形式へフォールバック。
  const titleText =
    (byRole("title") && byRole("title").text) || data.title || "";
  const subtitleText =
    (byRole("subtitle") && byRole("subtitle").text) ||
    (data.elements && data.elements.subtitle) ||
    "";
  const infoText = byRole("info") && byRole("info").text;
  const logo = els.find((e) => e && (e.role === "logo" || e.type === "icon_placeholder"));

  // ロゴはプレースホルダ枠で示す（画像化はしない）。
  if (logo) {
    slide.addText(logo.text || "LOGO", {
      x: m,
      y: 0.9,
      w,
      h: 0.6,
      fontFace: theme.fonts.body,
      fontSize: 12,
      color: theme.colors.subtle,
      align: "center",
    });
  }

  slide.addText(titleText, {
    x: m,
    y: 1.9,
    w,
    h: 1.3,
    fontFace: theme.fonts.heading,
    fontSize: 40,
    bold: true,
    color: theme.colors.primary,
    align: "center",
    valign: "middle",
  });

  if (subtitleText) {
    slide.addText(subtitleText, {
      x: m,
      y: 3.25,
      w,
      h: 1.0,
      fontFace: theme.fonts.body,
      fontSize: 18,
      color: theme.colors.subtle,
      align: "center",
      valign: "top",
    });
  }

  if (infoText) {
    slide.addText(infoText, {
      x: m,
      y: 4.55,
      w,
      h: 0.5,
      fontFace: theme.fonts.body,
      fontSize: 11,
      color: theme.colors.subtle,
      align: "center",
    });
  }
};
