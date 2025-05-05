import { isAuthenticated, getAuthToken } from "./auth";

/**
 * 接続状態の型定義
 */
export type ConnectionState =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

/**
 * メッセージイベントの型定義
 */
export interface MessageEvent {
  time?: string;
  message: string;
  [key: string]: unknown;
}

/**
 * システムイベントの型定義
 */
export interface SystemEvent {
  type: string;
  message: string;
  [key: string]: unknown;
}

/**
 * イベントハンドラーの型定義
 */
export interface EventHandlers {
  onMessage?: (data: MessageEvent) => void;
  onSystem?: (data: SystemEvent) => void;
  onConnectionStateChange?: (state: ConnectionState) => void;
}

/**
 * SSE接続を確立する関数
 * @param handlers イベントハンドラー
 * @returns 接続を制御するオブジェクト
 */
export function connectToEvents(handlers: EventHandlers): {
  close: () => void;
} {
  let eventSource: EventSource | null = null;
  let retryCount = 0;
  const maxRetry = 5;
  let retryTimeout: NodeJS.Timeout | null = null;

  // 接続状態の更新
  const updateConnectionState = (state: ConnectionState) => {
    if (handlers.onConnectionStateChange) {
      handlers.onConnectionStateChange(state);
    }

    // カスタムイベントの発行（グローバルな状態管理用）
    const event = new CustomEvent(`sse-${state}`, {
      detail: { retryCount },
    });
    window.dispatchEvent(event);
  };

  // 接続関数
  const connect = () => {
    // 既存の接続を閉じる
    if (eventSource) {
      eventSource.close();
    }

    updateConnectionState(retryCount > 0 ? "reconnecting" : "connecting");

    // 認証状態に応じてエンドポイントを選択
    let endpoint = isAuthenticated()
      ? `${process.env.NEXT_PUBLIC_API_URL}/secure-events`
      : `${process.env.NEXT_PUBLIC_API_URL}/events`;

    // 認証トークンをクエリパラメータとして追加
    if (isAuthenticated()) {
      const token = getAuthToken();
      if (token) {
        endpoint += `?token=${encodeURIComponent(token)}`;
      }
    }

    // 新しい接続を確立（withCredentialsを追加）
    const eventSourceInit: EventSourceInit = {
      withCredentials: true, // クッキーを送信するために必要
    };

    eventSource = new EventSource(endpoint, eventSourceInit);

    // 標準メッセージイベント
    eventSource.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);
        if (handlers.onMessage) {
          handlers.onMessage(data);
        }
      } catch (error) {
        console.error("データのパースエラー:", error);
      }
    });

    // システムイベント
    eventSource.addEventListener("system", (event) => {
      try {
        const data = JSON.parse(event.data);
        if (handlers.onSystem) {
          handlers.onSystem(data);
        }
      } catch (error) {
        console.error("システムメッセージのパースエラー:", error);
      }
    });

    // 接続オープン時
    eventSource.onopen = () => {
      retryCount = 0;
      updateConnectionState("connected");
    };

    // エラーハンドリングと再接続
    eventSource.onerror = (error) => {
      console.error("SSE接続エラー:", error);

      if (eventSource && eventSource.readyState === EventSource.CLOSED) {
        eventSource.close();
        eventSource = null;

        updateConnectionState("disconnected");

        // 再接続ロジック（指数バックオフ）
        if (retryCount < maxRetry) {
          const timeout = Math.min(1000 * Math.pow(2, retryCount), 30000);
          retryCount++;

          console.log(
            `${timeout}ms後に再接続します (${retryCount}/${maxRetry})`,
          );

          if (retryTimeout) {
            clearTimeout(retryTimeout);
          }

          retryTimeout = setTimeout(() => {
            connect();
          }, timeout);
        } else {
          console.error("最大再接続回数に達しました");
        }
      }
    };
  };

  // 初期接続
  connect();

  // 接続制御オブジェクトを返す
  return {
    close: () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }

      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }

      updateConnectionState("disconnected");
    },
  };
}

/**
 * 認証ヘッダーを取得
 * @returns 認証ヘッダーオブジェクト
 */
function getAuthHeaders(): HeadersInit {
  // クッキーからトークンを取得
  const cookies = document.cookie.split(";");
  const authCookie = cookies.find((cookie) =>
    cookie.trim().startsWith("auth_token="),
  );

  const token = authCookie ? authCookie.split("=")[1] : null;

  if (!token) {
    return {
      "Content-Type": "application/json",
    };
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

/**
 * メッセージを送信する関数
 * @param message 送信するメッセージ
 * @returns 送信が成功したかどうか
 */
export async function sendMessage(message: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/send-message`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ message }),
      },
    );

    if (!response.ok) {
      console.error(
        `メッセージ送信エラー: ${response.status} ${response.statusText}`,
      );
    }

    return response.ok;
  } catch (error) {
    console.error("メッセージ送信エラー:", error);
    return false;
  }
}
