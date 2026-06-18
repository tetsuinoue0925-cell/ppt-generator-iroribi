// cards_4 レイアウト（4カード）。
// 対応データ: title, message, elements[] の slot=card_1..card_4（type=card）。
const { header, inSlot, asArray, addCard } = require("./_shared");

module.exports = function cards_4(pptx, slide, data, theme) {
  const m = theme.margin;
  const w = theme.layout.width - 2 * m;
  const top = header(slide, data, theme);

  // card_1..card_4 を順に拾い、無ければ card 型を並び順で補う。
  let cards = [];
  for (let i = 1; i <= 4; i++) {
    const c = inSlot(data.elements, `card_${i}`)[0];
    if (c) cards.push(c);
  }
  if (!cards.length) {
    cards = asArray(data.elements).filter((e) => e && e.type === "card").slice(0, 4);
  }
  const n = cards.length;
  if (!n) return;

  const gap = 0.25;
  const cardW = (w - gap * (n - 1)) / n;
  const cardH = Math.min(3.0, 5.0 - top);
  const y = top + (5.0 - top - cardH) / 2;

  cards.forEach((c, i) => {
    addCard(pptx, slide, theme, c.text, {
      x: m + i * (cardW + gap),
      y,
      w: cardW,
      h: cardH,
      fontSize: 11,
    });
  });
};
