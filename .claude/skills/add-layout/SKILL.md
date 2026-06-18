---
name: add-layout
description: 新しいスライドレイアウトを追加したいときに使う。CLAUDE.md の規約どおり3箇所（src/layouts/<name>.js の描画関数、src/generate.js のディスパッチ登録、schema/slides.schema.json の layout enum）を整合させて追加し、漏れを防ぐ。「レイアウトを追加して」「<name> というスライド型を作って」「two_column を増やして」と言われたときに使う。ファイルを生成・編集するため明示呼び出し専用。
argument-hint: "<layout-name>"
disable-model-invocation: true
allowed-tools: "Read Write Edit Bash(ls *)"
---

この skill は以下の場面で使う：
- 既存3種（title / message / cards_3）以外の新レイアウトを追加したいとき
- レイアウト追加で3箇所の更新漏れ（描画・ディスパッチ・スキーマ）を防ぎたいとき

## 前提確認

- カレントがプロジェクトルート（`ls CLAUDE.md`）。
- 追加するレイアウト名（kebab/snake、例 `two_column`）。ファイル名は camel 等プロジェクト慣習に合わせる（既存 `cards3.js` に倣う）。
- 既存の `src/layouts/` と `src/generate.js`、`schema/slides.schema.json` を Read し、登録パターンと座標系（テーマ参照の作法）を把握する。
- レイアウトが必要とする `elements` の形（テキスト/カード/表 等）をユーザーに確認する（不明なら聞く）。

## 手順

1. 既存レイアウト（例 `src/layouts/cards3.js`）を Read し、関数シグネチャ・テーマ参照・スライド追加の作法を雛形として把握する。
2. `src/layouts/<name>.js` を作成する:
   - 既存と同じインターフェース（例: `(pptx, slide, data, theme) => { ... }`）に合わせる。
   - 色・フォント・余白・座標は `src/theme.js` のテーマ値を参照（ハードコードしない）。
   - テキストは `addText` / 表 / 図形で配置（画像化しない）。
3. `src/generate.js` のディスパッチに新レイアウトを登録する（既存の layout→関数 マップに追記）。
4. `schema/slides.schema.json` の `layout` の enum（または対応定義）に `<name>` を追加し、必要なら新レイアウト固有の `elements` 形を定義する。
5. 3箇所の整合を確認し、変更点を要約して報告する。
6. 動作確認の案内: `input/slides.json` に新レイアウトのサンプルを1枚足し `/generate-pptx` で生成して目視確認するよう促す。

## 出力

- 生成: `src/layouts/<name>.js`
- 更新: `src/generate.js`（ディスパッチ）、`schema/slides.schema.json`（enum/elements）

## 注意

- **3箇所すべて**を更新する。1つでも漏れると検証失敗または描画されない。
- テーマ値の一元利用を厳守（スライドごとに色・フォントを発明しない）。
- 座標は PptxGenJS の inch 基準（16:9 = 10in × 5.63in）。テーマで管理された値を使う。
