# cases/ — 案件作業場（git 追跡しない）

このディレクトリは**個別案件の作業場**です。`md` 原稿・`deck.json`・生成した `.pptx` を
案件ごとのサブフォルダにまとめて置きます。

- このフォルダの中身は **git で追跡しません**（`.gitignore` で除外）。
  顧客向け提案など機密が、テンプレ（エンジン）リポジトリに混ざらないようにするためです。
- テンプレ本体（`src/` `schema/` `assets/` `input/` のサンプル等）だけが共有・再利用されます。

## 使い方

```
cases/
  <案件名>/
    原稿.md          # 資料原稿（Markdown）
    deck.json        # /md-to-deck-json で起こしたデッキ JSON（色・HTML を持たせない）
    提案.pptx        # 生成物
```

生成（devcontainer 内）:

```bash
node src/generate.js cases/<案件名>/deck.json cases/<案件名>/提案.pptx
```

生成（バッチ / compose。`./cases` はマウント済み）:

```bash
docker compose run --rm generate node src/generate.js cases/<案件名>/deck.json cases/<案件名>/提案.pptx
```

> サンプル／テンプレ確認用の入力は `input/`（`_theme_sampler_deck.json` 等）に置きます。
> 案件の中身は必ずこの `cases/` 側へ。
