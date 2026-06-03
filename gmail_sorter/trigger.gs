/**
 * トリガー管理
 * Google Apps Script エディタから一度だけ実行してください。
 */

/**
 * 15分ごとに sortEmails を自動実行するトリガーを登録する
 * ※重複登録を防ぐため、既存のトリガーを削除してから登録します
 */
function setupTrigger() {
  deleteTriggers();

  ScriptApp.newTrigger("sortEmails")
    .timeBased()
    .everyMinutes(15)
    .create();

  Logger.log("トリガーを登録しました（15分ごとに自動実行）");
}

/**
 * 登録済みのトリガーをすべて削除する
 */
function deleteTriggers() {
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === "sortEmails") {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  Logger.log("既存のトリガーを削除しました");
}
