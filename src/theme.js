// テーマ（ブランド定義の正本）。
// 色・フォント・余白・座標はすべてここを参照する。レイアウト側でハードコードしない。
// 色は PptxGenJS の仕様により # なしの 6 桁 HEX。

const theme = {
  // 16:9。PptxGenJS の座標系は inch。
  layout: { name: "WIDE_16x9", width: 10, height: 5.625 },

  colors: {
    bg: "FFFFFF",
    primary: "1F4E79", // 見出し
    accent: "2E75B6", // カード見出し等のアクセント
    text: "262626", // 本文
    subtle: "595959", // 補助テキスト
    cardBg: "F2F6FB", // カード背景
    cardBorder: "D6E2F0", // カード枠・区切り線
  },

  // 日本語が崩れにくいフォント。PowerPoint(Windows) を想定。
  fonts: { heading: "Meiryo", body: "Meiryo" },

  margin: 0.6, // スライド左右の余白(inch)
};

// スライドマスター定義。背景・フッター区切り線・ページ番号を全スライド共通で持たせる。
// t を渡せばその場限りのテーマで定義できる（JSON テーマ実験用）。既定は正本の theme。
function defineMaster(pptx, t) {
  t = t || theme;
  const w = t.layout.width;
  const m = t.margin;
  pptx.defineSlideMaster({
    title: "MASTER",
    background: { color: t.colors.bg },
    objects: [
      {
        line: {
          x: m,
          y: 5.15,
          w: w - 2 * m,
          h: 0,
          line: { color: t.colors.cardBorder, width: 1 },
        },
      },
    ],
    slideNumber: {
      x: w - 0.8,
      y: 5.2,
      color: t.colors.subtle,
      fontFace: t.fonts.body,
      fontSize: 9,
    },
  });
}

// ---- 以下、JSON テーマ実験用（原則は theme.js 一元管理。THEME_FROM_JSON=1 のときのみ使用）----

// "#5d4037" → "5D4037"。未指定は fallback。
function hex(c, fallback) {
  if (!c || typeof c !== "string") return fallback;
  const m = c.match(/[0-9a-fA-F]{6}/);
  return m ? m[0].toUpperCase() : fallback;
}

// HEX を白方向へ amt(0..1) だけ混ぜて薄くする。
function lighten(h, amt) {
  const n = parseInt(h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const mix = (c) => Math.round(c + (255 - c) * amt);
  return [mix(r), mix(g), mix(b)]
    .map((c) => c.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

// data.theme（AI 設計出力）から、レイアウトが参照するテーマオブジェクトを組み立てる。
// font_policy はメイリオ系を想定して Meiryo に寄せる。
function buildThemeFromJson(data) {
  const t = (data && data.theme) || {};
  const primary = hex(t.primary_color, theme.colors.primary);
  const accent = hex(t.secondary_color, theme.colors.accent);
  const highlight = hex(t.accent_color, accent);
  const policy = String(t.font_policy || "");
  const font = /游ゴ|Yu Gothic/i.test(policy) && !/メイリオ|Meiryo/i.test(policy)
    ? "Yu Gothic"
    : "Meiryo";
  return {
    layout: theme.layout,
    colors: {
      bg: "FFFFFF",
      primary,
      accent,
      highlight, // emphasis=high 用の強調色
      text: "262626",
      subtle: lighten(primary, 0.45),
      cardBg: lighten(accent, 0.85),
      cardBorder: lighten(accent, 0.55),
    },
    fonts: { heading: font, body: font },
    margin: theme.margin,
  };
}

// ---- リッチデッキ形式（presentation/slides[].type）用テーマ ----
// テーマ本体は src/themes/ にレジストリ化（1テーマ=1ファイル）。
// 色・フォントの正本はそれらのファイル（JSON 内のインライン色は装飾移植のみ）。
const { registry, getDeckTheme, listDeckThemes, DEFAULT_DECK_THEME } = require("./themes");
const deckTheme = registry[DEFAULT_DECK_THEME];

// 全ページ共通フッター文言（会社固定。テーマ非依存）。
const COPYRIGHT = "Copyright ©2026 Iroribi Inc. All Rights Reserved.";
const CONFIDENTIAL = "Confidential";

// デッキ用マスター（フッター線 + Copyright左下 + Confidential中央 + ページ番号右下）。
// t 省略時は既定テーマ。フッター3点は全レイアウト共通でここから付与される。
function defineDeckMaster(pptx, t) {
  t = t || deckTheme;
  const w = t.layout.width;
  const m = t.margin;
  const footY = 5.28;
  pptx.defineSlideMaster({
    title: "DECK",
    background: { color: t.colors.bg },
    objects: [
      {
        line: {
          x: m,
          y: 5.2,
          w: w - 2 * m,
          h: 0,
          line: { color: t.colors.cardBorder, width: 1 },
        },
      },
      // Copyright（左下）
      {
        text: {
          text: COPYRIGHT,
          options: {
            x: m,
            y: footY,
            w: 4.5,
            h: 0.25,
            align: "left",
            valign: "middle",
            fontFace: t.fonts.body,
            fontSize: 7,
            color: t.colors.faint,
          },
        },
      },
      // Confidential（中央）
      {
        text: {
          text: CONFIDENTIAL,
          options: {
            x: (w - 2) / 2,
            y: footY,
            w: 2,
            h: 0.25,
            align: "center",
            valign: "middle",
            fontFace: t.fonts.body,
            fontSize: 7,
            color: t.colors.faint,
          },
        },
      },
    ],
    slideNumber: {
      x: w - 1.1,
      y: footY,
      w: 0.85,
      h: 0.25,
      align: "right",
      color: t.colors.faint,
      fontFace: t.fonts.body,
      fontSize: 9,
    },
  });
}

module.exports = {
  theme,
  defineMaster,
  buildThemeFromJson,
  deckTheme,
  getDeckTheme,
  listDeckThemes,
  DEFAULT_DECK_THEME,
  defineDeckMaster,
};
