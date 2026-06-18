# ppt-generator

スライド設計 JSON から、編集可能な PowerPoint (.pptx) を生成するツール。
PptxGenJS でテーマ・レイアウトをコード定義し、JSON を流し込んで .pptx を出力する。

## 最重要原則（ここを外すと壊れる）

- **HTML を変換しない。** JSON から PptxGenJS でネイティブ部品（テキストボックス・図形・表・画像）を生成する。HTML→Slides→PPTX ルートは禁止（テキスト画像化・位置ズレ・図形分解の原因）。
- **テキストは必ず `addText` / 表 / 図形で。** 画像化しない（編集可能性を損なう）。
- **AI にデザインを発明させない。** 役割は「変換エンジン」。レイアウト名 + 内容 + 強調点だけを扱い、配色・フォント・座標は `src/theme.js` のテーマ値を一元利用する。スライドごとに色やフォントを発明しない。
- **テンプレ流し込みはしない。** PptxGenJS は既存 .pptx を読めない。テーマ/マスターは `defineSlideMaster` でコード定義する。
- 優先順位: **編集可能性・再現性 > 見た目の完全再現**。

## Commands

このリポジトリはテンプレート。動かし方は**好きな方法でよい**（どれも出力は `output/*.pptx`）。

- **ローカル Node**（Node 20+）: `npm ci` →
  - 生成: `npm run generate`（既定 `input/slides.json` → `output/proposal.pptx`）／パス指定: `node src/generate.js <入力>.json <出力>.pptx`
  - 検証: `npm run validate`
- **devcontainer**: VS Code「Reopen in Container」または `devcontainer up`。依存は `postCreateCommand` の `npm ci` で自動導入。あとは上記コマンドをそのまま実行。
- **Docker（Node を入れたくないとき）**: `docker compose run --rm generate` / `docker compose run --rm validate`。
  パス指定する場合は `docker compose run --rm generate node src/generate.js <入力>.json <出力>.pptx`（`./input` `./output` `./cases` `./assets` はマウント済み）。

入力形式（設計JSON方言／リッチデッキ方言）は `generate.js` が自動判定する。

## Architecture

`src/generate.js` が入力の形を**自動判定**し、2つの入力方言を1つの入口で扱う:

```
入力JSON ─┬─ slides[].layout を持つ → 設計JSON方言 → src/layouts/ → PptxGenJS → output/*.pptx
          └─ presentation/slides[].type → リッチデッキ方言 → src/layouts-deck/ ─┘
```

- `src/generate.js` — エントリポイント。JSON 読込 → 形式判定 → 検証 → 各スライドを描画関数へディスパッチ。
- `src/theme.js` — 設計JSON方言のテーマ（`theme`）＋スライドマスター。
- `src/themes/` — **リッチデッキ方言のテーマ・レジストリ（1テーマ=1ファイル）。** ブランド定義の正本。色の役割キーは `src/themes/index.js` 冒頭のコントラクト。現状 `iroribi`/`navy`/`graphite`。
- `src/layouts/` — 設計JSON方言の描画関数（`title`/`message`/`cards_3`/`agenda`/`section`/`two_column`/`cards_4`/`summary`/`process`）。1 レイアウト = 1 ファイル。
- `src/layouts-deck/` — リッチデッキ方言の描画関数（13 型）。`index.js` が type→関数のディスパッチ。
- `src/richtext.js` — JSON値内の HTML 断片（`<strong>`等）を PptxGenJS リッチテキストへ変換。**HTML はレンダリングしない**（装飾意図だけ移植）。
- `src/schema*.js` + `schema/*.schema.json` — ajv 検証（設計JSON: `slides.schema.json` / デッキ: `deck.schema.json`）。

座標系: PptxGenJS の inch 基準（16:9 = 10in × 5.63in）。値はテーマで管理。

## 入力 JSON の形

**設計JSON方言**: 各スライド `layout` / `title` / `message` / `elements` / `speaker_notes`。
対応レイアウト: `title` / `message` / `cards_3` / `agenda` / `section` / `two_column` / `cards_4` / `summary` / `process`。

**リッチデッキ方言**（推奨・内製ルートの標準）: `presentation`（`title`/`date`/`company`/`theme`）＋ `slides[]`。
各スライド `id` / `type` / `header{tag,h2}` / `content` / `speaker_notes`。
対応 type（13）: `title-slide` / `toc` / `closing` / `section-title` / `bullet-list` / `table` / `two-column-mixed` / `two-column-tiled` / `tiled-content` / `timeline` / `highlight-numbers` / `bleed-image` / `qa-layout`。
- テーマ選択: `presentation.theme`（または env `DECK_THEME`）。未知名は既定 `iroribi` にフォールバック。
- 値に色・座標・HTML を持たせない。強調は最小限の `<strong>` のみ。

### 会社テンプレ（iroribi テーマ）の決まり
- 既定 `iroribi` テーマは `reference/デザインテンプレ用.pptx` 準拠（オレンジ/コーラル/濃茶、フォント BIZ UDPGothic）。元デザインの参照資料は `reference/` に置く（実行時には読まない）。
- 全ページ共通フレームは `defineDeckMaster`（`src/theme.js`）が付与: 左下 `Copyright ©2026 Iroribi Inc. All Rights Reserved.` / 中央 `Confidential` / 右下ページ番号。
- ロゴは `assets/logo.png`（`title-slide` 右上・`closing` 中央）。Docker では `./assets` をマウント（docker-compose.yml）。
- 内容ページのタイトルは色付き帯（`colors.bar`）に白抜き。表紙は濃茶バンド（`colors.band`）。
- 章扉のグレーアウト目次（テンプレ3ページ目）は未実装（運用では大本の目次から人が作成）。
- **右端の縦グラデ帯**は pptxgenjs がグラデ塗りを出せないため、`src/fixpptx.js` が生成後に各スライドへ `<a:gradFill>` 図形を注入して再現する（色は `theme.edge.grad`）。
- **図形プリセット名は OOXML 準拠の正式名のみ**（`rect`/`roundRect`/`line`/`ellipse`/`chevron`）。`oval` 等の非正規名を渡すと `prst="oval"` がそのまま出力され PowerPoint が「修復」する。`addShape` 追加時は注意。

## Workflow

**このリポジトリは「変換エンジン」に徹する。** 案件の原稿（md）・要件・生成物は `cases/<案件名>/` に置き、
git で追跡しない（`.gitignore` で除外）。テンプレ本体に機密・案件成果物を混ぜないため。サンプルは `input/`。

内製ルート（標準。Gemini/Canva 不要）:
1. Markdown で資料原稿を書く（`cases/<案件名>/原稿.md`）
2. `/md-to-deck-json` で各セクションを type へマッピングし deck JSON を起こす（色・HTML を持たない）→ `cases/<案件名>/deck.json`
3. 入出力パスを明示して .pptx 生成（形式は自動判定）:
   `node src/generate.js cases/<案件名>/deck.json cases/<案件名>/提案.pptx`
4. PowerPoint で人間が微調整

## テーマ／レイアウトのブラッシュアップ

- 色を変える: `src/themes/<name>.js` の役割キーを編集（共通キーは `src/themes/index.js`）。
- 配置（位置・余白・サイズ）: `src/layouts-deck/<type>.js`（1型=1ファイル）を編集。
- 確認用に全 type を網羅した `input/_theme_sampler_deck.json` がある。各テーマで生成して見比べる:
  `DECK_THEME=<name> node src/generate.js input/_theme_sampler_deck.json output/_sampler_<name>.pptx`

## 自分のテーマを作る（拡張ガイド）

このツールは「レイアウト（配置ロジック）」と「テーマ（色・フォント）」が分離している。**レイアウト側は色を役割名でしか参照しない**ので、テーマファイルを1つ足すだけで全 13 type がそのブランドで描ける。レイアウトのコードは触らなくてよい。

### 手順

1. `src/themes/<name>.js` を新規作成し、下記キーを**全部**埋める（`src/themes/index.js` 冒頭がコントラクトの正本）。
   既存の `src/themes/navy.js` を雛形にコピーして色を差し替えるのが速い。

   ```js
   module.exports = {
     name: "<name>",
     layout: { name: "WIDE_16x9", width: 10, height: 5.625 }, // 触らない（16:9 固定）
     colors: {
       bg, primary, accent, text, subtle, faint, danger, code,
       panelBg, cardBg, cardBorder, rowHighlight, codeBg, codeText, // 全部 6桁HEX（# なし）
     },
     fonts: { heading: "<見出しフォント>", body: "<本文フォント>" },
     margin: 0.55,                                   // 本文の左右マージン(inch)
     edge: { grad: ["<開始HEX>", "<終了HEX>"], ang: 18900044 }, // 右端の縦グラデ帯
     // 任意（会社テンプレ風の帯を使う型のみ。無ければ accent にフォールバック）:
     // band: "<表紙バンド>", bar: "<内容ページ帯>", barText: "FFFFFF",
   };
   ```

2. `src/themes/index.js` の `require` と `registry` に追加する（この2行だけ）。
3. 全 type で見え方を確認する:
   `DECK_THEME=<name> node src/generate.js input/_theme_sampler_deck.json output/_sampler_<name>.pptx`
4. 使うときは deck JSON の `presentation.theme: "<name>"`、または env `DECK_THEME=<name>`。

### 役割キーの意味（要点）

`primary`=見出し/主要テキスト、`accent`=タグ・下線・強調・ノード、`text`=本文、`subtle`/`faint`=補助テキスト（薄→より薄）、`panelBg`/`cardBg`=タイルやカードの地、`cardBorder`=枠線、`rowHighlight`=表の強調行、`codeBg`/`codeText`=コードブロック、`danger`=警告。色は**役割で考える**（「この型だけ赤くする」はしない＝デザインを発明しない原則）。

### Claude Code への指示の仕方（例）

テーマ作成は Claude にまかせられる。ブランドの素材があると精度が上がる:

- 「**`forest` というテーマを作って。ベースは深緑 `#1B4332`、アクセントは黄緑 `#52B788`、本文フォントは Noto Sans JP。`src/themes/index.js` のコントラクトを全部埋めて、サンプラーで iroribi と navy と見比べられるように生成して**」
- 「**この会社のブランドガイド（PDF/画像）の配色でテーマを起こして。役割キーに割り当てて、薄い地色・枠線は本文色から作って**」（画像を添付）
- 「**既存の navy をベースに、もう少し明るい青のテーマ `sky` を派生で作って**」

Claude は `src/themes/<name>.js` 作成 → `index.js` 登録 → サンプラー生成まで実行する。仕上がりを見て「タイル地をもう少し濃く」「見出しをもっと黒く」のように役割キー単位で微修正を頼めばよい。

> フォントは PowerPoint を開く環境にインストールされている必要がある（無いと代替フォント表示になる）。日本語は Google Fonts の Noto Sans JP / BIZ UDPGothic など、配布されているものが無難。

## Notes

- 設計JSON方言に新レイアウト追加時は `src/layouts/<name>.js` を作り、`generate.js` のディスパッチと `schema/slides.schema.json` を更新する。
- リッチデッキ方言に新 type 追加時は `src/layouts-deck/<type>.js` を作り、`src/layouts-deck/index.js` のディスパッチと `schema/deck.schema.json` の type enum を更新する。
- `output/` への出力は同名 .pptx を上書きし得る。重要成果物は退避してから生成する。
- 画像は外部取得しない（`bleed-image` はプレースホルダ）。外部送信なし・ローカル完結。
- **PptxGenJS 3.12.0 のバグ補正**: 同一段落に複数 run（＝文中の太字など）があると、各 run の前に余計な `<a:pPr>` を出力し PowerPoint が「修復」する。`src/fixpptx.js` が生成後に zip 内 XML を開き、`</a:r>` 直後の不正 `<a:pPr>` を除去する（`generate.js` の `writeFixed` 経由で常時適用）。PptxGenJS を更新したらこの補正の要否を再確認する。
