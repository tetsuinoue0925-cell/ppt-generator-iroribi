---
name: md-to-deck-json
description: Markdown の資料原稿を、リッチデッキ形式（presentation/slides[].type）の deck JSON に変換したいときに使う。各セクションを適切なデッキ型（title-slide/section-title/bullet-list/table/two-column-tiled/timeline/highlight-numbers/qa-layout 等）へマッピングし、色や HTML を持たない綺麗な構造 JSON を input/ に書き出す。「この md からパワポ用 JSON を作って」「md をデッキ化して」「資料原稿を変換して」と言われたときに使う。
argument-hint: "<markdown-path> [theme] [output-json-path]"
disable-model-invocation: false
allowed-tools: "Read Write Bash(node *) Bash(ls *)"
---

この skill は以下の場面で使う：
- Markdown で書いた資料原稿から、リッチデッキ形式の `input/<name>_deck.json` を起こすとき
- Gemini/Canva を経由せず、Claude Code の中だけで MD → deck JSON → PPTX を完結させたいとき

`/generate-pptx` がこの deck JSON を読んで .pptx を生成する（形式は自動判定）。

## 最重要原則

- **色・フォント・座標は書かない。** それらはテーマ（`src/themes/`）が一元的に持つ。JSON は「構造」と「内容」だけを運ぶ。
- **HTML を埋め込まない。** 装飾は最小限（強調したい語だけ `<strong>…</strong>`）に留める。インライン `style=`、`<span>`、Font Awesome アイコン、色コードは入れない。
- **デザインを発明しない。** 各セクションを「どのデッキ型に落とすか」を決めるのが仕事。

## 前提確認

1. 変換元の Markdown（引数のパス、または会話で渡された原稿）。
2. テーマ名（引数 2 番目、または会話指定）。未指定なら既定 `iroribi`。
   - 選択肢を確認するには `node -e "console.log(require('./src/themes').listDeckThemes())"`。現状: `iroribi` / `navy` / `graphite`。
3. 出力先（引数 3 番目）。未指定なら `input/<md ファイル名>_deck.json`。

## デッキ型カタログ（このいずれかに必ずマッピングする）

| type | 使いどころ | content の主なキー |
|---|---|---|
| `title-slide` | 表紙（濃茶バンド＋ロゴ） | `h1`, `subtitle`, `date` |
| `toc` | 目次（番号付き） | `title?`, `items:[ "章名", ... ]` |
| `closing` | 末尾の締め（毎回末尾に1枚） | `title?`, `subtitle?`, `company?` |
| `section-title` | 章の区切り | `h2`, `p` |
| `bullet-list` | 要点を3〜5個の「見出し＋補足」で | `pre_text?`, `items:[{strong, subtext}]` |
| `table` | 比較・一覧・スケジュール | `pre_text?`, `headers:[]`, `rows:[{style, cells:[]}]`, `footer?` |
| `two-column-mixed` | 左右で性質が違う2要素（コード/チェックリスト/本文） | `pre_text?`, `left_column`, `right_column` |
| `two-column-tiled` | 対になる2枚のタイル | `pre_text?`, `tiles:[tile, tile]` |
| `tiled-content` | 並列な3項目 | `pre_text?`, `tiles:[t, t, t]`（`title`, `body`, `footer?`） |
| `timeline` | フェーズ・時系列 | `items:[{phase, title, description}]` |
| `highlight-numbers` | KPI・数値の強調 | `numbers:[{value, label, subtext}]`, `footer?` |
| `bleed-image` | 画像＋本文（画像はプレースホルダ） | `paragraphs:[]`, `highlight_quote?`, `subtext?`, `html_list?` |
| `qa-layout` | 締め・次アクション・Q&A | `title`, `description`, `items:[]` |

- `header` は表紙・章区切り以外の各スライド共通で `{ tag, h2 }`。`tag` は短い英大文字ラベル、`h2` はそのスライドの主張（1〜2文）。
- 強調行（表）は `row.style: "background-color: #FFF3E0;"` のように**強調指定のみ**許可（テーマが解釈する）。任意の色指定はしない。

## 手順

1. Markdown を Read し、見出し（`#`/`##`）単位でスライドに分解する。
2. 各セクションを上のカタログから1つの `type` に割り当てる:
   - 表 → `table`、フェーズ → `timeline`、KPI → `highlight-numbers`、対比 → `two-column-tiled`、並列3点 → `tiled-content`、要点列挙 → `bullet-list`、章扉 → `section-title`、締め → `qa-layout`。
   - 迷ったら最も近い型へ寄せる。新型を発明しない。
3. 各スライドを `{ id, type, header?, content }` で組み立てる。`speaker_notes` があれば添える。
4. 先頭に `presentation: { title, date?, company?, theme }` を置く（`theme` は確認したテーマ名）。
5. 全体を1つの JSON にまとめ、出力先に Write する。
6. `node src/generate.js <出力 JSON> output/<name>.pptx` で生成（検証は generate 内で実行される）。エラー・未処理スライドの警告が出たら修正して再生成。
7. スライド枚数・各 type の割り当て・使用テーマを要約して報告する。

## テーマのブラッシュアップ（聞かれたら案内する）

- 色を変える → `src/themes/<name>.js` の役割キー（`primary`/`accent`/`panelBg` 等）を編集。全テーマ共通キーは `src/themes/index.js` 冒頭のコントラクト参照。
- 新テーマを足す → `src/themes/<name>.js` を作りキーを全部埋め、`index.js` の registry に追加。
- 配置（位置・余白・サイズ）を変える → `src/layouts-deck/<type>.js`（1型=1ファイル）を編集。
- 確認は全型を網羅した `input/_theme_sampler_deck.json` を各テーマで生成して見比べる:
  `DECK_THEME=<name> node src/generate.js input/_theme_sampler_deck.json output/_sampler_<name>.pptx`

## 出力

- 保存先: `input/<name>_deck.json`（または引数指定）
- 形式: リッチデッキ形式の構造 JSON（色・HTML を持たない）

## 注意

- 色・フォント・座標・HTML を JSON に持ち込まない（テーマと layout が持つ）。
- 未対応 type を作らない。カタログ内に必ず寄せる。
- 画像は外部取得しない（`bleed-image` はプレースホルダになる）。ローカル画像を使いたい場合は別途相談。
