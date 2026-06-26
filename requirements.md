# requirements.md — ppt-generator

## 1. プロジェクト概要

構造化データ（スライド設計 JSON）から、**編集可能な PowerPoint (.pptx)** を生成するツール。

設計思想は「見た目を作る AI」と「編集可能 PPTX を生成する工程」を**明確に分離**すること。
- Gemini Canvas / Claude などは **デザイン案・構成案の生成（初稿）** までに使う。
- 最終成果物の PPTX は **JSON + PptxGenJS（テーマをコードで定義）** で生成する。
- HTML → Google スライド → PPTX のルートは**採用しない**（テキストの画像化・位置ズレ・図形分解が起きるため）。

成果物は必ず PowerPoint のネイティブ部品（テキストボックス・図形・表・画像）として生成し、人間が PowerPoint で最終調整できる状態にする。

**テンプレ方式は採らない**: 既存 .pptx テンプレに流し込むのではなく、テーマ（配色・フォント・スライドマスター）とレイアウトを **PptxGenJS のコードで宣言的に定義** する。

## 2. 技術スタック・環境

- 言語: Node.js 20+ / JavaScript（必要なら TypeScript も可）
- 主要ライブラリ: **PptxGenJS**（テーマ/スライドマスターを `defineSlideMaster` でコード定義し、テキスト・図形・表・グラフ・画像を生成）
- スキーマ検証: ajv（JSON Schema で入力 JSON を検証）
- 実行環境: **Docker**（ローカル Node を汚さず再現性を確保）
  - PptxGenJS は GUI 不要のファイル生成のみ → Docker と好相性。
  - `Dockerfile`（node:20-slim ベース）+ `docker-compose.yml` を用意。`input/` `output/` をボリュームマウントし、生成 .pptx はホストの `output/` に出力。
  - Windows 11 / Docker Desktop を想定。`docker compose run` 一発で生成できる UX。
- パッケージ管理: npm（`package.json` / `package-lock.json`）。コンテナ内 `npm ci`。
- バージョン管理: git（未初期化の可能性あり）

## 3. 機能要件

1. **テーマ定義**: 配色・フォント・余白・スライドマスター（背景/ロゴ/フッター等）を `src/theme.js` にコードで定義し、`defineSlideMaster` で登録する。
2. **JSON スキーマ**: スライド設計 JSON を入力に取る。各スライドは最低限：
   - `layout`: 使用レイアウト名
   - `title`: タイトル
   - `message`: そのスライドの主張（1 メッセージ）
   - `elements`: テキスト/カード/表/図形/画像
   - `speaker_notes`: 発表メモ
3. **レイアウト関数**: `layout` 名 → レイアウト関数へディスパッチし、PptxGenJS の部品として描画する。
4. **対応レイアウト（初期 3 種から開始）**:
   - `title`（表紙）
   - `message`（1 メッセージ + 補足 3 点）
   - `cards_3`（3 カード比較）
   - 将来拡張: `agenda` / `section` / `two_column` / `process` / `timeline` / `table` / `summary`
5. **スピーカーノート**生成（`speaker_notes` を `slide.addNotes` へ）。
6. **画像**: パス指定があれば画像を挿入。なければプレースホルダ図形を配置。
7. **JSON 生成補助**: Gemini/Claude に渡す「HTML ではなく設計 JSON で出させる」ためのプロンプト雛形を同梱。
8. **検証**: 入力 JSON のスキーマ検証 + 生成 .pptx が壊れていないか（生成成功・スライド数）の簡易チェック。

## 4. ワークフローと自律度設計（Lv0〜4）

- 通常運用は **Lv1〜2**。AI にデザインを発明させず、「どの型に何を入れるか」だけ判断させる。
- 標準フロー:
  1. Gemini Canvas / Claude で初稿デザイン・構成を見る（人間が判断）
  2. それを **スライド設計 JSON** に変換させる（HTML ではなく JSON）
  3. Claude Code が JSON を受け取り、PptxGenJS で .pptx を生成（**変換エンジンに徹する**）
  4. PowerPoint で人間が微調整
- Claude Code は「デザイナー」ではなく「変換エンジン」。いきなり「いい感じに作って」は禁止運用。

## 5. 常駐コンテキスト（CLAUDE.md に置くべき核）

- 「HTML を変換しない。JSON から PptxGenJS でネイティブ部品を生成する」原則。
- テーマ・レイアウトは `src/theme.js` / `src/layouts/` にコードで定義する（PptxGenJS は既存 .pptx を読めないため、テンプレ流し込みは行わない）。
- AI にデザインを発明させない。レイアウト名 + 内容 + 強調点のみを扱う。
- テキストは必ずテキストボックス（`addText`）/表/図形で。画像化しない。
- 座標系は PptxGenJS の inch 基準（既定 10in × 5.63in の 16:9）。テーマで一元管理する。
- ディレクトリ規約・生成/検証コマンド（`docker compose run` / `npm run generate`）。

## 6. 制約と境界

- HTML→Slides→PPTX ルート禁止。
- 配色・フォント・レイアウトはコードで定義した値を一元利用し、スライドごとに勝手に発明しない。
- テキストの画像化禁止（編集可能性を損なうため）。

## 7. 外部連携

- 当面なし（ローカル完結）。
- 将来: Gemini/Claude へ JSON 生成を依頼するプロンプト雛形は同梱するが、API 連携は必須ではない。

## 8. 非機能要件

- 再現性: 同じ JSON + 同じテーマコード → 同じ .pptx。
- 壊れにくさ最優先（編集可能性 > 見た目の完全再現）。
- 生成物は PowerPoint で問題なく開け、テキスト/図形が編集可能であること。

## 9. スコープ外

- HTML スライドの最終成果物化。
- 既存 .pptx テンプレへの流し込み（PptxGenJS は既存 .pptx を読めないため、本プロジェクトでは行わない）。
- Google スライド / Slides API 生成（今回は PPTX に集中）。
- デザインそのものの自動発明。
- マルチユーザー/サーバー運用・Web UI。

---

## 想定ディレクトリ（参考）

```
ppt-generator/
├─ Dockerfile                   # node:20-slim ベース
├─ docker-compose.yml           # input/ output/ をマウントして一発生成
├─ package.json
├─ input/
│  └─ slides.json               # スライド設計 JSON
├─ schema/
│  └─ slides.schema.json        # 入力 JSON の JSON Schema
├─ src/
│  ├─ layouts/                  # レイアウト別の描画関数
│  │  ├─ title.js
│  │  ├─ message.js
│  │  └─ cards3.js
│  ├─ theme.js                  # 配色・フォント・スライドマスター定義
│  ├─ schema.js                 # ajv による JSON 検証
│  └─ generate.js               # エントリポイント
├─ prompts/
│  └─ json_design_prompt.md     # Gemini/Claude に JSON を出させる雛形
└─ output/
   └─ proposal.pptx
```
