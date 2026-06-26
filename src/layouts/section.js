// section レイアウト（区切り + 本文ブロック）。
// 対応データ: title, message, elements[] の slot=main_message_area の content。
// 本文を薄いカード地の上に配置し、節としての区切り感を出す。
const { header, inSlot, addCard, asArray } = require("./_shared");

module.exports = function section(pptx, slide, data, theme) {
  const m = theme.margin;
  const w = theme.layout.width - 2 * m;
  const top = header(slide, data, theme);

  const main = inSlot(data.elements, "main_message_area")[0] ||
    asArray(data.elements).find((e) => e && e.text);
  if (!main) return;

  addCard(pptx, slide, theme, main.text, {
    x: m,
    y: top,
    w,
    h: 5.0 - top,
    fontSize: 14,
  });
};
