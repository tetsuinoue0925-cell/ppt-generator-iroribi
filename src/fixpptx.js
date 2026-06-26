// pptxgenjs 3.12.0 の不正 XML を生成後に補正する。
//
// バグ: 箇条書きでない run には常に `<a:pPr indent="0" marL="0"><a:buNone/></a:pPr>` が付き、
// しかも 1 段落（<a:p>）内の各 run ごとに繰り返される。OOXML では <a:pPr> は段落の先頭に
// 1 回だけ許される。run の直後（</a:r> の後）に現れる <a:pPr> は不正で、PowerPoint が
// 「修復 → 一部削除」する。文中に太字（複数 run の行）を入れると必ず発生する。
//
// 対策: <a:r> の直後に現れる <a:pPr ...>...</a:pPr>（または自己終了形）を取り除く。
// 正当な <a:pPr> は必ず <a:p> の直後に来るので、`</a:r>` 直後の pPr だけを安全に除去できる。
const fs = require("fs");
const JSZip = require("jszip");

// XML 文字列から、run 直後の不正 <a:pPr> を除去する。
function fixParagraphProps(xml) {
  return xml
    .replace(/<\/a:r><a:pPr\b[^>]*>.*?<\/a:pPr>/g, "</a:r>")
    .replace(/<\/a:r><a:pPr\b[^>]*\/>/g, "</a:r>");
}

// 補正対象のパート（スライド・レイアウト・マスター・ノート）。
function isTargetPart(path) {
  return /ppt\/(slides|slideLayouts|slideMasters|notesSlides)\/[^/]+\.xml$/.test(path);
}

// 右端の縦グラデ帯シェイプの XML。pptxgenjs はグラデ塗りを出せないため後処理で注入する。
// 幅 0.079in・全高、右端ぴったり（テンプレ reference/デザインテンプレ用.pptx 由来の座標）。
function edgeBandSp(edge) {
  const c1 = edge.grad[0];
  const c2 = edge.grad[1];
  const ang = edge.ang || 18900044;
  return (
    '<p:sp><p:nvSpPr><p:cNvPr id="900" name="EdgeBand"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>' +
    '<p:spPr><a:xfrm><a:off x="9071812" y="0"/><a:ext cx="72188" cy="5143500"/></a:xfrm>' +
    '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>' +
    '<a:gradFill><a:gsLst>' +
    '<a:gs pos="0"><a:srgbClr val="' + c1 + '"/></a:gs>' +
    '<a:gs pos="100000"><a:srgbClr val="' + c2 + '"/></a:gs>' +
    '</a:gsLst><a:lin ang="' + ang + '" scaled="0"/></a:gradFill>' +
    '<a:ln><a:noFill/></a:ln></p:spPr>' +
    '<p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody></p:sp>'
  );
}

// 各スライドの spTree 末尾（</p:spTree> 直前）に帯シェイプを注入する。
function injectEdgeBand(xml, edge) {
  if (!edge || !Array.isArray(edge.grad) || edge.grad.length < 2) return xml;
  return xml.replace("</p:spTree>", edgeBandSp(edge) + "</p:spTree>");
}

// pptx を生成 → 不正 pPr を補正（+ 任意で右端グラデ帯を注入）→ outputPath に書き出す。
// opts.edge を渡すと各スライドに縦グラデ帯を注入する。補正件数を返す。
async function writeFixed(pptx, outputPath, opts) {
  opts = opts || {};
  const buf = await pptx.write({ outputType: "nodebuffer" });
  const zip = await JSZip.loadAsync(buf);

  let fixedCount = 0;
  const paths = Object.keys(zip.files).filter(isTargetPart);
  for (const p of paths) {
    let xml = await zip.file(p).async("string");
    const before = (xml.match(/<\/a:r><a:pPr\b/g) || []).length;
    let changed = false;
    if (before > 0) {
      xml = fixParagraphProps(xml);
      fixedCount += before;
      changed = true;
    }
    // 帯はスライド本体にのみ注入。
    if (opts.edge && /ppt\/slides\/slide\d+\.xml$/.test(p)) {
      const next = injectEdgeBand(xml, opts.edge);
      if (next !== xml) { xml = next; changed = true; }
    }
    if (changed) zip.file(p, xml);
  }

  const out = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  });
  fs.writeFileSync(outputPath, out);
  return fixedCount;
}

module.exports = { writeFixed, fixParagraphProps, injectEdgeBand };
