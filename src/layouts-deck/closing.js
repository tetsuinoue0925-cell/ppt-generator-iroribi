// closing（締め）テンプレ準拠: 中央に大きなロゴのみ。末尾に毎回挿入する想定。
// content = { subtitle? }（任意の補足。通常は何も持たせず、ロゴ1点のみ）
const fs = require("fs");
const { usableW } = require("./_deck");

const LOGO_PATH = "assets/logo.png";
const LOGO_SIZE = 3.0; // 正方形ロゴ（810x810）。上下左右センター配置。

module.exports = function closing(pptx, slide, theme, data) {
  const m = theme.margin;
  const w = usableW(theme);
  const W = theme.layout.width;
  const H = theme.layout.height;
  const c = data.content || {};

  // 中央ロゴ（大）。フッター(≈5.2)を避け、内容領域でセンタリング。
  if (fs.existsSync(LOGO_PATH)) {
    slide.addImage({
      path: LOGO_PATH,
      x: (W - LOGO_SIZE) / 2,
      y: (H - 0.45 - LOGO_SIZE) / 2, // フッター分(0.45)を差し引いた領域の中央
      w: LOGO_SIZE,
      h: LOGO_SIZE,
    });
  }

  // 任意の補足メッセージ（指定時のみ。ロゴ下に小さく）。
  if (c.subtitle) {
    slide.addText(c.subtitle, {
      x: m, y: H - 1.0, w, h: 0.4,
      fontFace: theme.fonts.body, fontSize: 13, color: theme.colors.subtle, align: "center",
    });
  }
};
