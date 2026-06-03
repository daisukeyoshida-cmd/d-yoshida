/**
 * Gmail メール仕分けメイン処理
 *
 * 手動実行: sortEmails() を直接実行
 * 自動実行: setupTrigger() でトリガーを登録（15分ごとに自動仕分け）
 */

/**
 * メイン仕分け処理
 */
function sortEmails() {
  var startTime = new Date();
  var totalLabeled = 0;

  Logger.log("=== メール仕分け開始: " + startTime.toLocaleString() + " ===");

  RULES.forEach(function(rule) {
    try {
      var count = applyRule(rule);
      totalLabeled += count;
      Logger.log("[" + rule.name + "] " + count + " 件に適用");
    } catch (e) {
      Logger.log("[ERROR] ルール「" + rule.name + "」の処理中にエラー: " + e.message);
    }
  });

  var elapsed = (new Date() - startTime) / 1000;
  Logger.log("=== 完了: 合計 " + totalLabeled + " 件, 処理時間 " + elapsed.toFixed(1) + " 秒 ===");
}

/**
 * 1つのルールを未読・受信トレイのスレッドに適用する
 * @param {Object} rule - RULES の1要素
 * @returns {number} ラベルを付けたスレッド数
 */
function applyRule(rule) {
  var label = getOrCreateLabel(rule.label);
  var threads = fetchCandidateThreads(rule);
  var count = 0;

  threads.forEach(function(thread) {
    if (matchesRule(thread, rule)) {
      label.addToThread(thread);
      if (rule.archiveAfterLabel) {
        thread.moveToArchive();
      }
      count++;
    }
  });

  return count;
}

/**
 * ルールの条件に基づいてGmail検索クエリを構築し、候補スレッドを取得する
 * @param {Object} rule
 * @returns {GmailThread[]}
 */
function fetchCandidateThreads(rule) {
  var queries = [];

  // 日付フィルター
  var sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - MAX_DAYS_OLD);
  var dateStr = Utilities.formatDate(sinceDate, "UTC", "yyyy/MM/dd");
  queries.push("after:" + dateStr);

  // ラベル未付与のスレッドのみ対象
  queries.push("-label:" + sanitizeLabelForQuery(rule.label));

  // From条件があればGmailの検索クエリで事前フィルタリング（効率化）
  var fromConditions = rule.conditions.filter(function(c) { return c.type === "from"; });
  if (fromConditions.length === 1 && rule.matchAll) {
    queries.push("from:" + fromConditions[0].value);
  }

  var query = queries.join(" ");
  return GmailApp.search(query, 0, BATCH_SIZE);
}

/**
 * スレッドがルールの条件を満たすか判定する
 * @param {GmailThread} thread
 * @param {Object} rule
 * @returns {boolean}
 */
function matchesRule(thread, rule) {
  var messages = thread.getMessages();
  var matchAll = (rule.matchAll !== false); // デフォルトtrue

  var results = rule.conditions.map(function(condition) {
    return messages.some(function(message) {
      return matchesCondition(message, condition);
    });
  });

  if (matchAll) {
    return results.every(function(r) { return r; });
  } else {
    return results.some(function(r) { return r; });
  }
}

/**
 * 1通のメッセージが1つの条件を満たすか判定する
 * @param {GmailMessage} message
 * @param {Object} condition - { type, value }
 * @returns {boolean}
 */
function matchesCondition(message, condition) {
  var value = condition.value.toLowerCase();

  switch (condition.type) {
    case "from":
      return message.getFrom().toLowerCase().indexOf(value) !== -1;
    case "subject":
      return message.getSubject().toLowerCase().indexOf(value) !== -1;
    case "body":
      return message.getPlainBody().toLowerCase().indexOf(value) !== -1;
    default:
      Logger.log("[WARN] 不明な条件タイプ: " + condition.type);
      return false;
  }
}

/**
 * ラベルを取得または作成する（ネストラベル対応）
 * @param {string} labelName - "親/子" 形式も可
 * @returns {GmailLabel}
 */
function getOrCreateLabel(labelName) {
  var label = GmailApp.getUserLabelByName(labelName);
  if (!label) {
    label = GmailApp.createLabel(labelName);
    Logger.log("[INFO] ラベルを新規作成: " + labelName);
  }
  return label;
}

/**
 * ラベル名をGmail検索クエリ用にエスケープする
 * @param {string} labelName
 * @returns {string}
 */
function sanitizeLabelForQuery(labelName) {
  // スペースをハイフンに置換、スラッシュをそのまま使用
  return '"' + labelName.replace(/\s+/g, "-") + '"';
}
