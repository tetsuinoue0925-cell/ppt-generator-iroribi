# ppt-generator

スライド設計 JSON から、編集可能な PowerPoint (.pptx) を生成するツール。
PptxGenJS でテーマ・レイアウトをコード定義し、JSON を流し込んで .pptx を出力する。

> このリポジトリは **テンプレート**。右上の「**Use this template**」から自分用のリポジトリを作るか、clone して使う。
> 使い方は自由。下のどの方法で動かしても構わない。

---

## 動かす（好きな方法でOK）

### A. devcontainer（セットアップ不要・おすすめ）

VS Code に [Dev Containers 拡張](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) を入れてフォルダを開き「**Reopen in Container**」。
または CLI で:

```bash
npm i -g @devcontainers/cli
devcontainer up --workspace-folder .
devcontainer exec --workspace-folder . bash
```

初回はイメージ取得＋`npm ci` が自動で走る（数分）。

### B. ローカルの Node で直接

Node 20+ があれば、そのまま動く。

```bash
npm ci
npm run generate     # input/slides.json → output/proposal.pptx
npm run validate     # 入力 JSON のスキーマ検証のみ
```

### C. Docker で一発生成（Node を入れたくないとき）

```bash
docker compose run --rm generate
docker compose run --rm validate
```

いずれも出力は `output/*.pptx`。PowerPoint で開いて微調整する。

> 本文フォントは `BIZ UDPGothic` 前提。未インストールの環境では代替フォントで表示される（[BIZ UDゴシックは無料配布](https://fonts.google.com/specimen/BIZ+UDPGothic)）。

---

## 資料を作る流れ

1. Markdown で資料原稿を書く
2. `/md-to-deck-json`（Claude Code）で deck JSON に変換（色や HTML は持たせない）
3. パス指定で .pptx 生成（入力形式は自動判定）:

```bash
node src/generate.js <入力>.json <出力>.pptx
# 例: node src/generate.js cases/案件A/deck.json cases/案件A/提案.pptx
```

案件ごとの原稿・生成物は `cases/<案件名>/` にまとめると整理しやすい（`cases/` は git 追跡しない設定）。
サンプル入力は `input/`（`_theme_sampler_deck.json` 等）。詳細は [`cases/README.md`](cases/README.md)。

### テーマ

`presentation.theme`（または env `DECK_THEME`）で選択。現状 `iroribi` / `navy` / `graphite`。

**自分のブランドでテーマを作れる。** テーマファイルを1つ足すだけで全レイアウトがその配色で描ける（レイアウトのコードは触らない）。作り方と Claude Code への頼み方は [`CLAUDE.md` の「自分のテーマを作る」](CLAUDE.md#自分のテーマを作る拡張ガイド) を参照。

---

## 生成物の検査（デバッグ時）

生成 pptx は zip。中の XML が整形式かを確認できる:

```bash
unzip -l output/proposal.pptx                              # 中身一覧
unzip -p output/proposal.pptx ppt/slides/slide1.xml \
  | xmllint --noout -                                      # XML 整形式チェック
```

---

## 詳細

設計思想・入力 JSON の形・テーマ/レイアウトのブラッシュアップ手順は [`CLAUDE.md`](CLAUDE.md) を参照。
