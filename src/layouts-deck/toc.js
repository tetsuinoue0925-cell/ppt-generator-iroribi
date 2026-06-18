// toc（目次）テンプレ準拠: コーラルの番号スクエア + 章タイトル + オレンジ下線。
// content = { title?, items: ["章タイトル", ...] または [{ title }] }
const fs = require("fs");
const { usableW, parseRich, cornerLogo, LOGO_PATH, CONTENT_BOTTOM } = require("./_deck");

module.exports = function toc(pptx, slide, theme, data) {
  const m = theme.margin;
  const w = usableW(theme);
  const square = theme.colors.bar || theme.colors.accent; // 番号スクエア（コーラル）
  const underline = theme.colors.accent; // 下線（オレンジ）

  cornerLogo(slide, theme);

  const raw = (data.content && data.content.items) || [];
  const items = raw.map((it) => (typeof it === "string" ? it : it.title || ""));
  if (!items.length) return;

  // 見出し（既定「目次」。content.title で上書き可）。
  const heading = (data.content && data.content.title) || "目次";
  slide.addText(heading, {
    x: m, y: 0.4, w: w - 0.9, h: 0.4,
    fontFace: theme.fonts.heading, fontSize: 18, bold: true, color: theme.colors.primary,
  });
  // 見出し下のアクセント下線（本文ページのヘッダと色味を合わせる）。
  slide.addShape("rect", {
    x: m, y: 0.86, w: 0.9, h: 0.03,
    fill: { color: theme.colors.accent }, line: { type: "none" },
  });
  let top = 1.2;

  const n = items.length;
  const rowH = (CONTENT_BOTTOM - top) / n;
  const sq = Math.min(0.72, rowH * 0.62);
  const textX = m + sq + 0.35;

  items.forEach((text, i) => {
    const cy = top + i * rowH + (rowH - sq) / 2; // スクエアの上端（行内で縦中央）
    // 番号スクエア
    slide.addShape("rect", { x: m, y: cy, w: sq, h: sq, fill: { color: square }, line: { type: "none" } });
    slide.addText(String(i + 1), {
      x: m, y: cy, w: sq, h: sq,
      fontFace: theme.fonts.heading, fontSize: 22, bold: true, color: "FFFFFF",
      align: "center", valign: "middle",
    });
    // 章タイトル
    slide.addText(parseRich(text, theme, { fontSize: 16, bold: true, color: theme.colors.primary }), {
      x: textX, y: cy - 0.05, w: w - (textX - m) - 0.1, h: sq, valign: "middle",
    });
    // オレンジ下線（テキスト下）
    slide.addShape("rect", {
      x: textX, y: cy + sq - 0.02, w: w - (textX - m) - 0.5, h: 0.03,
      fill: { color: underline }, line: { type: "none" },
    });
  });
};
