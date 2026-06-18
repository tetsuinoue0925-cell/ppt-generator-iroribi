# settings.json KB

> 収集日: 2026-06-17
> 要件: スライド設計 JSON → PptxGenJS で編集可能 .pptx 生成（Node.js + Docker、ローカル完結）

## ⚠ 重要な前提：deny ルールの限界

> このリストは出発点です。必ずユーザーが内容を確認・調整してください。

deny ルールはバイパスされ得る（複合コマンド・別パス・エンコード等）。settings の deny は多層防御の一層に過ぎず、これ単独で機密保護を保証しない。本プロジェクトはローカル完結・外部送信なし・実シークレット無しのため攻撃面は小さいが、`.env` 等のベースライン deny は今後の拡張に備えた衛生として置く。

## 技術スタック・環境

- 言語/フレームワーク: Node.js 20+ / JavaScript、PptxGenJS、ajv
- 実行環境: Docker（node:20-slim、docker-compose）。`input/` `output/` をボリュームマウント。
- チーム規模: 1人〜小チーム
- 主なコマンド（CLAUDE.md から抽出）:
  - `docker compose run --rm generate`
  - `docker compose build`
  - `npm ci` / `npm run generate` / `npm run validate`
  - `node src/generate.js`

## 既存スキルの allowed-tools

プロジェクト固有スキルは未生成（Skills ドメインは後続）。生成後に allowed-tools を allow へ反映する。

## 既存 settings.json の状態

- `.claude/settings.json`: スケルトン `{ "permissions": {} }`（マージ対象）
- `.claude/settings.local.json`: 本セッションで自動蓄積された Skill/Bash allow のみ（個人・gitignore 済み）。触らない。

## セキュリティ要件

> ⚠ このリストは出発点です。必ずユーザーが内容を確認・調整してください。

| ID | 出典 | 要件 | 想定する設定種別 |
|----|------|------|----------------|
| S1 | ベースライン | `.env` / `.env.*` の読み取り禁止（将来の拡張に備えた衛生） | deny |
| S2 | ベースライン | 認証情報ファイル（`*.pem` / `secrets/**` / `credentials*.json`）の読み取り禁止 | deny |
| S3 | ベースライン | 破壊的削除 `rm -rf *` の禁止 | deny |
| S4 | 要件定義 | `output/` の .pptx 上書きは起こり得る → 破壊ではないが注意（deny ではなく運用注意） | なし（CLAUDE.md で注意済み） |

外部連携なし・API キーなしのため、ネットワーク送信系（curl/webhook）の deny は必須ではないが、ベースラインとして任意。

## ベストプラクティス

### defaultMode の推奨

`acceptEdits` を推奨。理由: 1人〜小チームのローカルツール開発で、編集承認の都度プロンプトは非効率。破壊操作は deny でブロックする前提。

### env 設定の推奨

| 変数 | 推奨値 | 理由 |
|------|-------|------|
| BASH_DEFAULT_TIMEOUT_MS | "300000" | `docker compose build` / `npm ci` が既定 120s を超え得る。5分に延長。 |

シークレットは無し。env はチーム共有 settings.json に置いて問題ない。

### allow リストの最適化

CLAUDE.md のコマンドから導出した最小 allow:
- `Bash(docker compose *)` — 生成・ビルド
- `Bash(docker build *)` — 任意
- `Bash(npm ci)` / `Bash(npm run *)` / `Bash(npm install *)`
- `Bash(node *)`
- `Read` / `Edit` / `Write` はプロジェクト配下（`src/**` `input/**` `schema/**` `output/**` `prompts/**`）

### その他の推奨

- `$schema` の追加: 有効（IDE 補完・バリデーション）。`https://json.schemastore.org/claude-code-settings.json`
- `additionalDirectories`: 不要（単一プロジェクト・外部参照なし）
- settings.local.json に分離すべき項目: 現状なし（シークレット無し）。個人の自動蓄積 allow はそのまま local に残す。

## permissions 設定案

### deny（常に拒否）
- `Read(./.env)`、`Read(./.env.*)`
- `Read(./secrets/**)`、`Read(./**/*.pem)`、`Read(./**/credentials*.json)`
- `Bash(rm -rf *)`

### allow（自動承認）
- `Bash(docker compose *)`
- `Bash(docker build *)`
- `Bash(npm ci)`、`Bash(npm run *)`、`Bash(npm install *)`
- `Bash(node *)`
- `Edit(./src/**)`、`Edit(./input/**)`、`Edit(./schema/**)`、`Edit(./prompts/**)`
- `Write(./src/**)`、`Write(./input/**)`、`Write(./schema/**)`、`Write(./prompts/**)`、`Write(./output/**)`

### ask（都度確認）
- なし（git 運用は未確定。git push 等が必要になれば追加）

### defaultMode
- `acceptEdits`

## env 設定案
- `BASH_DEFAULT_TIMEOUT_MS`: "300000"（チーム共有 settings.json に記載）

## スコープ判断
- `.claude/settings.json`（チーム共有）: `$schema`、permissions（allow/deny/defaultMode）、env
- `.claude/settings.local.json`（個人）: 現状の自動蓄積 allow（触らない）。将来シークレットが出たらここ。
