// table: 表。content = { pre_text?, headers: [], rows: [{ style, cells: [] }], footer? }
// 行 style の background-color はハイライト行として反映。セル内 HTML は装飾移植。
const { header, usableW, parseRich, stripHtml, CONTENT_BOTTOM } = require("./_deck");

// "background-color: #FFF3E0" → "FFF3E0"
function bgOf(style) {
  const m = String(style || "").match(/background-color\s*:\s*#?([0-9a-fA-F]{6})/);
  return m ? m[1].toUpperCase() : null;
}
function fgOf(style) {
  const m = String(style || "").match(/(?:^|;)\s*color\s*:\s*#?([0-9a-fA-F]{6})/);
  return m ? m[1].toUpperCase() : null;
}

module.exports = function table(pptx, slide, theme, data) {
  const m = theme.margin;
  const w = usableW(theme);
  let top = header(slide, theme, data);
  const c = data.content || {};

  if (c.pre_text && stripHtml(c.pre_text)) {
    slide.addText(parseRich(c.pre_text, theme, { fontSize: 12, color: theme.colors.subtle }), {
      x: m,
      y: top,
      w,
      h: 0.4,
      valign: "top",
    });
    top += 0.5;
  }

  // 正規化: rows が「配列の配列」形式の場合、先頭行をヘッダとして分離する。
  let rawRows = Array.isArray(c.rows) ? c.rows : [];
  let headers = Array.isArray(c.headers) ? c.headers : [];
  if (!headers.length && rawRows.length && Array.isArray(rawRows[0])) {
    headers = rawRows[0];
    rawRows = rawRows.slice(1);
  }
  const rows = rawRows.map((r) => (Array.isArray(r) ? { cells: r } : r));

  // フッター用に下を確保。
  let bottom = CONTENT_BOTTOM;
  if (c.footer && stripHtml(c.footer)) bottom -= 0.7;

  // 列幅: 先頭が "#"/"区分" 等の短ラベルなら狭める。
  const colCount = headers.length || (rows[0] && rows[0].cells && rows[0].cells.length) || 1;
  const colW = [];
  const firstNarrow = headers.length && stripHtml(headers[0]).length <= 2;
  if (firstNarrow) {
    const rest = (w - 0.55) / (colCount - 1);
    for (let i = 0; i < colCount; i++) colW.push(i === 0 ? 0.55 : rest);
  } else {
    for (let i = 0; i < colCount; i++) colW.push(w / colCount);
  }

  const tableRows = [];

  // ヘッダ行。
  if (headers.length) {
    tableRows.push(
      headers.map((h) => ({
        text: stripHtml(h),
        options: {
          bold: true,
          color: theme.colors.primary,
          fill: { color: theme.colors.panelBg },
          fontFace: theme.fonts.heading,
          fontSize: 11,
          valign: "middle",
          align: "left",
          border: [
            { type: "solid", color: theme.colors.primary, pt: 1.5 },
            { type: "none" },
            { type: "solid", color: theme.colors.primary, pt: 1.5 },
            { type: "none" },
          ],
        },
      }))
    );
  }

  // データ行。
  rows.forEach((r) => {
    const fill = bgOf(r.style) || "FFFFFF";
    const fg = fgOf(r.style);
    const cells = Array.isArray(r.cells) ? r.cells : [];
    tableRows.push(
      cells.map((cell) => ({
        text: parseRich(cell, theme, {
          fontSize: 10.5,
          color: fg || theme.colors.text,
        }),
        options: {
          fill: { color: fill },
          valign: "middle",
          align: "left",
          margin: [2, 4, 2, 4],
        },
      }))
    );
  });

  if (!tableRows.length) return;

  slide.addTable(tableRows, {
    x: m,
    y: top,
    w,
    colW,
    border: { type: "solid", color: theme.colors.cardBorder, pt: 0.5 },
    fontFace: theme.fonts.body,
    valign: "middle",
    autoPage: false,
    h: Math.max(0.5, bottom - top),
  });

  if (c.footer && stripHtml(c.footer)) {
    slide.addText(parseRich(c.footer, theme, { fontSize: 11, color: theme.colors.subtle }), {
      x: m,
      y: bottom + 0.1,
      w,
      h: 0.55,
      valign: "top",
    });
  }
};
