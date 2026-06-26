// cards_3 レイアウト（3カード比較）。
// 使うデータ: title, elements.cards[] ({ title, body }) 最大3
module.exports = function cards3(pptx, slide, data, theme) {
  const m = theme.margin;
  const w = theme.layout.width - 2 * m;

  slide.addText(data.title || "", {
    x: m,
    y: 0.5,
    w,
    h: 0.6,
    fontFace: theme.fonts.heading,
    fontSize: 22,
    bold: true,
    color: theme.colors.primary,
  });

  const cards = (data.elements && data.elements.cards) || [];
  const n = Math.min(cards.length, 3);
  if (!n) return;

  const gap = 0.3;
  const cardW = (w - gap * (3 - 1)) / 3;
  const cardY = 1.7;
  const cardH = 3.0;

  for (let i = 0; i < n; i++) {
    const x = m + i * (cardW + gap);

    slide.addShape(pptx.ShapeType.roundRect, {
      x,
      y: cardY,
      w: cardW,
      h: cardH,
      fill: { color: theme.colors.cardBg },
      line: { color: theme.colors.cardBorder, width: 1 },
      rectRadius: 0.08,
    });

    slide.addText(cards[i].title || "", {
      x: x + 0.2,
      y: cardY + 0.2,
      w: cardW - 0.4,
      h: 0.6,
      fontFace: theme.fonts.heading,
      fontSize: 16,
      bold: true,
      color: theme.colors.accent,
    });

    slide.addText(cards[i].body || "", {
      x: x + 0.2,
      y: cardY + 0.9,
      w: cardW - 0.4,
      h: cardH - 1.1,
      fontFace: theme.fonts.body,
      fontSize: 13,
      color: theme.colors.text,
      valign: "top",
    });
  }
};
