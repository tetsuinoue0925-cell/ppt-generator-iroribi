// summary レイアウト（まとめ・決定事項）。
// 対応データ: title, message, elements[] の slot=main_message_area の content（強調表示）。
// 本文をアクセント帯付きのカード上に配置して「結論」感を出す。
const { header, inSlot, asArray, addCard } = require("./_shared");

module.exports = function summary(pptx, slide, data, theme) {
  const m = theme.margin;
  const w = theme.layout.width - 2 * m;
  const top = header(slide, data, theme);

  const main = inSlot(data.elements, "main_message_area")[0] ||
    asArray(data.elements).find((e) => e && e.text);
  if (!main) return;

  const y = top;
  const h = 5.0 - top;

  // 左端のアクセント帯。
  slide.addShape(pptx.ShapeType.rect, {
    x: m,
    y,
    w: 0.12,
    h,
    fill: { color: theme.colors.accent },
    line: { type: "none" },
  });

  addCard(pptx, slide, theme, main.text, {
    x: m + 0.12,
    y,
    w: w - 0.12,
    h,
    fontSize: 15,
  });
};
