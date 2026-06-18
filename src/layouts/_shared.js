// レイアウト共通ヘルパ。
// 配列形式 elements（{ type, role, text, slot, style }）を扱うための小道具と、
// 全レイアウト共通のヘッダ描画・テキスト/カード描画をまとめる。
//
// 重要原則: 配色・フォントは theme.js を一元利用する。
// JSON 側の theme/style.color は使わない。style は「強調度・サイズ・整列」のヒントとしてのみ解釈する。

// elements が配列形式ならそのまま、そうでなければ空配列を返す。
function asArray(elements) {
  return Array.isArray(elements) ? elements : [];
}

// 指定 slot の要素だけを順序保持で取り出す。
function inSlot(elements, slot) {
  return asArray(elements).filter((e) => e && e.slot === slot);
}

// font_size_hint を pt に解決する。hint 無指定時は fallback。
function fontSize(style, fallback) {
  const map = { large: 28, medium: 14, small: 11 };
  const hint = style && style.font_size_hint;
  return (hint && map[hint]) || fallback;
}

// style.align を解決（無指定は left）。
function alignOf(style, fallback) {
  return (style && style.align) || fallback || "left";
}

// 行数からおおまかな高さ(inch)を見積もる。配列形式は明示座標がないため簡易見積りで縦積みする。
function estHeight(text, perLine, pad) {
  const lines = String(text || "").split("\n").length;
  return Math.max(0.4, lines * (perLine || 0.26) + (pad || 0.12));
}

// 共通ヘッダ（スライドタイトル + リード文 message）。
// 戻り値は本文を描き始める Y 座標(inch)。
function header(slide, data, theme) {
  const m = theme.margin;
  const w = theme.layout.width - 2 * m;

  slide.addText(data.title || "", {
    x: m,
    y: 0.4,
    w,
    h: 0.6,
    fontFace: theme.fonts.heading,
    fontSize: 22,
    bold: true,
    color: theme.colors.primary,
    valign: "middle",
  });

  if (data.message) {
    slide.addText(data.message, {
      x: m,
      y: 1.05,
      w,
      h: 0.7,
      fontFace: theme.fonts.body,
      fontSize: 14,
      color: theme.colors.subtle,
      valign: "top",
    });
    return 1.85;
  }
  return 1.25;
}

// 本文テキストブロック（改行はそのまま行送りとして保持）。
function addBody(slide, theme, text, opts) {
  slide.addText(String(text || ""), {
    fontFace: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.text,
    valign: "top",
    align: "left",
    lineSpacingMultiple: 1.15,
    ...opts,
  });
}

// 見出し行（列見出しなど）。アクセント色・太字。
function addHeading(slide, theme, text, opts) {
  slide.addText(String(text || ""), {
    fontFace: theme.fonts.heading,
    fontSize: 15,
    bold: true,
    color: theme.colors.accent,
    valign: "middle",
    ...opts,
  });
}

// カード（角丸ボックス + 内側テキスト）。
function addCard(pptx, slide, theme, text, box) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x: box.x,
    y: box.y,
    w: box.w,
    h: box.h,
    fill: { color: theme.colors.cardBg },
    line: { color: theme.colors.cardBorder, width: 1 },
    rectRadius: 0.06,
  });
  slide.addText(String(text || ""), {
    x: box.x + 0.18,
    y: box.y + 0.14,
    w: box.w - 0.36,
    h: box.h - 0.28,
    fontFace: theme.fonts.body,
    fontSize: box.fontSize || 12,
    color: theme.colors.text,
    valign: "top",
    align: box.align || "left",
    lineSpacingMultiple: 1.12,
  });
}

// 列（left_column / right_column）内の要素を上から縦積みで描画する。
// heading → アクセント見出し、card → ボックス、それ以外 → 本文。
function renderColumn(pptx, slide, theme, elements, area) {
  let y = area.y;
  const bottom = area.y + area.h;

  elements.forEach((e) => {
    if (y >= bottom) return;
    const text = (e && e.text) || "";
    const isHeading = e && (e.role === "heading" || (e.style && e.style.emphasis === "high" && e.type === "text" && text.length < 30));

    if (e && e.type === "card") {
      const h = Math.min(estHeight(text, 0.24, 0.34), bottom - y);
      addCard(pptx, slide, theme, text, { x: area.x, y, w: area.w, h, fontSize: 12 });
      y += h + 0.18;
    } else if (isHeading) {
      const h = 0.42;
      // emphasis=high の見出しは強調色（JSON テーマ時のみ存在。無ければ accent）。
      const high = e && e.style && e.style.emphasis === "high";
      const color = high ? theme.colors.highlight || theme.colors.accent : theme.colors.accent;
      addHeading(slide, theme, text, { x: area.x, y, w: area.w, h, fontSize: 14, color });
      y += h + 0.06;
    } else {
      const h = Math.min(estHeight(text, 0.26, 0.1), bottom - y);
      addBody(slide, theme, text, { x: area.x, y, w: area.w, h });
      y += h + 0.16;
    }
  });
}

module.exports = {
  asArray,
  inSlot,
  fontSize,
  alignOf,
  estHeight,
  header,
  addBody,
  addHeading,
  addCard,
  renderColumn,
};
