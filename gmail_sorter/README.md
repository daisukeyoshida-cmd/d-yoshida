# Gmail メール仕分けツール (Google Apps Script)

送信者・件名・本文キーワードを条件にGmailラベルへ自動仕分けするスクリプトです。

## セットアップ手順

### 1. Google Apps Script プロジェクトを作成

1. [Google Apps Script](https://script.google.com) を開く
2. 「新しいプロジェクト」を作成
3. プロジェクト名を「Gmail仕分け」などに変更

### 2. ファイルを追加

Apps Script エディタで「+」ボタンからスクリプトファイルを追加し、以下の3ファイルの内容を貼り付けてください。

| ファイル名 | 内容 |
|-----------|------|
| `config.gs` | 仕分けルールの設定 |
| `sorter.gs` | 仕分けのメイン処理 |
| `trigger.gs` | 自動実行トリガーの管理 |

### 3. 仕分けルールを設定

`config.gs` の `RULES` 配列を編集してください。

```javascript
{
  name: "ルール名（ログ用）",
  label: "付与するラベル名",   // "親/子" 形式でネスト可
  matchAll: true,              // true=AND条件, false=OR条件
  archiveAfterLabel: false,    // true=ラベル付け後にアーカイブ
  conditions: [
    { type: "from",    value: "@example.com" },   // 送信者
    { type: "subject", value: "キーワード" },      // 件名
    { type: "body",    value: "本文キーワード" }   // 本文
  ]
}
```

### 4. 初回実行（権限の許可）

1. エディタで `sortEmails` 関数を選択して「実行」
2. 権限の確認ダイアログで「許可」をクリック
3. ログパネルで処理結果を確認

### 5. 自動実行の設定（任意）

`setupTrigger` 関数を実行すると、15分ごとに自動で仕分けが実行されます。

## ルール設定例

### AND条件（全て一致）

```javascript
{
  name: "社内通知",
  label: "社内/通知",
  matchAll: true,
  conditions: [
    { type: "from", value: "@yourcompany.com" },
    { type: "subject", value: "【通知】" }
  ]
}
```

### OR条件（いずれか一致）

```javascript
{
  name: "メルマガ",
  label: "メルマガ",
  matchAll: false,
  archiveAfterLabel: true,
  conditions: [
    { type: "subject", value: "メールマガジン" },
    { type: "subject", value: "newsletter" },
    { type: "body", value: "配信停止" }
  ]
}
```

## 設定パラメータ

`config.gs` の先頭で以下を変更できます。

| 変数 | デフォルト | 説明 |
|------|-----------|------|
| `BATCH_SIZE` | 50 | 1回の実行で処理するスレッド数 |
| `MAX_DAYS_OLD` | 30 | 処理対象とする最大経過日数 |
