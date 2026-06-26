# 提案資料 構成 JSON 生成プロンプト（リッチデッキ方言 / Iroribi テーマ）

クライアント向け提案資料の構成案を、Gemini Canvas や Claude に**リッチデッキ方言**（`presentation` + `slides[].type`、Iroribi テーマ）で出力させるための雛形。
出力された JSON は `cases/<案件名>/deck.json` に保存し、`node src/generate.js cases/<案件名>/deck.json cases/<案件名>/提案.pptx` で .pptx 化する。

簡易方言（`title`/`message`/`cards_3`等）向けの雛形は `prompts/json_design_prompt.md` を参照。

---

## 貼り付け用プロンプト

```
あなたはコンサルティング提案資料の構成を設計する担当です。
以下の内容・添付資料をもとに、指定スキーマに厳密に従う JSON だけを出力してください。
説明文・前置き・コードフェンス（```）は一切付けず、JSON本体のみを返してください。

# 出力形式（重要）
- 出力は JSON の「配列」ではなく、次の形の単一オブジェクトです:
  { "presentation": { "title": "...", "theme": "iroribi" }, "slides": [ {...}, {...} ] }
- 裏表紙（ロゴのみのclosingスライド）は生成エンジン側が自動付加するため、JSONには含めないでください。
- 値に色・フォント・座標・pt指定は一切含めないでください（テンプレート側のIroribiテーマで固定されるため）。
- 強調表現は本文中の <strong>テキスト</strong> のみ使用可（他のHTMLタグは使わない）。

# スライド構成ルール

## 1. 標準アジェンダ（全体で約20枚に収める）
クライアント向け提案資料として、以下11項目を骨格にする（内容量に応じて1項目を2枚に分割してよい。逆に薄い項目は前後と統合してよい）。
各項目の内容に最も適した type を選び、表紙・目次・章扉を含めて全体約20枚に調整する。

| # | 項目 | 推奨 type | 補足 |
|---|------|-----------|------|
| 表紙 | - | title-slide | content.h1=資料タイトル, content.subtitle=サブタイトル |
| 目次 | - | toc | content.items=各章タイトルの配列 |
| 1 | エグゼクティブサマリ | bullet-list | 結論→根拠3〜4点 |
| 2 | 背景・課題認識 | bullet-list | 外部環境・内部事情の課題点 |
| 3-4 | あるべき姿（To-Be）／現状（As-Is） | two-column-tiled | 2tile（左=現状, 右=あるべき姿）でまとめてよい |
| 5 | ギャップ分析（課題分析） | table | 列例: 観点／As-Is／To-Be／ギャップ |
| 6 | 解決アプローチ（打ち手） | tiled-content | 打ち手が3つならtile3枚、それ以外はbullet-list |
| 7 | 期待効果・スコープ | highlight-numbers | 定量効果を数値で。スコープはfooterまたは別途bullet-listで1枚追加 |
| 8 | プロジェクト体制（責任範囲） | table | 列例: 役割／担当／責任範囲（RACI） |
| 9 | スケジュール | timeline | items[].phase=フェーズ名, title=マイルストーン, description=内容 |
| 10 | 概算費用・前提条件 | table | 列例: 項目／概算費用／前提条件 |
| 11 | 次のステップ | qa-layout | content.items=依頼事項・次アクションの配列 |
| 章扉（任意） | - | section-title | 「現状分析」「実行計画」など大きな塊の前に挿入してよい |

実際に使う type は上表を出発点としつつ、内容に最も近いものを選ぶこと（無理に当てはめない）。

## 2. 1スライド1メッセージ徹底
1枚で伝えることは1つだけ。情報量が多い項目は複数枚に分割する。

## 3. 3要素構成（タイトル／リード文／ボディ）
各スライドは次の3層で構成する。

- **タイトル**（= `header.h2`）: テーマ・問いを簡潔に。タイトルだけで内容が完全にわかること。句読点不要。
- **リード文**: 結論を全角30字以内・最大2行で言い切る。句読点不要。配置先は type ごとの「リード用スロット」を使う:
  - bullet-list / table / two-column-mixed / two-column-tiled / tiled-content → `content.pre_text`
  - highlight-numbers → `content.footer`（数値群の下に結論として）
  - qa-layout → `content.description`
  - timeline / section-title → リード相当は `header.tag`（短い英字カテゴリラベル）で代替してよい
- **ボディ**: リード文を補強する根拠・事実のみ。type ごとの本文スロット（`content.items` / `content.rows` / `content.tiles` 等）に入れる。
  - **`bullet-list` の `content.items`** — 各要素は**必ずオブジェクト**で記述する（平文字列を渡すと本文が空白になる）。
    - `strong`: メイン行（太字・大きめ）。箇条書き本体。
    - `subtext`: 補足行（細字・小さめ）。数値・出典・補足がある場合のみ。省略可。
    ```json
    { "strong": "調査対象 自動制御可能な船載技術全般", "subtext": "優先はバックホウ搭載作業船" }
    ```
  - **`table` の `content.rows`** — **配列の配列**形式で記述する。先頭行がヘッダ行として自動認識される。
    ```json
    "rows": [
      ["観点", "As-Is 現状", "To-Be あるべき姿", "ギャップ"],
      ["状況把握", "グラブは画像LiDAR認識実装済み", "全船種で水中含む高精度認識", "水中認識が未確立"]
    ]
    ```
    ※ `{ "cells": [...] }` オブジェクト形式も可だが、配列形式の方がシンプルで推奨。
  - **`tiled-content` / `two-column-tiled` の `content.tiles`**: `{ "title": "タイル見出し", "body": "本文（改行は\\n）" }` 形式（`body` は平文で可）。
  - **`timeline` の `content.items`**: `{ "phase": "時期", "title": "マイルストーン", "description": "詳細" }` 形式。
  - **`highlight-numbers` の `content.numbers`**: `{ "value": "300万円", "label": "調査費" }` 形式。

## 4. 体言止め・名詞止め徹底
タイトル・リード文・ボディはすべて体言止め（ですます調禁止）。
※ ただし note 8 の speaker_notes（発表者ノート）だけは例外でですます調にする。

## 5. 図が必要な場合
- スライドの主役が図そのものの場合: `type: "bleed-image"` を使い、`image_alt` に「〇〇図：何を示すか・データソース」を記述する（実画像は取得しないプレースホルダ枠になる）。
- 箇条書きの一項目として図が必要な場合: その項目のテキストに「【図】〇〇図：何を示すか・データソース」と記述する（人間がPowerPoint側で後から差し込む前提の空白マーカー）。

## 6. フォントサイズ・色・座標について
これらはすべてIroribiテンプレート側（テーマ・レイアウトコード）で固定されています。JSON側で指定・言及しないでください。

## 7. speaker_notes（発表者ノート）必須
各スライドのトップレベルに `"speaker_notes": "..."` を必ず付与する（`content` の中ではない）。
- 文字数: 300〜600字（1〜2分で話せる量）
- そのスライドで口頭で話す内容を具体的に記述（聴衆への語りかけ文体）
- スライドに載せていない補足情報・数値の根拠・背景も含める
- 想定される質問とその回答を1〜2つ入れる
- ですます調で記述（スライド本文とは対照的に、ここだけ丁寧体）

## 8. 出力形式（再掲）
- JSON単一オブジェクトのみ。前後の説明文・コードフェンス不要。
- 全スライドに `header`（h2/必要ならtag）・`content`・`speaker_notes` を必須で含める。

# 変換対象の内容
（ここに構成案・添付資料の内容を貼る）
```

---

## 使い方

1. 上記プロンプトの末尾に、提案対象の構成案・添付資料の内容を貼って Gemini/Claude に渡す。
2. 返ってきた JSON を `cases/<案件名>/deck.json` に保存。
3. `node src/generate.js cases/<案件名>/deck.json cases/<案件名>/提案.pptx` で生成（`docker compose run --rm generate node src/generate.js ...` でも可）。
4. PowerPoint で人間が最終調整（図表の差し込み・文言確認）。

`node src/validate.js` は簡易方言（slides.schema.json）専用のため、リッチデッキ方言のJSONには使えない。スキーマ検証は `generate.js` 実行時に内蔵の `validateDeck` が自動で行う（不正があれば生成前にエラー終了する）。
