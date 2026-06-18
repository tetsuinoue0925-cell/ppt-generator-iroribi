// テーマ: iroribi（会社テンプレ準拠）。既定テーマ。
// 配色は reference/デザインテンプレ用.pptx 由来（オレンジ × コーラル × 濃茶 × 黒 × 薄グレー）。
// 色の役割キーは全テーマ共通（src/themes/index.js のコントラクト）。
// band/bar はこのテーマ固有のテンプレ用キー（他テーマは layout 側で accent にフォールバック）。
module.exports = {
  name: "iroribi",
  layout: { name: "WIDE_16x9", width: 10, height: 5.625 },
  colors: {
    bg: "FFFFFF",
    primary: "212121", // 見出し・本文（ほぼ黒）
    accent: "EF8600", // アクセント（オレンジ）
    text: "212121",
    subtle: "595959", // 補助テキスト
    faint: "9E9E9E", // フッター・ページ番号
    danger: "D32F2F",
    code: "5A321E",
    panelBg: "F5F3F0", // パネル/タイル地（薄ベージュグレー）
    cardBg: "F5F3F0",
    cardBorder: "E2DCD5",
    rowHighlight: "FDEBDD", // 表の強調行（薄オレンジ）
    codeBg: "212121",
    codeText: "EEEEEE",
    // --- テンプレ固有 ---
    band: "5A321E", // 表紙の濃茶バンド
    bar: "FF775D", // 内容ページのタイトル帯（コーラル）
    barText: "FFFFFF", // タイトル帯の文字色
  },
  fonts: { heading: "BIZ UDPGothic", body: "BIZ UDPGothic" },
  margin: 0.55,
  // 右端の縦グラデ帯（テンプレ準拠）。grad=[開始色, 終了色], ang は OOXML 角度(1/60000度)。
  edge: { grad: ["FF8A00", "FF2594"], ang: 18900044 },
};
