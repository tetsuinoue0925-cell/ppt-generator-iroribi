# スライド設計 JSON 生成プロンプト（Gemini / Claude 用）

Gemini Canvas や Claude に初稿の構成を作らせたあと、**HTML ではなくこの JSON** で出力させるための雛形。
出力された JSON は `input/slides.json` に保存し、`/generate-pptx`（または `docker compose run --rm generate`）で .pptx 化する。

---

## 貼り付け用プロンプト

```
あなたはプレゼン構成の構造化担当です。以下の内容を、指定スキーマに厳密に従う JSON だけで出力してください。
HTML・Markdown・装飾・コードフェンス・説明文は一切付けず、JSON 本体のみを返してください。

# ルール
- 装飾（色・フォント・座標）は出力しない。内容と強調点だけを構造化する。
- 各スライドは layout / title / message / elements / speaker_notes を持つ。
- layout は次のいずれかのみ: "title" / "message" / "cards_3"
  - title:    表紙。elements.subtitle（任意）。
  - message:  1メッセージ + 補足。message に主張、elements.bullets に補足（3点程度、文字列配列）。
  - cards_3:  3項目の比較・並列。elements.cards に {title, body} を最大3つ。
- どの型にも当てはまらない内容は、最も近い型に寄せる（新しい型を勝手に作らない）。
- speaker_notes に発表メモを 1〜2 文で入れる。

# 出力スキーマ（例）
{
  "meta": { "title": "資料タイトル", "author": "作成者" },
  "slides": [
    { "layout": "title", "title": "...", "elements": { "subtitle": "..." }, "speaker_notes": "..." },
    { "layout": "message", "title": "...", "message": "...", "elements": { "bullets": ["...", "...", "..."] }, "speaker_notes": "..." },
    { "layout": "cards_3", "title": "...", "elements": { "cards": [ {"title":"...","body":"..."}, {"title":"...","body":"..."}, {"title":"...","body":"..."} ] }, "speaker_notes": "..." }
  ]
}

# 変換対象の内容
（ここに構成案・アウトライン・初稿テキストを貼る）
```

---

## 使い方

1. 上記プロンプトの末尾に構成案を貼って Gemini/Claude に渡す。
2. 返ってきた JSON を `input/slides.json` に保存。
3. `docker compose run --rm validate` でスキーマ検証（任意）。
4. `docker compose run --rm generate` で `output/proposal.pptx` を生成。

新しいレイアウトが必要になったら、先に `/add-layout` で型を追加してからプロンプトの layout 候補に加える。
