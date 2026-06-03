/**
 * Gmail メール仕分けルール設定
 *
 * rules 配列に仕分けルールを追加してください。
 * 各ルールは以下のプロパティを持ちます:
 *   name       : ルール名（ログ用）
 *   label      : 適用するGmailラベル名（存在しない場合は自動作成）
 *   conditions : 条件オブジェクトの配列（AND条件）
 *     - type  : "from" | "subject" | "body"
 *     - value : 検索文字列（部分一致、大文字小文字を無視）
 *   matchAll   : true=全条件一致(AND) / false=いずれか一致(OR)  ※省略時はtrue
 *   archiveAfterLabel : true=ラベル付け後に受信トレイからアーカイブ ※省略時はfalse
 */
var RULES = [
  {
    name: "社内通知",
    label: "社内/通知",
    matchAll: true,
    archiveAfterLabel: false,
    conditions: [
      { type: "from", value: "@yourcompany.com" },
      { type: "subject", value: "【通知】" }
    ]
  },
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
  },
  {
    name: "請求書",
    label: "経理/請求書",
    matchAll: false,
    archiveAfterLabel: false,
    conditions: [
      { type: "subject", value: "請求書" },
      { type: "subject", value: "invoice" },
      { type: "body", value: "ご請求金額" }
    ]
  }
];

/** 一度に処理するスレッド数（API制限対策） */
var BATCH_SIZE = 50;

/** 処理対象にするメールの最大日数（古すぎるメールを除外） */
var MAX_DAYS_OLD = 30;
