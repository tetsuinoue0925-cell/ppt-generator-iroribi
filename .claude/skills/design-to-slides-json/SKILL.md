---
name: design-to-slides-json
description: 構成案・アウトライン・Gemini/Claude の初稿デザインを、このツールのスキーマに準拠した input/slides.json に変換したいときに使う。各内容を適切な layout 名（title/message/cards_3 等）へマッピングし、HTML ではなく設計 JSON として書き出す。「この構成を slides.json にして」「アウトラインから JSON を作って」「Gemini の下書きを変換して」と言われたときに使う。
argument-hint: "[outline-or-source-path]"
disable-model-invocation: false
allowed-tools: "Read Write Bash(npm run *) Bash(ls *)"
---

この skill は以下の場面で使う：
- プレゼンの構成案・アウトライン・初稿（テキストや Gemini Canvas の下書き）から `input/slides.json` を起こすとき
- 「HTML を変換する」のではなく、内容を**設計 JSON**として構造化したいとき

## 前提確認

- 変換元（引数のパス、または会話で渡された構成案テキスト）。
- `prompts/json_design_prompt.md` を Read し、JSON の方針・粒度を把握する。
- `schema/slides.schema.json` を Read し、必須フィールドと使用可能な `layout` 名を把握する。
- 対応レイアウト（現状）: `title` / `message` / `cards_3`。これ以外が必要なら `/add-layout` を先に促す。

## 手順

1. 変換元を読み、スライド単位に分解する。
2. 各スライドについて、内容に最も合う `layout` を選ぶ:
   - 表紙 → `title`
   - 1つの主張＋補足3点 → `message`
   - 3項目の比較・並列 → `cards_3`
   - 当てはまらない場合は無理に画像化・自由配置せず、最も近い型に寄せるか `/add-layout` を提案する。
3. 各スライドを以下の形で組み立てる:
   - `layout` / `title` / `message` / `elements` / `speaker_notes`
   - 装飾は持たせない（色・フォント・座標はテーマが持つ）。内容と強調点のみ。
4. 全体を1つの JSON 配列にまとめ、`input/slides.json`（または指定パス）に Write する。
5. `npm run validate` でスキーマ検証し、エラーがあれば修正して再検証する。
6. スライド枚数と各 layout の割り当てを要約して報告し、`/generate-pptx` での生成を案内する。

## 出力

- 保存先: `input/slides.json`（または引数指定パス）
- 形式: スキーマ準拠の設計 JSON（スライド配列）

## 注意

- **HTML を変換しない。** 内容を構造化した JSON を作る。装飾は埋め込まない。
- デザインを発明しない。レイアウト名 + 内容 + 強調点だけを決める。
- 未対応 layout を勝手に作らない。必要なら `/add-layout` を先に通す。
