// ロギングミドルウェアファイル
// このファイルはすべてのHTTPリクエストとレスポンスをログに記録するミドルウェアを提供します
// SSE接続を含むすべてのリクエストの監視とデバッグに役立ちます
import { Request, Response, NextFunction } from "express";

// ExpressRequestを拡張してstartTimeプロパティを追加
// これにより、リクエスト処理時間を計算できます
declare module "express" {
  interface Request {
    startTime?: number;
  }
}

// ロギングミドルウェア - リクエスト開始時のログ
// このミドルウェアはすべてのリクエストに適用され、リクエストとレスポンスの情報をログに記録します
// SSE接続のデバッグに特に役立ちます
export const loggingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // console警告を無視
  // TypeScriptのESLint設定に関連するコメントです
  /* eslint-disable no-console */

  // リクエスト開始時間を記録
  // これを使用して、リクエスト処理にかかった時間を計算します
  req.startTime = Date.now();

  // リクエスト情報をログに出力
  // メソッド（GET, POST等）、URL、クライアントIPアドレスを記録します
  const clientIP =
    req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.url} - クライアント: ${clientIP}`,
  );

  // リクエストヘッダーとボディをログに出力（機密情報は除外）
  // GETリクエスト以外（POST, PUT等）でボディがある場合にログに記録します
  if (req.method !== "GET" && req.body) {
    // ボディのコピーを作成して、機密情報をマスクします
    const safeBody = { ...req.body };
    // パスワードなどの機密情報をマスク
    // セキュリティのため、パスワードは実際の値ではなくアスタリスクで表示します
    if (safeBody.password) safeBody.password = "********";

    // 安全なボディをログに出力します
    console.log(
      `[${new Date().toISOString()}] リクエストボディ: ${JSON.stringify(safeBody)}`,
    );
  }

  // レスポンス完了時のログ
  // res.endメソッドをオーバーライドして、レスポンス送信時に処理時間とステータスコードをログに記録します
  const originalEnd = res.end;

  // @ts-expect-error - Expressの型定義と互換性を持たせるため
  // TypeScriptの型チェックを一時的に無効にするコメントです
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  res.end = function (chunk: any, encoding: any, callback: any) {
    // リクエスト処理時間を計算します（ミリ秒単位）
    const responseTime = Date.now() - (req.startTime || Date.now());
    // レスポンス情報をログに出力します
    // メソッド、URL、ステータスコード、処理時間を記録します
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.url} - ステータス: ${res.statusCode} - 処理時間: ${responseTime}ms`,
    );
    // 元のres.endメソッドを呼び出して、レスポンスを実際に送信します
    return originalEnd.call(this, chunk, encoding, callback);
  };

  // 次のミドルウェアまたはルートハンドラーに処理を渡します
  next();
};
