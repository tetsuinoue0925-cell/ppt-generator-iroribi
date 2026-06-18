// two_column レイアウト（左右2カラム）。
// 対応データ: title, message, elements[] の slot=left_column / right_column。
// 各カラムに heading / content / card を縦積みで描画する。
const { header, inSlot, renderColumn } = require("./_shared");

module.exports = function two_column(pptx, slide, data, theme) {
  const m = theme.margin;
  const w = theme.layout.width - 2 * m;
  const top = header(slide, data, theme);

  const gap = 0.4;
  const colW = (w - gap) / 2;
  const colH = 5.0 - top;

  const left = inSlot(data.elements, "left_column");
  const right = inSlot(data.elements, "right_column");

  renderColumn(pptx, slide, theme, left, { x: m, y: top, w: colW, h: colH });
  renderColumn(pptx, slide, theme, right, {
    x: m + colW + gap,
    y: top,
    w: colW,
    h: colH,
  });
};
