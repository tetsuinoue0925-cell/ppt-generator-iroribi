// デッキ用テーマのレジストリ。
//
// === 色の役割キー（コントラクト）===
// 新しいテーマを足すときは、必ず以下のキーを全部埋める。これが揃っていれば
// どのレイアウトでもそのテーマで描ける（レイアウト側は役割名でしか色を参照しない）。
//
//   bg          スライド背景
//   primary     見出し・主要テキスト
//   accent      アクセント（タグ・下線・強調・ノード）
//   text        本文テキスト
//   subtle      補助テキスト
//   faint       さらに薄い補助・ページ番号
//   danger      警告・禁止
//   code        インラインコードの文字色
//   panelBg     パネル/タイルの地色
//   cardBg      カード地色
//   cardBorder  枠・区切り線
//   rowHighlight 表の強調行の地色
//   codeBg      コードブロックの地色（暗）
//   codeText    コードブロックの文字色
//
// fonts: { heading, body } / margin / layout も必須。
//
// 新テーマの追加手順:
//   1. src/themes/<name>.js を作り、上のキーを埋める
//   2. ここの registry に追加
//   3. node src/generate.js input/_theme_sampler_deck.json output/_sampler.pptx
//      を DECK_THEME=<name> で実行して全レイアウトの見え方を確認

const iroribi = require("./iroribi");
const navy = require("./navy");
const graphite = require("./graphite");

const registry = { iroribi, navy, graphite };
const DEFAULT_DECK_THEME = "iroribi";

// 名前からテーマを取得。未知名は既定にフォールバック（found=false を返す）。
function getDeckTheme(name) {
  const key = String(name || "").trim();
  if (registry[key]) return { theme: registry[key], name: key, found: true };
  return { theme: registry[DEFAULT_DECK_THEME], name: DEFAULT_DECK_THEME, found: !name };
}

function listDeckThemes() {
  return Object.keys(registry);
}

module.exports = { registry, getDeckTheme, listDeckThemes, DEFAULT_DECK_THEME };
