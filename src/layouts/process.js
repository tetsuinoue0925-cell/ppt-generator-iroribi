// process レイアウト（手順フロー + 補足ノート）。
// 対応データ:
//   - elements[] の slot=top, type=shape（role=step_1..step_N）を横並びのシェブロンで描画
//   - elements[] の slot=bottom, type=card（補足ノート）をその下に描画
const { header, inSlot, asArray, addCard } = require("./_shared");

module.exports = function process(pptx, slide, data, theme) {
  const m = theme.margin;
  const w = theme.layout.width - 2 * m;
  const top = header(slide, data, theme);

  // ステップ（role=step_* を昇順、無ければ slot=top の shape を並び順で）。
  let steps = asArray(data.elements)
    .filter((e) => e && e.slot === "top" && (e.type === "shape" || /^step/.test(e.role || "")))
    .sort((a, b) => String(a.role).localeCompare(String(b.role), undefined, { numeric: true }));
  if (!steps.length) {
    steps = asArray(data.elements).filter((e) => e && e.type === "shape");
  }

  const stepY = top + 0.1;
  const stepH = 0.85;
  if (steps.length) {
    const gap = 0.12;
    const sw = (w - gap * (steps.length - 1)) / steps.length;
    steps.forEach((s, i) => {
      const high = s.style && s.style.emphasis === "high";
      slide.addShape(pptx.ShapeType.chevron, {
        x: m + i * (sw + gap),
        y: stepY,
        w: sw,
        h: stepH,
        fill: { color: high ? theme.colors.primary : theme.colors.accent },
        line: { type: "none" },
      });
      slide.addText(s.text || "", {
        x: m + i * (sw + gap),
        y: stepY,
        w: sw,
        h: stepH,
        fontFace: theme.fonts.body,
        fontSize: 11,
        bold: true,
        color: "FFFFFF",
        align: "center",
        valign: "middle",
      });
    });
  }

  // 補足ノート（slot=bottom の card）。
  const note = inSlot(data.elements, "bottom")[0] ||
    asArray(data.elements).find((e) => e && e.type === "card");
  if (note) {
    const noteY = stepY + stepH + 0.25;
    addCard(pptx, slide, theme, note.text, {
      x: m,
      y: noteY,
      w,
      h: Math.max(0.8, 5.0 - noteY),
      fontSize: 13,
    });
  }
};
