// two-column-mixed: 左右で性質の異なる2カラム（コード/チェックリスト/本文など）。
// content = { pre_text?, left_column, right_column }
const { header, usableW, parseRich, stripHtml, renderColumnContent, CONTENT_BOTTOM } = require("./_deck");

module.exports = function twoColumnMixed(pptx, slide, theme, data) {
  const m = theme.margin;
  const w = usableW(theme);
  let top = header(slide, theme, data);
  const c = data.content || {};

  if (c.pre_text && stripHtml(c.pre_text)) {
    slide.addText(parseRich(c.pre_text, theme, { fontSize: 12, color: theme.colors.subtle }), {
      x: m, y: top, w, h: 0.4, valign: "top",
    });
    top += 0.5;
  }

  const gap = 0.35;
  const colW = (w - gap) / 2;
  const colH = CONTENT_BOTTOM - top;

  renderColumnContent(pptx, slide, theme, c.left_column || {}, {
    x: m, y: top, w: colW, h: colH, panel: true,
  });
  renderColumnContent(pptx, slide, theme, c.right_column || {}, {
    x: m + colW + gap, y: top, w: colW, h: colH, panel: true,
  });
};
