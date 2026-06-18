# ppt-generator

スライド設計 JSON から、編集可能な PowerPoint (.pptx) を生成するツール。
PptxGenJS でテーマ・レイアウトをコード定義し、JSON を流し込んで .pptx を出力する。

---

## ⚠️ 開発はすべてコンテナ内で行う（ホストに何も入れない）

このリポジトリは **devcontainer 前提**。ホストに Node や依存をインストールしない。
clone したら、まずコンテナを開いてからすべての作業（編集・生成・検査）を行う。

### コンテナを開く

- **VS Code**: [Dev Containers 拡張](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)を入れてフォルダを開くと「**Reopen in Container**」が提案される。実行する。
- **CLI**: 
  ```bash
  npm i -g @devcontainers/cli
  devcontainer up --workspace-folder .
  devcontainer exec --workspace-folder . bash   # コンテナ内シェルへ
  ```

初回はイメージ取得＋`npm ci` が自動で走る（数分）。依存（`node_modules`）は
名前付きボリュームに隔離され、**ホストには漏れない**。

### コンテナ内での操作

```bash
npm run generate     # input/slides.json → output/proposal.pptx
npm run validate     # 入力 JSON のスキーマ検証のみ
```

出力 `output/*.pptx` は workspace 経由でホストにも見えるので、ホストの PowerPoint で開ける。

### コンテナに入らず一発生成だけしたいとき（バッチ）

```bash
docker compose run --rm generate
docker compose run --rm validate
```

> ローカル Node 直実行（`node src/generate.js`）はしない。ホストを汚さないため、必ず上記いずれかを使う。

---

## 案件の進め方（このリポジトリは「変換エンジン」）

このリポジトリは **パワポを作る変換エンジン**に徹する。案件ごとの原稿（md）や要件定義・生成物は
**`cases/` 配下**に置き、git では追跡しない（テンプレに機密や案件成果物を混ぜない）。

```
cases/<案件名>/
  原稿.md          # 資料原稿（Markdown）
  deck.json        # /md-to-deck-json で起こしたデッキ JSON
  提案.pptx        # 生成物
```

生成は入力／出力パスを明示して実行する:

```bash
# devcontainer 内
node src/generate.js cases/<案件名>/deck.json cases/<案件名>/提案.pptx

# バッチ（./cases はマウント済み）
docker compose run --rm generate node src/generate.js cases/<案件名>/deck.json cases/<案件名>/提案.pptx
```

サンプル／テンプレ確認用の入力は `input/`（`_theme_sampler_deck.json` 等）に置く。詳細は [`cases/README.md`](cases/README.md)。

---

## 生成物の検査（デバッグ時）

生成 pptx は zip。中の XML が整形式かは、コンテナ内の標準ツールで確認する（PowerShell 等の代用は使わない）。

```bash
unzip -l output/proposal.pptx                              # 中身一覧
unzip -p output/proposal.pptx ppt/slides/slide1.xml \
  | xmllint --noout -                                      # XML 整形式チェック
```

---

## 詳細

設計思想・入力 JSON の形・テーマ/レイアウトのブラッシュアップ手順は [`CLAUDE.md`](CLAUDE.md) を参照。
