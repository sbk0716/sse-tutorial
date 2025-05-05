// ロギングユーティリティ

// console警告を無視
/* eslint-disable no-console */

// 情報ログ
export const logInfo = (message: string): void => {
  console.log(`[${new Date().toISOString()}] INFO: ${message}`);
};

// エラーログ
export const logError = (message: string, error?: unknown): void => {
  console.error(`[${new Date().toISOString()}] ERROR: ${message}`, error || '');
};

// 警告ログ
export const logWarning = (message: string): void => {
  console.warn(`[${new Date().toISOString()}] WARNING: ${message}`);
};

// デバッグログ
export const logDebug = (message: string): void => {
  console.debug(`[${new Date().toISOString()}] DEBUG: ${message}`);
};

// SSE接続ログ
export const logSSEConnection = (clientId: number, clientIP: string, userInfo?: string): void => {
  const userText = userInfo ? ` - ユーザー: ${userInfo}` : '';
  logInfo(`SSE接続確立 - クライアントID: ${clientId} - クライアント: ${clientIP}${userText}`);
};

// SSE切断ログ
export const logSSEDisconnection = (
  clientId: number,
  duration: number,
  userInfo?: string
): void => {
  const userText = userInfo ? ` - ユーザー: ${userInfo}` : '';
  logInfo(`SSE接続終了 - クライアントID: ${clientId}${userText} - 接続時間: ${duration}秒`);
};

// ログインログ
export const logLogin = (
  username: string,
  success: boolean,
  reason: string,
  clientIP: string
): void => {
  if (success) {
    logInfo(`ログイン成功 - ユーザー: ${username} - 理由: ${reason} - クライアント: ${clientIP}`);
  } else {
    logWarning(
      `ログイン失敗 - ユーザー: ${username} - 理由: ${reason} - クライアント: ${clientIP}`
    );
  }
};

// メッセージ送信ログ
export const logMessageSent = (message: string, recipientCount: number, clientIP: string): void => {
  logInfo(
    `メッセージ送信 - 内容: "${message}" - 送信先: ${recipientCount}クライアント - 送信元: ${clientIP}`
  );
};