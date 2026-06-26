// bleed-image: 本文 + 画像。
// 原則「外部送信なし・ローカル完結」のため外部画像 URL は取得せず、右側はプレースホルダ枠にする。
// content = { paragraphs?: [], highlight_quote?, subtext?, html_list?: [] }
const { header, usableW, panel, parseRich, CONTENT_BOTTOM } = require("./_deck");

module.exports = function bleedImage(pptx, slide, theme, data) {
  const m = theme.margin;
  const w = usableW(theme);
  const top = header(slide, theme, data);
  const c = data.content || {};

  const gap = 0.35;
  const textW = w * 0.6;
  const imgX = m + textW + gap;
  const imgW = w - textW - gap;

  // 本文 run を組み立てる。
  const runs = [];
  const push = (html, b) => {
    if (!html) return;
    if (runs.length) runs[runs.length - 1].options.breakLine = true;
    runs.push(...parseRich(html, theme, Object.assign({ fontSize: 13, color: theme.colors.text }, b)));
  };

  (Array.isArray(c.paragraphs) ? c.paragraphs : []).forEach((p) => push(p));
  if (c.highlight_quote) push(c.highlight_quote, { fontSize: 16, bold: true, color: theme.colors.accent });
  if (c.subtext) push(c.subtext, { fontSize: 12, color: theme.colors.subtle });
  (Array.isArray(c.html_list) ? c.html_list : []).forEach((li) => push(li));

  slide.addText(runs.length ? runs : [{ text: "", options: {} }], {
    x: m, y: top, w: textW, h: CONTENT_BOTTOM - top, valign: "top", lineSpacingMultiple: 1.22,
  });

  // 画像プレースホルダ。
  panel(pptx, slide, theme, { x: imgX, y: top, w: imgW, h: CONTENT_BOTTOM - top }, {
    fill: theme.colors.panelBg, borderColor: theme.colors.cardBorder,
  });
  slide.addText(
    [
      { text: "🖼", options: { fontSize: 28, color: theme.colors.faint, breakLine: true } },
      { text: "画像（外部URL・省略）", options: { fontSize: 11, color: theme.colors.faint, breakLine: true } },
      { text: data.image_alt || "", options: { fontSize: 10, italic: true, color: theme.colors.faint } },
    ],
    { x: imgX + 0.15, y: top, w: imgW - 0.3, h: CONTENT_BOTTOM - top, align: "center", valign: "middle" }
  );
};
