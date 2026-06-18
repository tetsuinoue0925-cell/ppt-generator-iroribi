# 要件分析結果

> 生成日: 2026-06-17
> 入力: requirements.md

## ドメイン・プロジェクト概要

構造化データ（スライド設計 JSON）から、**編集可能な PowerPoint (.pptx)** を生成するツール。
設計の核は「見た目を作る AI」と「編集可能 PPTX を生成する工程」を**明確に分離**すること。デザイン案生成（Gemini Canvas / Claude）は初稿まで、最終 PPTX は **JSON + PptxGenJS（テーマをコードで定義）** で生成する。HTML → Slides → PPTX 変換ルートは採用しない（テキストの画像化・位置ズレ・図形分解を避けるため）。テンプレ流し込み方式は採らず、テーマ（配色・フォント・スライドマスター）とレイアウトを PptxGenJS のコードで宣言的に定義する。生成物は必ず PowerPoint ネイティブ部品（テキストボックス・図形・表・画像）として出力し、人間が最終調整できる状態にする。

## 技術スタック
- 言語: Node.js 20+ / JavaScript（TypeScript も可）
- ライブラリ・フレームワーク: PptxGenJS（`defineSlideMaster` でテーマ/マスターをコード定義し、テキスト・図形・表・グラフ・画像を生成）。ajv（JSON Schema 検証）。
- 実行環境: Docker（node:20-slim ベース。Dockerfile + docker-compose.yml）。`input/` `output/` をボリュームマウントし、生成 .pptx はホスト `output/` へ出力。Windows 11 / Docker Desktop 想定。`docker compose run` 一発生成。パッケージ管理は npm（package.json / package-lock.json）、コンテナ内 `npm ci`。GUI 不要のファイル生成のみのため Docker と好相性。
- 外部サービス: なし（ローカル完結）。Gemini/Claude へ JSON 生成を依頼するプロンプト雛形は同梱するが API 連携は必須ではない。

## 機能要件
### 主要機能
- テーマ定義: 配色・フォント・余白・スライドマスター（背景/ロゴ/フッター）を src/theme.js にコード定義し defineSlideMaster で登録。
- JSON スキーマ: スライド設計 JSON（各スライド = layout / title / message / elements / speaker_notes）を入力に取る。
- レイアウト関数: layout 名 → レイアウト描画関数へディスパッチし PptxGenJS 部品として描画。
- 対応レイアウト（初期3種）: title（表紙）/ message（1メッセージ+補足3点）/ cards_3（3カード比較）。将来拡張: agenda / section / two_column / process / timeline / table / summary。
- スピーカーノート生成: speaker_notes を slide.addNotes へ。
- 画像: パス指定があれば挿入、なければプレースホルダ図形を配置。
- JSON 生成補助: Gemini/Claude に「HTML ではなく設計 JSON で出させる」プロンプト雛形を同梱。
- 検証: 入力 JSON のスキーマ検証 + 生成 .pptx の簡易整合性チェック（生成成功・スライド数）。

### データフロー
（人間が初稿デザインを判断）→ AI が スライド設計 JSON を生成（input/slides.json）→ ajv で検証 → PptxGenJS がテーマ/レイアウトで描画 → output/proposal.pptx → PowerPoint で人間が微調整

### 成果物
- output/*.pptx: 編集可能な PowerPoint。PowerPoint で問題なく開け、テキスト/図形が編集可能であること。
- prompts/json_design_prompt.md: AI に JSON を出させるための雛形。

## ワークフローと自律度

| ワークフロー | 自律度 | 停止条件 | 失敗時の挙動 | 介入ポイント |
|------------|--------|----------|------------|------------|
| JSON → PPTX 生成 | Lv2 | .pptx 出力完了 / スキーマ検証失敗 | 検証エラーを報告して停止、生成中断 | 生成後に PowerPoint で人間が微調整 |
| 設計 JSON 変換補助 | Lv1 | JSON 出力 | — | JSON 内容を人間が確認 |
| レイアウト/テーマ追加 | Lv1 | 新レイアウト・テーマ実装・検証完了 | — | 仕様を人間が指定 |

### 自律ループ・完全自動化対象（Lv3・Lv4）
- なし（通常運用は Lv1〜2。AI にデザインを発明させない方針）

## 常駐コンテキスト
### ドメイン知識・用語
- レイアウト名: src/layouts/ に実装された描画関数（title / message / cards_3 等）。AI はこの型に内容を流すだけ。
- テーマ: 配色・フォント・スライドマスターを定義した src/theme.js。色やフォントは常にここを参照。
- 設計 JSON: layout / title / message / elements / speaker_notes を持つスライド配列。
- 座標系: PptxGenJS の inch 基準（既定 10in × 5.63in の 16:9）。

### 暗黙の前提
- HTML を変換しない。JSON から PptxGenJS でネイティブ部品を生成する。
- テーマ・レイアウトはコードで定義する（PptxGenJS は既存 .pptx を読めないため、テンプレ流し込みは行わない）。
- AI にデザインを発明させない。レイアウト名 + 内容 + 強調点のみを扱う。
- テキストは必ず addText / 表 / 図形で配置し、画像化しない。
- 編集可能性 > 見た目の完全再現。

### 判断の優先軸
- 壊れにくさ・再現性 > 見た目の完全再現
- テーマ（配色・フォント・マスター）の一元利用を最優先。スライドごとに値を発明しない。

## 制約と境界
### 不可逆操作
- ⚠ output/ への .pptx 上書き: 同名ファイルがあれば上書きし得る。重要成果物は事前確認推奨。

### 保護リソース
- src/theme.js: ブランド定義の正本。変更はテーマ更新時のみ、慎重に。

### 禁止事項
- HTML → Slides → PPTX 変換ルート: テキスト画像化・位置ズレ・図形分解が起きるため禁止。
- スライドごとに配色/フォントを発明すること: テーマ定義値の一元利用を原則とする。
- テキストの画像化: 編集可能性を損なうため禁止。

## 外部連携
| サービス | 用途 | Claude操作 | 操作種別 | 認証管理 |
|---------|------|-----------|---------|---------|
| なし | — | いいえ | — | — |

（Gemini/Claude による JSON 生成は人間がブラウザ等で行い、本ツールは API 連携しない）

## 非機能要件
- パフォーマンス: 同じ JSON + 同じテーマコード → 同じ .pptx（決定的）。
- エラー処理: ajv のスキーマ検証で不正入力を早期検出し、明確なエラーで停止。生成 .pptx の簡易整合性チェック。
- セキュリティ: ローカル完結。外部送信なし。

## スコープ外
- HTML スライドの最終成果物化: ズレ・画像化の原因のため。
- 既存 .pptx テンプレへの流し込み: PptxGenJS は既存 .pptx を読めないため本プロジェクトでは行わない。
- Google スライド / Slides API 生成: 今回は PPTX に集中。
- デザインそのものの自動発明: 再現性を損なうため。
- マルチユーザー / サーバー運用 / Web UI: スコープ外。
