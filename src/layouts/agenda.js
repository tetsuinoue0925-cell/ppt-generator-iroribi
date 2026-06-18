// agenda レイアウト（アジェンダ一覧）。
// 対応データ: title, message, elements[] の slot=main_message_area の content（改行区切りの項目列）。
const { header, inSlot, addBody, asArray } = require("./_shared");

module.exports = function agenda(pptx, slide, data, theme) {
  const m = theme.margin;
  const w = theme.layout.width - 2 * m;
  const top = header(slide, data, theme);

  // main_message_area の本文を取得。無ければ配列の先頭テキストを使う。
  const main = inSlot(data.elements, "main_message_area")[0] ||
    asArray(data.elements).find((e) => e && e.text);
  if (!main) return;

  addBody(slide, theme, main.text, {
    x: m,
    y: top,
    w,
    h: 5.0 - top,
    fontSize: 16,
    lineSpacingMultiple: 1.3,
  });
};
