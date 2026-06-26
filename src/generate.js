// エントリポイント: 設計 JSON を検証し、PptxGenJS で .pptx を生成する。
//   node src/generate.js [input.json] [output.pptx]
//   環境変数 SLIDES_INPUT / SLIDES_OUTPUT でも指定可。
const fs = require("fs");
const path = require("path");
const PptxGenJS = require("pptxgenjs");
const { theme, defineMaster, buildThemeFromJson, getDeckTheme, listDeckThemes, defineDeckMaster } = require("./theme");
const { validate, formatErrors } = require("./schema");
const { validateDeck, formatErrors: formatDeckErrors, isDeckFormat } = require("./schema-deck");
const deckLayouts = require("./layouts-deck");
const { writeFixed } = require("./fixpptx");

// layout 名 → 描画関数のディスパッチ。新規追加時は /add-layout でここも更新する。
const layouts = {
  title: require("./layouts/title"),
  message: require("./layouts/message"),
  cards_3: require("./layouts/cards3"),
  agenda: require("./layouts/agenda"),
  two_column: require("./layouts/two_column"),
  section: require("./layouts/section"),
  cards_4: require("./layouts/cards4"),
  summary: require("./layouts/summary"),
  process: require("./layouts/process"),
};

const inputPath = process.argv[2] || process.env.SLIDES_INPUT || "input/slides.json";
const outputPath = process.argv[3] || process.env.SLIDES_OUTPUT || "output/proposal.pptx";

// リッチデッキ形式（presentation/slides[].type、値に HTML 断片を含む）の描画。
// HTML はレンダリングせず、装飾だけ PptxGenJS のリッチテキストへ移植する。
function renderDeck(data) {
  const { valid, errors } = validateDeck(data);
  if (!valid) {
    console.error("スキーマ検証に失敗しました（deck 形式）:");
    formatDeckErrors(errors).forEach((line) => console.error(line));
    process.exit(1);
  }

  // テーマ選択の優先順位: 環境変数 DECK_THEME > JSON の presentation.theme > 既定。
  const requested = process.env.DECK_THEME || (data.presentation && data.presentation.theme) || "";
  const picked = getDeckTheme(requested);
  const dt = picked.theme;
  if (requested && !picked.found) {
    console.warn(`⚠ 未知のテーマ "${requested}"。既定 "${picked.name}" を使用。選択肢: ${listDeckThemes().join(", ")}`);
  }
  console.log(`リッチデッキ形式を検出しました（deck エンジン / テーマ: ${picked.name}）`);

  const pptx = new PptxGenJS();
  pptx.defineLayout({
    name: dt.layout.name,
    width: dt.layout.width,
    height: dt.layout.height,
  });
  pptx.layout = dt.layout.name;
  defineDeckMaster(pptx, dt);

  if (data.presentation && data.presentation.title) pptx.title = data.presentation.title;
  if (data.presentation && data.presentation.company) pptx.company = data.presentation.company;

  const slides = Array.isArray(data.slides) ? data.slides.slice() : [];
  // 裏表紙（closing）を末尾に毎回挿入する（既に末尾が closing なら追加しない）。
  if (!slides.length || slides[slides.length - 1].type !== "closing") {
    slides.push({ type: "closing", content: { company: (data.presentation && data.presentation.company) ? `株式会社 ${data.presentation.company}` : "株式会社 Iroribi" } });
  }
  const skipped = [];
  slides.forEach((s, idx) => {
    const fn = deckLayouts[s.type];
    const slide = pptx.addSlide({ masterName: "DECK" });
    if (!fn) {
      skipped.push(`${idx + 1}:${s.type}`);
      slide.addText(`未対応 type: ${s.type}`, {
        x: 0.5, y: 2.6, w: 9, h: 0.5, color: dt.colors.danger, fontFace: dt.fonts.body, fontSize: 14, align: "center",
      });
      return;
    }
    try {
      fn(pptx, slide, dt, s);
    } catch (e) {
      skipped.push(`${idx + 1}:${s.type}(${e.message})`);
      slide.addText(`描画エラー: ${s.type}`, {
        x: 0.5, y: 2.6, w: 9, h: 0.5, color: dt.colors.danger, fontFace: dt.fonts.body, fontSize: 14, align: "center",
      });
    }
    if (s.speaker_notes) slide.addNotes(s.speaker_notes);
  });

  const outDir = path.dirname(outputPath);
  if (outDir && !fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  writeFixed(pptx, outputPath, { edge: dt.edge })
    .then((fixed) => {
      console.log(`生成完了: ${outputPath}（${slides.length} スライド）`);
      if (fixed) console.log(`  pptxgenjs の不正 pPr を ${fixed} 件補正`);
      if (dt.edge) console.log(`  右端グラデ帯を注入`);
      if (skipped.length) console.warn(`⚠ 未処理/エラー: ${skipped.join(", ")}`);
    })
    .catch((e) => {
      console.error(`生成に失敗しました: ${e.message}`);
      process.exit(1);
    });
}

function main() {
  if (!fs.existsSync(inputPath)) {
    console.error(`入力 JSON が見つかりません: ${inputPath}`);
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(inputPath, "utf-8"));
  } catch (e) {
    console.error(`JSON のパースに失敗しました: ${e.message}`);
    process.exit(1);
  }

  // リッチデッキ形式（presentation/slides[].type）なら専用エンジンへ分岐。
  if (isDeckFormat(data)) {
    return renderDeck(data);
  }

  // スキーマ検証。失敗したら生成へ進まない。
  const { valid, errors } = validate(data);
  if (!valid) {
    console.error("スキーマ検証に失敗しました:");
    formatErrors(errors).forEach((line) => console.error(line));
    process.exit(1);
  }

  // THEME_FROM_JSON=1 のときだけ JSON の theme/style を採用する実験モード。
  // 既定は原則どおり src/theme.js（ブランド定義の正本）を使う。
  const useJsonTheme = process.env.THEME_FROM_JSON === "1";
  const activeTheme = useJsonTheme ? buildThemeFromJson(data) : theme;
  if (useJsonTheme) {
    console.log("⚠ THEME_FROM_JSON=1: JSON の theme/style を採用（theme.js は無視）");
  }

  const pptx = new PptxGenJS();
  pptx.defineLayout({
    name: activeTheme.layout.name,
    width: activeTheme.layout.width,
    height: activeTheme.layout.height,
  });
  pptx.layout = activeTheme.layout.name;
  defineMaster(pptx, activeTheme);

  if (data.meta) {
    if (data.meta.title) pptx.title = data.meta.title;
    if (data.meta.author) pptx.author = data.meta.author;
  }
  // AI 設計出力の deck_meta.title もデッキタイトルとして採用（meta 優先）。
  if (data.deck_meta && data.deck_meta.title && !pptx.title) {
    pptx.title = data.deck_meta.title;
  }

  const slides = data.slides || [];
  slides.forEach((s, idx) => {
    const fn = layouts[s.layout];
    if (!fn) {
      console.error(
        `未対応の layout: "${s.layout}"（スライド ${idx + 1}）。/add-layout で追加してください。`
      );
      process.exit(1);
    }
    const slide = pptx.addSlide({ masterName: "MASTER" });
    fn(pptx, slide, s, activeTheme);
    if (s.speaker_notes) slide.addNotes(s.speaker_notes);
  });

  // 出力ディレクトリを保証
  const outDir = path.dirname(outputPath);
  if (outDir && !fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  writeFixed(pptx, outputPath)
    .then((fixed) => {
      console.log(`生成完了: ${outputPath}（${slides.length} スライド）`);
      if (fixed) console.log(`  pptxgenjs の不正 pPr を ${fixed} 件補正`);
    })
    .catch((e) => {
      console.error(`生成に失敗しました: ${e.message}`);
      process.exit(1);
    });
}

main();
