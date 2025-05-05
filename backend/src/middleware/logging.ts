import { Request, Response, NextFunction } from "express";

// ExpressRequestを拡張してstartTimeプロパティを追加
declare module "express" {
  interface Request {
    startTime?: number;
  }
}

// ロギングミドルウェア - リクエスト開始時のログ
export const loggingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // console警告を無視
  /* eslint-disable no-console */

  // リクエスト開始時間を記録
  req.startTime = Date.now();

  // リクエスト情報をログに出力
  const clientIP =
    req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.url} - クライアント: ${clientIP}`,
  );

  // リクエストヘッダーとボディをログに出力（機密情報は除外）
  if (req.method !== "GET" && req.body) {
    const safeBody = { ...req.body };
    // パスワードなどの機密情報をマスク
    if (safeBody.password) safeBody.password = "********";

    console.log(
      `[${new Date().toISOString()}] リクエストボディ: ${JSON.stringify(safeBody)}`,
    );
  }

  // レスポンス完了時のログ
  const originalEnd = res.end;

  // @ts-expect-error - Expressの型定義と互換性を持たせるため
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  res.end = function (chunk: any, encoding: any, callback: any) {
    const responseTime = Date.now() - (req.startTime || Date.now());
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.url} - ステータス: ${res.statusCode} - 処理時間: ${responseTime}ms`,
    );
    return originalEnd.call(this, chunk, encoding, callback);
  };

  next();
};
