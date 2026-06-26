// リッチデッキ・レイアウト共通ヘルパ。
// 色・フォントは deckTheme を一元利用。値中の HTML 断片は richtext で装飾移植する。
const fs = require("fs");
const { parseRich, stripHtml } = require("../richtext");

const CONTENT_BOTTOM = 5.05; // フッター線(5.2)より上
const LOGO_PATH = "assets/logo.png";

// 右上ロゴ（裏表紙以外の全ページ共通）。グラデ帯(9.92in)に被らない位置。
function cornerLogo(slide, theme) {
  if (fs.existsSync(LOGO_PATH)) {
    slide.addImage({ path: LOGO_PATH, x: theme.layout.width - 0.95, y: 0.16, w: 0.66, h: 0.66 });
  }
}

// 使える本文幅。
function usableW(theme) {
  return theme.layout.width - 2 * theme.margin;
}

// JP 想定のざっくり行数見積り（折返し高さ計算用）。
function estLines(text, charsPerLine) {
  const raw = stripHtml(text);
  const cpl = charsPerLine || 40;
  return raw.split("\n").reduce((acc, l) => acc + Math.max(1, Math.ceil(l.length / cpl)), 0);
}

// 共通ヘッダ（シンプルな見出し + 右上ロゴ）。帯で主張せず、本文幅 2/3 の細いグレー下線を添える。
// 戻り値は本文開始 Y。
function header(slide, theme, data) {
  const m = theme.margin;
  const w = usableW(theme);
  const h = data.header || {};
  const accent = theme.colors.bar || theme.colors.accent;
  const titleW = w - 0.9; // 右上ロゴの逃げ

  cornerLogo(slide, theme);

  let y = 0.46;
  if (h.tag) {
    slide.addText(h.tag.toUpperCase(), {
      x: m, y, w: titleW, h: 0.22,
      fontFace: theme.fonts.heading, fontSize: 9.5, bold: true,
      color: accent, charSpacing: 1, valign: "middle",
    });
    y += 0.25;
  }

  if (h.h2) {
    const lines = Math.min(2, estLines(h.h2, 34));
    const hh = lines * 0.34;
    slide.addText(parseRich(h.h2, theme, { fontSize: 17, bold: true, color: theme.colors.primary }), {
      x: m, y, w: titleW, h: hh + 0.04, valign: "top", lineSpacingMultiple: 1.08,
    });
    y += hh + 0.06;
    // タイトル下線。本文幅の 2/3・細め・落ち着いたグレー（faint）でタイトルに静かに添える。
    slide.addShape("rect", {
      x: m, y, w: w * (2 / 3), h: 0.02, fill: { color: theme.colors.faint }, line: { type: "none" },
    });
    y += 0.12;
  }

  return Math.max(y + 0.16, 1.25);
}

// 角丸パネル。
function panel(pptx, slide, theme, box, opts) {
  opts = opts || {};
  slide.addShape("roundRect", {
    x: box.x,
    y: box.y,
    w: box.w,
    h: box.h,
    fill: { color: opts.fill || theme.colors.panelBg },
    line: opts.border === false ? { type: "none" } : { color: opts.borderColor || theme.colors.cardBorder, width: 1 },
    rectRadius: 0.06,
  });
}

// リッチテキストブロックを配置。
function richBlock(slide, theme, html, box, base) {
  slide.addText(parseRich(html, theme, base), {
    x: box.x,
    y: box.y,
    w: box.w,
    h: box.h,
    valign: box.valign || "top",
    align: box.align || "left",
    lineSpacingMultiple: box.lineSpacingMultiple || 1.18,
  });
}

// style 文字列から背景色 HEX を取り出す。
function bgOf(style) {
  const m = String(style || "").match(/background-color\s*:\s*#?([0-9a-fA-F]{6})/);
  return m ? m[1].toUpperCase() : null;
}

// 1 カラム分の本文 run を組み立てる（pre_text → html → items を改行で連結）。
function columnRuns(col, theme, base) {
  const runs = [];
  const push = (html, b) => {
    if (!html) return;
    if (runs.length) runs[runs.length - 1].options.breakLine = true;
    runs.push(...parseRich(html, theme, Object.assign({}, base, b)));
  };
  if (col.pre_text) push(col.pre_text);
  if (col.description) push(col.description);
  if (col.body) push(col.body);
  if (col.html) push(col.html);
  if (Array.isArray(col.items) && col.items.length) {
    const hasLi = col.items.some((s) => /<\s*li/i.test(String(s)));
    push(col.items.map(String).join(hasLi ? "" : "\n"));
  }
  if (col.features) push(col.features);
  if (col.footer) push(col.footer, { color: theme.colors.subtle, fontSize: 11 });
  if (!runs.length) runs.push({ text: "", options: Object.assign({ fontFace: theme.fonts.body }, base) });
  return runs;
}

// 1 カラム（two-column-mixed / tile）を矩形内に描画する。
function renderColumnContent(pptx, slide, theme, col, box) {
  col = col || {};
  const pad = 0.22;

  // コードブロックは暗パネル + 等幅。
  if (col.type === "code-block") {
    slide.addShape("roundRect", {
      x: box.x, y: box.y, w: box.w, h: box.h,
      fill: { color: theme.colors.codeBg },
      line: { type: "none" },
      rectRadius: 0.05,
    });
    slide.addText(parseRich(col.html, theme, { fontFace: "Consolas", color: theme.colors.codeText, fontSize: 12 }), {
      x: box.x + pad, y: box.y + pad, w: box.w - 2 * pad, h: box.h - 2 * pad,
      valign: "top", lineSpacingMultiple: 1.2,
    });
    return;
  }

  // 背景パネル（style に background-color があるとき、または tile 既定でベージュ）。
  const bg = bgOf(col.style);
  if (bg || box.panel) {
    panel(pptx, slide, theme, box, { fill: bg || theme.colors.panelBg });
  }

  let y = box.y + (bg || box.panel ? pad : 0);
  const ix = box.x + (bg || box.panel ? pad : 0);
  const iw = box.w - (bg || box.panel ? 2 * pad : 0);
  const ib = box.y + box.h - (bg || box.panel ? pad : 0);

  if (col.title) {
    const titleH = 0.5;
    slide.addText(parseRich(col.title, theme, { fontSize: 15, bold: true, color: theme.colors.primary }), {
      x: ix, y, w: iw, h: titleH, valign: "top", lineSpacingMultiple: 1.05,
    });
    y += titleH + 0.06;
  }
  if (col.subtitle) {
    slide.addText(parseRich(col.subtitle, theme, { fontSize: 12, bold: true, color: theme.colors.accent }), {
      x: ix, y, w: iw, h: 0.32, valign: "top",
    });
    y += 0.36;
  }

  slide.addText(columnRuns(col, theme, { fontSize: 12, color: theme.colors.text }), {
    x: ix, y, w: iw, h: Math.max(0.4, ib - y), valign: "top", lineSpacingMultiple: 1.18,
  });

  if (col.footer) {
    // フッターは本文の最下部に重ねず、別行として下に確保が難しいため本文末へ含める運用。
  }
}

module.exports = {
  CONTENT_BOTTOM,
  LOGO_PATH,
  usableW,
  estLines,
  cornerLogo,
  header,
  panel,
  richBlock,
  parseRich,
  stripHtml,
  bgOf,
  columnRuns,
  renderColumnContent,
};
