// message レイアウト（1メッセージ + 補足）。
// 使うデータ: title, message, elements.bullets[]
module.exports = function message(pptx, slide, data, theme) {
  const m = theme.margin;
  const w = theme.layout.width - 2 * m;

  // 小見出し（スライドタイトル）
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

  // 主張（1メッセージ）
  if (data.message) {
    slide.addText(data.message, {
      x: m,
      y: 1.25,
      w,
      h: 1.1,
      fontFace: theme.fonts.heading,
      fontSize: 28,
      bold: true,
      color: theme.colors.text,
      valign: "top",
    });
  }

  // 補足の箇条書き
  const bullets = (data.elements && data.elements.bullets) || [];
  if (bullets.length) {
    slide.addText(
      bullets.map((b) => ({
        text: b,
        options: {
          bullet: { code: "2022" },
          fontSize: 16,
          color: theme.colors.text,
          fontFace: theme.fonts.body,
          paraSpaceAfter: 8,
        },
      })),
      { x: m, y: 2.5, w, h: 2.3, valign: "top" }
    );
  }
};
