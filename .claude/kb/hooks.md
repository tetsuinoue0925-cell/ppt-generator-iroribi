# hooks KB

> 収集日: 2026-06-17
> 要件: スライド設計 JSON → PptxGenJS で編集可能 .pptx 生成（Node.js + Docker、ローカル完結、Windows ホスト）

---

> ⚠ このリストは出発点です。必ずユーザーが内容を確認・調整してください。
> hooks はハード強制されるため、誤設定で作業が止まるリスクがあります。

## 総合評価：hooks の必要性は低い

このプロジェクトは hooks を積極的に必要としない。理由:
- **セキュリティ**: `.env`/秘密ファイル保護・`rm -rf` 禁止は既に `settings.json` の `deny` でハード強制済み。PreToolUse セキュリティフックは重複。
- **自動化**: フォーマッタ（prettier/eslint）は package.json 未採用、テストスイートも未定義のため PostToolUse の自動整形・自動テストの対象が無い。
- **環境リスク**: Windows ホスト（PowerShell 主）でシェル系フックは環境差異に弱く壊れやすい。OS ニュートラル化（node スクリプト）すれば回避可能だが、得られる価値が小さい。

→ **初期は hooks 無しを推奨。** 必要になったら `/init-hooks` で後から追加できる。

## 技術スタック・環境

- 言語/フレームワーク: Node.js 20+ / JavaScript、PptxGenJS、ajv
- 主なコマンド: `docker compose run --rm generate` / `npm run generate` / `npm run validate`
- 既存の .claude/hooks/: なし
- フォーマッタ候補: package.json 未生成。prettier/eslint は現時点で未採用。

## 既存 hooks の状態

なし（settings.json に hooks セクション無し）。

## インシデント防止要件（セキュリティ hooks）

| ID | 出典 | 防止したいインシデント | フック種別 | ブロック可否 | 備考 |
|----|------|---------------------|-----------|------------|------|
| H1 | ベースライン | `.env`/秘密ファイルの読み取り | PreToolUse | 可 | settings deny で既にカバー済み。フック不要。 |
| H2 | ベースライン | `rm -rf` 破壊的削除 | PreToolUse | 可 | settings deny で既にカバー済み。フック不要。 |

## セキュリティ hooks 案（Phase 1）

なし（settings.json の deny で十分。重複フックは追加しない）。

## ベストプラクティス（自動化 hooks）

### 自動化 hooks 案（Phase 2）

| 用途 | イベント | matcher | コマンド概要 | 優先度 | 前提条件 |
|------|---------|---------|------------|--------|---------|
| slides.json スキーマ検証 | PostToolUse | Write\|Edit | `input/*.json` 編集後に ajv で検証し stderr へ結果 | 低（任意） | ローカルに node_modules/ajv が必要。無いと失敗 → `\|\| true` 必須。OS ニュートラルに node スクリプトで実装。 |

その他（フォーマッタ・テスト）は対象ライブラリ/スイートが無いため候補なし。

### timeout / async の推奨設定

| フック種別 | 推奨 timeout | async | 理由 |
|-----------|-------------|-------|------|
| PostToolUse（JSON検証・任意採用時） | 10s | true | 作業を止めない。失敗は非ブロッキング。 |

### エラーハンドリング方針

採用する場合も `|| true` でガードし最後は exit 0。node_modules 未インストール環境で落ちないこと。OS ニュートラル化のため bash でなく `node .claude/hooks/*.js` で実装。

## スクリプト配置計画

初期は配置なし。採用時のみ `.claude/hooks/validate-slides.js`。

## 実装方針

| 項目 | 方針 |
|------|------|
| スクリプト言語 | （採用時）Node.js。Windows/Docker 両対応で OS ニュートラル。 |
| インライン vs 外部 | stdin JSON 解析が要るため外部スクリプト |
| Phase 2 実行 | async: true で非ブロッキング |
| チーム共有 | $CLAUDE_PROJECT_DIR を使用 |

## settings.json hooks セクション 構成案

初期は空（hooks セクションを追加しない）。
採用する場合の参考:
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          { "type": "command", "command": "node \"$CLAUDE_PROJECT_DIR/.claude/hooks/validate-slides.js\"", "async": true, "timeout": 10 }
        ]
      }
    ]
  }
}
```
