// SSE（Server-Sent Events）コントローラーファイル
// SSEはサーバーからクライアントへの一方向通信を実現するHTTP技術です
// 通常のHTTPと異なり、レスポンスを閉じずに継続的にデータを送信します
import { Request, Response } from "express";
// 同時接続可能なクライアント数の上限を設定します
// サーバーリソースの過負荷を防ぐために重要です
import { MAX_CLIENTS } from "../config/index";
// SSE接続中のクライアント情報を管理するための関数と配列をインポートします
// clientsは現在接続中のすべてのクライアントを保持する配列です
import { clients, addClient, removeClient } from "../models/client";
// イベント送信関数をインポートします
// sendEventは単一のイベントを送信し、sendMissedEventsは再接続時に失われたイベントを送信します
import { sendEvent, sendMissedEvents } from "../models/event";
// ログ出力用の関数をインポートします
// SSE接続のライフサイクル（接続、切断）を記録するために使用します
import {
  logSSEConnection,
  logSSEDisconnection,
  logInfo,
} from "../utils/logger";

// Node.jsのsetTimeoutとclearTimeoutを明示的に型定義
// TypeScriptの型チェックのために必要です
declare const setTimeout: (callback: () => void, ms: number) => number;
declare const clearTimeout: (timeoutId: number) => void;

// SSE接続コントローラー（認証不要）
// このコントローラーは'/events'エンドポイントで使用され、認証なしでSSE接続を確立します
export const connectSSE = (req: Request, res: Response): void => {
  // クライアントのIPアドレスを取得します（ロギングとデバッグ用）
  // プロキシ経由の場合はx-forwarded-forヘッダーを使用します
  const clientIP =
    req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
  // 接続要求をログに記録します
  logInfo(`SSE接続要求 - エンドポイント: /events - クライアント: ${clientIP}`);

  // 接続数の制限チェック
  // サーバーリソースを保護するため、接続数が上限に達した場合は新しい接続を拒否します
  if (clients.length >= MAX_CLIENTS) {
    logInfo(
      `SSE接続拒否 - 最大接続数(${MAX_CLIENTS})に到達 - クライアント: ${clientIP}`,
    );
    // 503 Service Unavailableステータスを返します
    res.status(503).send("サーバーが混雑しています。後でお試しください。");
    return;
  }

  // SSEのヘッダー設定
  // Content-Type: text/event-stream - SSEプロトコルを示すMIMEタイプです
  // Cache-Control: no-cache - キャッシュを無効にし、常に最新のイベントを受信できるようにします
  // Connection: keep-alive - 接続を維持し、複数のイベントを送信できるようにします
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  // 再接続間隔の設定（ミリ秒）
  // クライアントが接続を失った場合、3秒後に自動的に再接続を試みるよう指示します
  // これはSSEプロトコルの一部で、'retry:'フィールドとして送信されます
  res.write("retry: 3000\n\n");

  // クライアントにID付与
  // 現在のタイムスタンプをIDとして使用します（ミリ秒単位のUNIXタイムスタンプ）
  // このIDは接続管理とログ記録に使用されます
  const clientId = Date.now();
  // 接続確立をログに記録します
  logSSEConnection(clientId, clientIP as string);

  // Last-Event-IDヘッダーの確認
  // このヘッダーは再接続時にクライアントが送信し、最後に受信したイベントIDを示します
  // これにより、接続が切れた間に失われたイベントを再送できます
  const lastEventId = req.headers["last-event-id"];
  if (lastEventId) {
    logInfo(
      `Last-Event-ID検出 - クライアントID: ${clientId} - ID: ${lastEventId}`,
    );
    // 失われたイベントを送信します
    sendMissedEvents(res, parseInt(lastEventId as string));
  }

  // クライアント配列に追加
  // このクライアントをグローバルなクライアントリストに追加し、後でイベントを送信できるようにします
  addClient({
    id: clientId,
    res,
  });

  // 接続確立メッセージ
  // クライアントに接続が確立されたことを通知するシステムイベントを送信します
  // これにより、クライアントは接続状態を確認できます
  sendEvent(res, "system", { type: "info", message: "接続が確立されました" });

  // タイムアウト設定（30分）
  // 長時間アイドル状態の接続を自動的に閉じるためのタイマーを設定します
  // これにより、リソースリークを防ぎます
  const timeout = setTimeout(
    () => {
      // タイムアウト時にクライアントがまだ接続中かチェックします
      const index = clients.findIndex((client) => client.id === clientId);
      if (index !== -1) {
        // タイムアウトをログに記録します
        logInfo(
          `SSE接続タイムアウト - クライアントID: ${clientId} - 接続時間: 30分`,
        );
        // クライアントをリストから削除します
        removeClient(clientId);
        // 接続を閉じます
        res.end();
      }
    },
    // 30分 = 30 * 60 * 1000ミリ秒
    30 * 60 * 1000,
  );

  // クライアントが切断した時の処理
  // クライアントが接続を閉じた場合（ブラウザを閉じるなど）に実行されます
  req.on("close", () => {
    // タイムアウトタイマーをクリアします
    clearTimeout(timeout);
    // 接続時間を計算します（秒単位）
    const connectionDuration = Math.round((Date.now() - clientId) / 1000);
    // 切断をログに記録します
    logSSEDisconnection(clientId, connectionDuration);

    // クライアント配列から削除
    // これにより、切断されたクライアントにイベントが送信されなくなります
    removeClient(clientId);
  });
};

// 認証付きSSE接続コントローラー
// このコントローラーは'/secure-events'エンドポイントで使用され、認証済みユーザーのみがアクセスできます
// 基本的な処理は通常のSSE接続と同じですが、ユーザー情報が追加されています
export const connectSecureSSE = (req: Request, res: Response): void => {
  // クライアントのIPアドレスを取得します
  const clientIP =
    req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
  // 認証ミドルウェアによって追加されたユーザー情報を取得します
  const user = req.user;

  // 認証済み接続要求をログに記録します
  logInfo(
    `認証済みSSE接続要求 - エンドポイント: /secure-events - ユーザー: ${user?.username} - クライアント: ${clientIP}`,
  );

  // 接続数の制限チェック
  // 通常のSSE接続と同様に、接続数が上限に達した場合は新しい接続を拒否します
  if (clients.length >= MAX_CLIENTS) {
    logInfo(
      `認証済みSSE接続拒否 - 最大接続数(${MAX_CLIENTS})に到達 - ユーザー: ${user?.username} - クライアント: ${clientIP}`,
    );
    res.status(503).send("サーバーが混雑しています。後でお試しください。");
    return;
  }

  // SSEのヘッダー設定
  // 通常のSSE接続と同じヘッダーを設定します
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  // 再接続間隔の設定（ミリ秒）
  // 通常のSSE接続と同じ再接続間隔を設定します
  res.write("retry: 3000\n\n");

  // クライアントにID付与
  // 通常のSSE接続と同様に、現在のタイムスタンプをIDとして使用します
  const clientId = Date.now();
  // 接続確立をログに記録します（ユーザー情報を含む）
  logSSEConnection(clientId, clientIP as string, user?.username);

  // Last-Event-IDヘッダーの確認
  // 通常のSSE接続と同様に、再接続時に失われたイベントを再送するために使用します
  const lastEventId = req.headers["last-event-id"];
  if (lastEventId) {
    logInfo(
      `認証済みSSE - Last-Event-ID検出 - クライアントID: ${clientId} - ID: ${lastEventId}`,
    );
    sendMissedEvents(res, parseInt(lastEventId as string));
  }

  // クライアント配列に追加
  // 通常のSSE接続と異なり、ユーザー情報も保存します
  // これにより、特定のユーザーにのみイベントを送信するなどの機能が実装できます
  addClient({
    id: clientId,
    res,
    user, // ユーザー情報を保存
  });

  // 接続確立メッセージ
  // ユーザー情報がある場合は、ユーザー名を含むメッセージを送信します
  if (user) {
    sendEvent(res, "system", {
      type: "info",
      message: `${user.username}として接続が確立されました`,
    });
  } else {
    // ユーザー情報がない場合（通常はありえない）は、一般的なメッセージを送信します
    sendEvent(res, "system", {
      type: "info",
      message: "接続が確立されました",
    });
  }

  // タイムアウト設定（30分）
  // 通常のSSE接続と同様に、長時間アイドル状態の接続を自動的に閉じます
  const timeout = setTimeout(
    () => {
      const index = clients.findIndex((client) => client.id === clientId);
      if (index !== -1) {
        // タイムアウトをログに記録します（ユーザー情報を含む）
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
  // 通常のSSE接続と同様に、クライアントが接続を閉じた場合に実行されます
  req.on("close", () => {
    clearTimeout(timeout);
    const connectionDuration = Math.round((Date.now() - clientId) / 1000);
    // 切断をログに記録します（ユーザー情報を含む）
    logSSEDisconnection(clientId, connectionDuration, user?.username);

    // クライアント配列から削除
    removeClient(clientId);
  });
};
