---
name: generate-pptx
description: スライド設計 JSON から編集可能な .pptx を生成したいときに使う。input/slides.json（または指定 JSON）を ajv で検証し、Docker（または npm）で PptxGenJS による生成を実行し、生成結果（スライド数・出力先・エラー）を確認して報告する。「スライドを生成して」「pptx を作って」「slides.json から出力して」と言われたときに使う。副作用（ファイル出力）があるため明示呼び出し専用。
argument-hint: "[input-json-path] [output-pptx-path]"
disable-model-invocation: true
allowed-tools: "Read Write Bash(docker compose *) Bash(npm run *) Bash(npm ci) Bash(node *) Bash(ls *)"
---

この skill は以下の場面で使う：
- `input/slides.json` などのスライド設計 JSON から .pptx を生成したいとき
- 生成前にスキーマ検証を通し、壊れた .pptx を作らないようにしたいとき

## 前提確認

- カレントがプロジェクトルート（`ls CLAUDE.md` で確認）。
- 入力 JSON のパス（既定 `input/slides.json`）。引数で上書き可。
- 出力先（既定 `output/proposal.pptx`）。引数で上書き可。
- 生成手段: Docker 優先（`docker compose run --rm generate`）。Docker が使えない/未構築なら `npm ci`（初回）後に `npm run generate`。
- 原則を厳守: HTML 変換しない / テキストは画像化しない / 色・フォント・座標は `src/theme.js` のテーマ値のみ使う（CLAUDE.md 参照）。

## 手順

1. 入力 JSON を Read し、最低限の形を確認する（配列で各要素に `layout` と `title` があるか）。
2. スキーマ検証を実行する:
   - `npm run validate`（ajv で `schema/slides.schema.json` に照合）。
   - 検証エラーがあれば、どのスライド・どのフィールドが不正かを要約し、**生成せず停止**してユーザーに報告する。
3. 検証通過後、生成を実行する:
   - 既定: `docker compose run --rm generate`
   - フォールバック: `npm ci`（node_modules 未作成時のみ）→ `npm run generate`
   - 入力/出力を引数指定された場合は、その値を環境変数または引数として渡す（`generate.js` のインターフェースに合わせる）。
4. 出力先に .pptx が生成されたかを `ls` で確認し、スライド数・出力パスを報告する。
5. 既存の同名 .pptx を上書きする場合は、その旨を明記する（重要成果物は退避を促す）。

## 出力

- 保存先: `output/proposal.pptx`（または引数指定パス）
- 形式: PowerPoint (.pptx)。テキストボックス・図形・表・画像はネイティブ部品（編集可能）。

## 注意

- スキーマ検証に失敗したら絶対に生成へ進まない（壊れた成果物を防ぐ）。
- 未対応の `layout` 名が JSON にある場合は、`/add-layout` で追加してから生成するよう案内する。
- 生成はテーマ定義（`src/theme.js`）に従う。スライドごとに色・フォントを発明しない。
- 外部送信は行わない（ローカル完結）。
