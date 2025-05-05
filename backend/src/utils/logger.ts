// ロギングユーティリティ
// このファイルはアプリケーション全体で使用されるログ出力関数を提供します
// SSE接続のライフサイクルやイベント送信などの重要な操作をログに記録します

// console警告を無視
// TypeScriptのESLint設定に関連するコメントです
/* eslint-disable no-console */

// 情報ログ
// 一般的な情報メッセージをログに記録します
// サーバー起動、接続確立などの正常な操作に使用されます
export const logInfo = (message: string): void => {
  // タイムスタンプ付きでINFOレベルのログを出力します
  console.log(`[${new Date().toISOString()}] INFO: ${message}`);
};

// エラーログ
// エラー情報をログに記録します
// 例外、接続エラーなどの問題が発生した場合に使用されます
export const logError = (message: string, error?: unknown): void => {
  // タイムスタンプ付きでERRORレベルのログを出力します
  // エラーオブジェクトがある場合は、それも出力します
  console.error(`[${new Date().toISOString()}] ERROR: ${message}`, error || "");
};

// 警告ログ
// 警告情報をログに記録します
// 潜在的な問題や注意が必要な状況に使用されます
export const logWarning = (message: string): void => {
  // タイムスタンプ付きでWARNINGレベルのログを出力します
  console.warn(`[${new Date().toISOString()}] WARNING: ${message}`);
};

// デバッグログ
// デバッグ情報をログに記録します
// 開発中の詳細な情報や変数の値などを出力するために使用されます
export const logDebug = (message: string): void => {
  // タイムスタンプ付きでDEBUGレベルのログを出力します
  console.debug(`[${new Date().toISOString()}] DEBUG: ${message}`);
};

// SSE接続ログ
// SSE接続が確立されたときにログを記録します
// クライアントID、IPアドレス、オプションでユーザー情報を記録します
export const logSSEConnection = (
  clientId: number,
  clientIP: string,
  userInfo?: string,
): void => {
  // ユーザー情報がある場合（認証済みSSE）は、それをログに含めます
  const userText = userInfo ? ` - ユーザー: ${userInfo}` : "";
  // SSE接続確立をINFOレベルでログに記録します
  logInfo(
    `SSE接続確立 - クライアントID: ${clientId} - クライアント: ${clientIP}${userText}`,
  );
};

// SSE切断ログ
// SSE接続が終了したときにログを記録します
// クライアントID、接続時間（秒）、オプションでユーザー情報を記録します
export const logSSEDisconnection = (
  clientId: number,
  duration: number,
  userInfo?: string,
): void => {
  // ユーザー情報がある場合（認証済みSSE）は、それをログに含めます
  const userText = userInfo ? ` - ユーザー: ${userInfo}` : "";
  // SSE接続終了をINFOレベルでログに記録します
  logInfo(
    `SSE接続終了 - クライアントID: ${clientId}${userText} - 接続時間: ${duration}秒`,
  );
};

// ログインログ
// ユーザーのログイン試行をログに記録します
// ユーザー名、成功/失敗、理由、クライアントIPを記録します
export const logLogin = (
  username: string,
  success: boolean,
  reason: string,
  clientIP: string,
): void => {
  // ログイン成功の場合
  if (success) {
    // ログイン成功をINFOレベルでログに記録します
    logInfo(
      `ログイン成功 - ユーザー: ${username} - 理由: ${reason} - クライアント: ${clientIP}`,
    );
  } else {
    // ログイン失敗をWARNINGレベルでログに記録します
    // セキュリティ上の理由から、失敗したログイン試行は警告として記録されます
    logWarning(
      `ログイン失敗 - ユーザー: ${username} - 理由: ${reason} - クライアント: ${clientIP}`,
    );
  }
};

// メッセージ送信ログ
// SSEクライアントへのメッセージ送信をログに記録します
// メッセージ内容、送信先クライアント数、送信元IPを記録します
export const logMessageSent = (
  message: string,
  recipientCount: number,
  clientIP: string,
): void => {
  // メッセージ送信をINFOレベルでログに記録します
  // メッセージ内容、送信先クライアント数、送信元IPアドレスを含みます
  logInfo(
    `メッセージ送信 - 内容: "${message}" - 送信先: ${recipientCount}クライアント - 送信元: ${clientIP}`,
  );
};
