// HTML 断片 → PptxGenJS リッチテキスト変換。
//
// 重要原則: HTML はレンダリングしない。<strong>/<code>/<span style=color> 等の
// 「装飾意図」だけを PptxGenJS の text-run 配列（{ text, options }）へ移植する。
// 解釈する要素:
//   <strong>/<b>          → 太字
//   <em>/<i>(テキスト)     → 斜体（<i class="fa-..."> アイコンは除去）
//   <code>                → 等幅フォント
//   <br>                  → 改行
//   <p>/<li>/<h3>/<div>   → 段落（改行）。<li> は行頭にマーカ
//   style="color:#xxx"    → 文字色
//   class="text-gradient" → アクセント色（グラデは単色化）
//   その他のタグ           → 除去（中身テキストは残す）

function decode(s) {
  return String(s)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

// 開きタグ文字列から、このタグが与えるスタイル差分を作る。
function frameFor(tagName, raw, theme) {
  const n = tagName.toLowerCase();
  const f = {};
  if (n === "strong" || n === "b") f.bold = true;
  else if (n === "em") f.italic = true;
  else if (n === "code") {
    f.fontFace = "Consolas";
    f.color = theme.colors.code || theme.colors.subtle;
  } else if (n === "h3") {
    f.bold = true;
    f.color = theme.colors.accent;
  }

  const styleAttr = (raw.match(/style\s*=\s*"([^"]*)"/i) || [])[1] || "";
  const colorM = styleAttr.match(/color\s*:\s*#?([0-9a-fA-F]{6})/);
  if (colorM) f.color = colorM[1].toUpperCase();
  if (/text-gradient/.test(raw)) f.color = theme.colors.accent;
  if (/font-weight\s*:\s*bold|font-weight\s*:\s*700/.test(styleAttr)) f.bold = true;
  return f;
}

// html → [{ text, options }] の run 配列。base で既定スタイルを与える。
function parseRich(html, theme, base) {
  base = Object.assign({ fontFace: theme.fonts.body }, base || {});
  if (html == null || html === "") return [{ text: "", options: base }];

  let s = String(html);
  // 改行系を \n に正規化。
  s = s.replace(/<\s*br\s*\/?>/gi, "\n");
  s = s.replace(/<\/\s*(p|div|h1|h2|h3|h4|ul|ol)\s*>/gi, "\n");
  s = s.replace(/<\s*li[^>]*>/gi, "\n• ");
  s = s.replace(/<\/\s*li\s*>/gi, "");
  // Font Awesome 等のアイコンは除去。
  s = s.replace(/<\s*i\b[^>]*>(\s*)<\/\s*i\s*>/gi, "");
  s = s.replace(/<\s*i\b[^>]*>/gi, "");

  const runs = [];
  const frames = [];
  const merged = () => Object.assign({}, base, ...frames);
  const addBreak = () => {
    if (runs.length) runs[runs.length - 1].options.breakLine = true;
  };

  // タグとテキストに分割。
  const tokens = s.split(/(<[^>]+>)/);
  for (const tok of tokens) {
    if (!tok) continue;
    if (tok[0] === "<") {
      const m = tok.match(/^<\s*(\/?)\s*([a-zA-Z0-9]+)/);
      if (!m) continue;
      const isClose = m[1] === "/";
      const name = m[2];
      if (isClose) {
        if (frames.length) frames.pop();
      } else if (!/\/\s*>$/.test(tok)) {
        // 自己終了タグ以外はフレームを積む。
        frames.push(frameFor(name, tok, theme));
      }
    } else {
      const text = decode(tok);
      const parts = text.split("\n");
      parts.forEach((p, i) => {
        if (i > 0) addBreak();
        if (p === "") return;
        runs.push({ text: p, options: merged() });
      });
    }
  }

  if (!runs.length) return [{ text: "", options: base }];
  return runs;
}

// すべてのタグを除去してプレーンテキスト化（テーブルセル等で使用）。
function stripHtml(html) {
  if (html == null) return "";
  let s = String(html)
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/\s*(p|li|h3|div|h2)\s*>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  return decode(s)
    .split("\n")
    .map((l) => l.trim())
    .filter((l, i, a) => !(l === "" && a[i - 1] === ""))
    .join("\n")
    .trim();
}

module.exports = { parseRich, stripHtml, decode };
