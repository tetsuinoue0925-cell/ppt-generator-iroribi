// title-slide（表紙）テンプレ準拠: 右上ロゴ + 大きめプレーンタイトル + 右下に小さな茶色社名ボックス。
// content = { h1, subtitle?, date?, company? }
const fs = require("fs");
const { usableW, LOGO_PATH } = require("./_deck");

module.exports = function titleSlide(pptx, slide, theme, data) {
  const m = theme.margin;
  const w = usableW(theme);
  const W = theme.layout.width;
  const c = data.content || {};
  const band = theme.colors.band || theme.colors.primary;

  // 右上ロゴ（テンプレと同じ、上にややブリード）。
  if (fs.existsSync(LOGO_PATH)) {
    slide.addImage({ path: LOGO_PATH, x: 8.57, y: -0.11, w: 1.35, h: 1.35 });
  }

  // タイトル（プレーンな大きい文字。帯にしない）。
  slide.addText(c.h1 || data.title || "", {
    x: 0.3, y: 2.0, w: 9.0, h: 1.5,
    fontFace: theme.fonts.heading, fontSize: 32, bold: true, color: theme.colors.primary,
    align: "left", valign: "middle",
  });

  // サブタイトル（タイトル下）。
  if (c.subtitle) {
    slide.addText(c.subtitle, {
      x: 0.32, y: 3.55, w: 8.0, h: 0.5,
      fontFace: theme.fonts.body, fontSize: 15, color: theme.colors.subtle, valign: "top",
    });
  }

  // 日付（左下）。
  if (c.date) {
    slide.addText(c.date, {
      x: 0.32, y: 4.75, w: 4.0, h: 0.35,
      fontFace: theme.fonts.body, fontSize: 12, color: theme.colors.faint,
    });
  }

  // 右下の茶色社名ボックス（テンプレ準拠）。
  const company = c.company || "株式会社 Iroribi";
  slide.addShape("rect", { x: 7.55, y: 4.62, w: 2.0, h: 0.4, fill: { color: band }, line: { type: "none" } });
  slide.addText(company, {
    x: 7.55, y: 4.62, w: 2.0, h: 0.4,
    fontFace: theme.fonts.body, fontSize: 13, bold: true, color: "FFFFFF",
    align: "center", valign: "middle",
  });
};
