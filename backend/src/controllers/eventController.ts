import { Request, Response } from "express";
import { MAX_CLIENTS } from "../config/index";
import { clients, addClient, removeClient } from "../models/client";
import { sendEvent, sendMissedEvents } from "../models/event";
import {
  logSSEConnection,
  logSSEDisconnection,
  logInfo,
} from "../utils/logger";

// Node.jsのsetTimeoutとclearTimeoutを明示的に型定義
declare const setTimeout: (callback: () => void, ms: number) => number;
declare const clearTimeout: (timeoutId: number) => void;

// SSE接続コントローラー（認証不要）
export const connectSSE = (req: Request, res: Response): void => {
  const clientIP =
    req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
  logInfo(`SSE接続要求 - エンドポイント: /events - クライアント: ${clientIP}`);

  // 接続数の制限チェック
  if (clients.length >= MAX_CLIENTS) {
    logInfo(
      `SSE接続拒否 - 最大接続数(${MAX_CLIENTS})に到達 - クライアント: ${clientIP}`,
    );
    res.status(503).send("サーバーが混雑しています。後でお試しください。");
    return;
  }

  // SSEのヘッダー設定
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  // 再接続間隔の設定（ミリ秒）
  res.write("retry: 3000\n\n");

  // クライアントにID付与
  const clientId = Date.now();
  logSSEConnection(clientId, clientIP as string);

  // Last-Event-IDヘッダーの確認
  const lastEventId = req.headers["last-event-id"];
  if (lastEventId) {
    logInfo(
      `Last-Event-ID検出 - クライアントID: ${clientId} - ID: ${lastEventId}`,
    );
    sendMissedEvents(res, parseInt(lastEventId as string));
  }

  // クライアント配列に追加
  addClient({
    id: clientId,
    res,
  });

  // 接続確立メッセージ
  sendEvent(res, "system", { type: "info", message: "接続が確立されました" });

  // タイムアウト設定（30分）
  const timeout = setTimeout(
    () => {
      const index = clients.findIndex((client) => client.id === clientId);
      if (index !== -1) {
        logInfo(
          `SSE接続タイムアウト - クライアントID: ${clientId} - 接続時間: 30分`,
        );
        removeClient(clientId);
        res.end();
      }
    },
    30 * 60 * 1000,
  );

  // クライアントが切断した時の処理
  req.on("close", () => {
    clearTimeout(timeout);
    const connectionDuration = Math.round((Date.now() - clientId) / 1000);
    logSSEDisconnection(clientId, connectionDuration);

    // クライアント配列から削除
    removeClient(clientId);
  });
};

// 認証付きSSE接続コントローラー
export const connectSecureSSE = (req: Request, res: Response): void => {
  const clientIP =
    req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
  const user = req.user;

  logInfo(
    `認証済みSSE接続要求 - エンドポイント: /secure-events - ユーザー: ${user?.username} - クライアント: ${clientIP}`,
  );

  // 接続数の制限チェック
  if (clients.length >= MAX_CLIENTS) {
    logInfo(
      `認証済みSSE接続拒否 - 最大接続数(${MAX_CLIENTS})に到達 - ユーザー: ${user?.username} - クライアント: ${clientIP}`,
    );
    res.status(503).send("サーバーが混雑しています。後でお試しください。");
    return;
  }

  // SSEのヘッダー設定
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  // 再接続間隔の設定（ミリ秒）
  res.write("retry: 3000\n\n");

  // クライアントにID付与
  const clientId = Date.now();
  logSSEConnection(clientId, clientIP as string, user?.username);

  // Last-Event-IDヘッダーの確認
  const lastEventId = req.headers["last-event-id"];
  if (lastEventId) {
    logInfo(
      `認証済みSSE - Last-Event-ID検出 - クライアントID: ${clientId} - ID: ${lastEventId}`,
    );
    sendMissedEvents(res, parseInt(lastEventId as string));
  }

  // クライアント配列に追加
  addClient({
    id: clientId,
    res,
    user, // ユーザー情報を保存
  });

  // 接続確立メッセージ
  if (user) {
    sendEvent(res, "system", {
      type: "info",
      message: `${user.username}として接続が確立されました`,
    });
  } else {
    sendEvent(res, "system", {
      type: "info",
      message: "接続が確立されました",
    });
  }

  // タイムアウト設定（30分）
  const timeout = setTimeout(
    () => {
      const index = clients.findIndex((client) => client.id === clientId);
      if (index !== -1) {
        logInfo(
          `認証済みSSE接続タイムアウト - クライアントID: ${clientId} - ユーザー: ${user?.username} - 接続時間: 30分`,
        );
        removeClient(clientId);
        res.end();
      }
    },
    30 * 60 * 1000,
  );

  // クライアントが切断した時の処理
  req.on("close", () => {
    clearTimeout(timeout);
    const connectionDuration = Math.round((Date.now() - clientId) / 1000);
    logSSEDisconnection(clientId, connectionDuration, user?.username);

    // クライアント配列から削除
    removeClient(clientId);
  });
};
