/**
 * Server-Sent Events (SSE) API モジュール
 *
 * このファイルは、SSE接続の確立、イベントの処理、メッセージの送信など、
 * SSEに関連する主要な機能を提供します。
 *
 * SSEとは？
 * Server-Sent Events (SSE) は、サーバーからクライアントへの一方向通信を実現するWeb技術です。
 * 従来のHTTP通信では、クライアントがリクエストを送信し、サーバーがレスポンスを返す
 * という一回限りの通信でしたが、SSEでは一度接続を確立すると、サーバーから
 * クライアントへ継続的にデータを送信し続けることができます。
 *
 * SSEの仕組み:
 * 1. クライアントがEventSourceオブジェクトを使用してサーバーに接続
 * 2. サーバーは接続を維持し、イベントが発生するたびにデータを送信
 * 3. クライアントはイベントリスナーを通じてこれらのイベントを受信・処理
 * 4. 接続が切断された場合、EventSourceは自動的に再接続を試みる
 *
 * このモジュールでは、これらのSSE機能をラップし、使いやすいAPIを提供しています。
 */

// 認証関連の関数をインポート
// isAuthenticated: ユーザーが認証済みかどうかを確認する関数
// getAuthToken: 認証トークンを取得する関数
import { isAuthenticated, getAuthToken } from "./auth";

/**
 * 接続状態の型定義
 * SSE接続の現在の状態を表す文字列リテラル型
 *
 * SSE接続は以下の4つの状態のいずれかになります:
 * - connecting: 接続中（初期接続試行中）
 *   EventSourceが作成され、サーバーとの接続を確立しようとしている状態です。
 *   ユーザーには「接続中...」と表示されます。
 *
 * - connected: 接続済み（正常に接続されている状態）
 *   サーバーとの接続が確立され、イベントを受信できる状態です。
 *   ユーザーには「接続済み」と表示されます。
 *
 * - reconnecting: 再接続中（接続が切断された後、再接続を試みている状態）
 *   接続が切断され、自動再接続を試みている状態です。
 *   ユーザーには「再接続中...」と表示され、再試行回数も表示されます。
 *
 * - disconnected: 切断済み（接続が切断され、再接続していない状態）
 *   接続が完全に切断され、再接続を試みていない状態です。
 *   ユーザーには「切断されました」と表示されます。
 */
export type ConnectionState =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

/**
 * メッセージイベントの型定義
 * 通常のメッセージイベントのデータ構造
 *
 * SSEで受信する標準的なメッセージイベントの形式を定義します。
 * これは一度に全体が送信される通常のメッセージに使用されます。
 *
 * @property time - メッセージのタイムスタンプ（ISO形式の文字列、例: "2023-04-01T12:34:56Z"）
 *                  メッセージが送信された時刻を示します。
 * @property message - メッセージの内容（テキスト）
 *                    実際に表示されるメッセージ本文です。
 * @property [key: string] - その他の任意のプロパティ
 *                          拡張性のために、追加のデータを含めることができます。
 */
export interface MessageEvent {
  time?: string;
  message: string;
  [key: string]: unknown;
}

/**
 * 部分的なメッセージイベントの型定義
 * ストリーミング形式で送信される部分的なメッセージのデータ構造
 *
 * ChatGPTのような「考え中」の表示効果を実現するための段階的なメッセージ送信に使用されます。
 * メッセージが少しずつ追加されていく様子を表現できます。
 *
 * @property time - メッセージのタイムスタンプ（ISO形式の文字列）
 *                 メッセージの送信開始時刻を示します。
 * @property message - 現在までの累積メッセージ内容
 *                    送信中の部分的なテキストで、徐々に完全なメッセージになります。
 * @property isComplete - すべてのチャンクが送信完了したかどうかのフラグ
 *                       true=完了、false=送信中を示します。
 * @property progress - 送信の進捗率（0-100のパーセント値）
 *                     メッセージ送信の完了度を示し、プログレスバーの表示に使用されます。
 * @property [key: string] - その他の任意のプロパティ
 *                          拡張性のために、追加のデータを含めることができます。
 */
export interface PartialMessageEvent {
  time?: string;
  message: string;
  isComplete: boolean;
  progress: number;
  [key: string]: unknown;
}

/**
 * システムイベントの型定義
 * システム関連のイベント（接続状態の変更、エラーなど）のデータ構造
 *
 * ユーザーメッセージではなく、システムの状態や通知を表すイベントに使用されます。
 * エラー、警告、情報通知などを含みます。
 *
 * @property type - イベントの種類
 *                 "info"（情報）、"error"（エラー）、"warning"（警告）、"success"（成功）など
 *                 このタイプに応じて、異なる色やスタイルで表示されます。
 * @property message - イベントメッセージの内容
 *                    システム通知として表示されるテキストです。
 * @property [key: string] - その他の任意のプロパティ
 *                          拡張性のために、追加のデータを含めることができます。
 */
export interface SystemEvent {
  type: string;
  message: string;
  [key: string]: unknown;
}

/**
 * イベントハンドラーの型定義
 * SSEイベントを処理するためのコールバック関数群
 *
 * SSE接続から受信する様々な種類のイベントを処理するためのコールバック関数を定義します。
 * これらのハンドラーは、connectToEvents関数に渡され、対応するイベントが発生したときに呼び出されます。
 *
 * @property onMessage - 通常のメッセージイベントを処理するコールバック
 *                      一括送信される通常のメッセージを受信したときに呼び出されます。
 * @property onPartialMessage - 部分的なメッセージイベントを処理するコールバック
 *                            ストリーミング形式で送信される部分的なメッセージを受信したときに呼び出されます。
 * @property onSystem - システムイベントを処理するコールバック
 *                     システム通知（エラー、警告、情報など）を受信したときに呼び出されます。
 * @property onConnectionStateChange - 接続状態の変更を処理するコールバック
 *                                   SSE接続の状態が変化したときに呼び出されます。
 */
export interface EventHandlers {
  onMessage?: (data: MessageEvent) => void;
  onPartialMessage?: (data: PartialMessageEvent) => void;
  onSystem?: (data: SystemEvent) => void;
  onConnectionStateChange?: (state: ConnectionState) => void;
}

/**
 * SSE接続を確立する関数
 * サーバーとのServer-Sent Events接続を確立し、イベントを受信します
 *
 * この関数は、ブラウザ標準のEventSourceオブジェクトを使用してSSE接続を確立し、
 * 各種イベントのリスナーを設定します。また、接続が切断された場合の再接続ロジックも実装しています。
 *
 * SSE接続の流れ:
 * 1. 認証状態に応じて適切なエンドポイントを選択
 * 2. EventSourceオブジェクトを作成して接続を開始
 * 3. 各種イベントタイプのリスナーを登録
 * 4. 接続状態の変化を監視し、必要に応じて再接続
 *
 * @param handlers - 各種イベントを処理するコールバック関数群
 * @returns 接続を制御するオブジェクト - close()メソッドで接続を閉じることができます
 */
export function connectToEvents(handlers: EventHandlers): {
  close: () => void;
} {
  // ===== ステップ1: 変数の初期化 =====

  // SSE接続を表すEventSourceオブジェクト
  let sseConnection: EventSource | null = null;

  // 再接続試行回数
  let reconnectAttempts = 0;

  // 最大再接続試行回数（5回まで試行）
  const MAX_RECONNECT_ATTEMPTS = 5;

  // 再接続用のタイマーID
  let reconnectTimer: NodeJS.Timeout | null = null;

  // ===== ステップ2: 接続状態を更新する関数 =====

  /**
   * 接続状態を更新し、UIに通知する関数
   *
   * @param newState - 新しい接続状態（"connecting", "connected", "reconnecting", "disconnected"のいずれか）
   */
  function notifyConnectionStateChange(newState: ConnectionState) {
    // 1. ハンドラー関数が提供されていれば呼び出す
    if (handlers.onConnectionStateChange) {
      handlers.onConnectionStateChange(newState);
    }

    // 2. 全体に状態変更を通知するためのイベントを発行
    const stateChangeEvent = new CustomEvent(`sse-${newState}`, {
      detail: { reconnectAttempts }, // 再接続試行回数も含める
    });
    window.dispatchEvent(stateChangeEvent);
  }

  // ===== ステップ3: イベントリスナーを設定する関数 =====

  /**
   * EventSourceオブジェクトにイベントリスナーを設定する関数
   *
   * @param source - イベントリスナーを設定するEventSourceオブジェクト
   */
  function setupEventListeners(source: EventSource) {
    // 1. 通常メッセージのリスナー
    source.addEventListener("message", (event) => {
      try {
        // JSONデータをJavaScriptオブジェクトに変換
        const messageData = JSON.parse(event.data);

        // ハンドラーが設定されていれば呼び出す
        if (handlers.onMessage) {
          handlers.onMessage(messageData);
        }
      } catch (error) {
        // JSONの解析に失敗した場合
        console.error("メッセージデータの解析に失敗しました:", error);
      }
    });

    // 2. システムメッセージのリスナー
    source.addEventListener("system", (event) => {
      try {
        // JSONデータをJavaScriptオブジェクトに変換
        const systemData = JSON.parse(event.data);

        // ハンドラーが設定されていれば呼び出す
        if (handlers.onSystem) {
          handlers.onSystem(systemData);
        }
      } catch (error) {
        // JSONの解析に失敗した場合
        console.error("システムメッセージの解析に失敗しました:", error);
      }
    });

    // 3. 部分的なメッセージ（ストリーミング）のリスナー
    source.addEventListener("partial-message", (event) => {
      try {
        // JSONデータをJavaScriptオブジェクトに変換
        const partialData = JSON.parse(event.data);

        // ハンドラーが設定されていれば呼び出す
        if (handlers.onPartialMessage) {
          handlers.onPartialMessage(partialData);
        }
      } catch (error) {
        // JSONの解析に失敗した場合
        console.error("部分的メッセージの解析に失敗しました:", error);
      }
    });

    // 4. 接続成功時のハンドラー
    source.onopen = () => {
      // 接続成功したので再接続カウンターをリセット
      reconnectAttempts = 0;

      // 接続状態を「接続済み」に更新
      notifyConnectionStateChange("connected");
    };

    // 5. エラー発生時のハンドラー
    source.onerror = (error) => {
      console.error("SSE接続でエラーが発生しました:", error);

      // 接続が閉じられた場合の処理
      if (source.readyState === EventSource.CLOSED) {
        handleConnectionClosed();
      }
    };
  }

  // ===== ステップ4: 接続が閉じられた時の処理 =====

  /**
   * 接続が閉じられた時の処理を行う関数
   */
  function handleConnectionClosed() {
    // 1. 既存の接続をクリーンアップ
    if (sseConnection) {
      sseConnection.close();
      sseConnection = null;
    }

    // 2. 接続状態を「切断」に更新
    notifyConnectionStateChange("disconnected");

    // 3. 再接続を試みる（最大試行回数に達していなければ）
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      scheduleReconnect();
    } else {
      console.error("最大再接続回数に達しました。これ以上再接続しません。");
    }
  }

  // ===== ステップ5: 再接続をスケジュールする関数 =====

  /**
   * 一定時間後に再接続を試みる関数
   */
  function scheduleReconnect() {
    // 1. 再接続までの待機時間を計算（徐々に長くなる）
    // 1回目: 1秒、2回目: 2秒、3回目: 4秒、4回目: 8秒、5回目: 16秒
    const waitTimeMs = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);

    // 2. 再接続試行回数をカウントアップ
    reconnectAttempts++;

    // 3. 再接続情報をログに出力
    console.log(
      `${waitTimeMs}ミリ秒後に再接続を試みます (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}回目)`,
    );

    // 4. 既存のタイマーがあればクリア
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }

    // 5. 指定時間後に再接続を実行
    reconnectTimer = setTimeout(() => {
      startConnection();
    }, waitTimeMs);
  }

  // ===== ステップ6: 接続を開始する関数 =====

  /**
   * SSE接続を開始する関数
   */
  function startConnection() {
    // 1. 既存の接続があれば閉じる
    if (sseConnection) {
      sseConnection.close();
    }

    // 2. 接続状態を更新（初回接続か再接続かで状態が異なる）
    const connectionState =
      reconnectAttempts > 0 ? "reconnecting" : "connecting";
    notifyConnectionStateChange(connectionState);

    // 3. 接続先URLを決定（認証状態によって異なる）
    let serverUrl = isAuthenticated()
      ? `${process.env.NEXT_PUBLIC_API_URL}/secure-events` // 認証済みの場合
      : `${process.env.NEXT_PUBLIC_API_URL}/events`; // 未認証の場合

    // 4. 認証済みの場合はトークンをURLに追加
    if (isAuthenticated()) {
      const authToken = getAuthToken();
      if (authToken) {
        serverUrl += `?token=${encodeURIComponent(authToken)}`;
      }
    }

    // 5. EventSourceの設定オプション
    const connectionOptions = {
      withCredentials: true, // クッキーを送信するために必要
    };

    // 6. 新しいEventSourceオブジェクトを作成して接続開始
    sseConnection = new EventSource(serverUrl, connectionOptions);

    // 7. イベントリスナーを設定
    setupEventListeners(sseConnection);
  }

  // ===== ステップ7: 接続を閉じる関数 =====

  /**
   * SSE接続を閉じる関数
   */
  function closeConnection() {
    // 1. 再接続タイマーがあればクリア
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    // 2. EventSourceオブジェクトがあれば閉じる
    if (sseConnection) {
      sseConnection.close();
      sseConnection = null;
    }

    // 3. 接続状態を「切断」に更新
    notifyConnectionStateChange("disconnected");
  }

  // ===== ステップ8: 初期接続を開始 =====

  // 接続を開始
  startConnection();

  // ===== ステップ9: 接続制御オブジェクトを返す =====

  // 接続を制御するためのオブジェクトを返す
  return {
    // 接続を閉じるメソッド
    close: closeConnection,
  };
}

/**
 * 認証ヘッダーを取得する関数
 * APIリクエスト用の認証ヘッダーを生成します
 *
 * SSEアプリケーションでは、メッセージ送信時などのAPIリクエストに認証情報を
 * 含める必要があります。この関数は、クッキーから認証トークンを取得し、
 * 適切な形式のヘッダーオブジェクトを生成します。
 *
 * @returns 認証ヘッダーオブジェクト - Content-Typeと必要に応じてAuthorizationヘッダーを含む
 */
function getAuthHeaders(): HeadersInit {
  // クッキーからトークンを取得
  // document.cookieは「name=value; name2=value2;...」形式の文字列を返すため、
  // セミコロンで分割して配列に変換します
  const cookies = document.cookie.split(";");

  // auth_tokenで始まるクッキーを検索
  // find()メソッドは条件に一致する最初の要素を返します
  const authCookie = cookies.find((cookie) =>
    cookie.trim().startsWith("auth_token="),
  );

  // クッキーが見つかった場合、その値（トークン）を取得
  // 「auth_token=xxxxx」形式から「xxxxx」部分を抽出します
  const token = authCookie ? authCookie.split("=")[1] : null;

  // トークンが存在しない場合（未認証の場合）
  if (!token) {
    // Content-Typeヘッダーのみを返す
    return {
      "Content-Type": "application/json",
    };
  }

  // トークンが存在する場合（認証済みの場合）
  // Content-TypeとAuthorizationヘッダーを返す
  // Authorization: Bearer {token}形式は、JWT認証の標準的な方法です
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

/**
 * メッセージを送信する関数
 * 通常の一括送信方式でメッセージをサーバーに送信します
 *
 * この関数は、ユーザーが入力したメッセージを一度に全て送信します。
 * 送信されたメッセージは、サーバー側でSSE接続を通じて他のクライアントに
 * 配信されます。
 *
 * 送信の流れ:
 * 1. 認証ヘッダーを取得
 * 2. メッセージをJSON形式に変換
 * 3. POSTリクエストを送信
 * 4. レスポンスのステータスコードに基づいて成功/失敗を判定
 *
 * @param message - 送信するメッセージ（テキスト形式）
 * @returns 送信が成功したかどうか（成功: true、失敗: false）
 */
export async function sendMessage(message: string): Promise<boolean> {
  try {
    // サーバーのメッセージ送信エンドポイントにPOSTリクエストを送信
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/send-message`,
      {
        method: "POST", // HTTPメソッド: POST
        headers: getAuthHeaders(), // 認証ヘッダーを取得して設定
        body: JSON.stringify({ message }), // メッセージをJSON形式に変換
      },
    );

    // レスポンスが成功（200-299）でない場合はエラーをログに出力
    if (!response.ok) {
      console.error(
        `メッセージ送信エラー: ${response.status} ${response.statusText}`,
      );
    }

    // レスポンスのステータスコードに基づいて成功/失敗を返す
    // response.ok は、ステータスコードが200-299の範囲内の場合にtrueを返します
    return response.ok;
  } catch (error) {
    // ネットワークエラーなどの例外が発生した場合
    console.error("メッセージ送信エラー:", error);
    return false;
  }
}

/**
 * メッセージをストリーミング形式で送信する関数
 * メッセージを段階的に送信するためのストリーミング方式を使用します
 *
 * この関数は、ユーザーが入力したメッセージをサーバーに送信し、
 * サーバー側でメッセージを単語ごとに分割して段階的に送信するよう要求します。
 * これにより、ChatGPTのような「考え中」の表示効果を実現できます。
 *
 * ストリーミング送信の流れ:
 * 1. クライアント: streamMessage()関数を呼び出してメッセージを送信
 * 2. サーバー: メッセージを受信し、単語ごとに分割
 * 3. サーバー: 分割したメッセージを少しずつSSE経由で送信
 * 4. クライアント: SSE接続を通じて段階的にメッセージを受信
 * 5. クライアント: 受信したメッセージを画面に表示（タイピング中のような効果）
 *
 * @param message - 送信するメッセージ（テキスト形式）
 * @returns 送信リクエストが成功したかどうか（成功: true、失敗: false）
 */
export async function streamMessage(message: string): Promise<boolean> {
  try {
    // サーバーのストリーミングメッセージ送信エンドポイントにPOSTリクエストを送信
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/stream-message`,
      {
        method: "POST", // HTTPメソッド: POST
        headers: getAuthHeaders(), // 認証ヘッダーを取得して設定
        body: JSON.stringify({ message }), // メッセージをJSON形式に変換
      },
    );

    // レスポンスが成功（200-299）でない場合はエラーをログに出力
    if (!response.ok) {
      console.error(
        `ストリーミングメッセージ送信エラー: ${response.status} ${response.statusText}`,
      );
    }

    // レスポンスのステータスコードに基づいて成功/失敗を返す
    // 注意: これはリクエストの成功/失敗を示すもので、
    // 実際のメッセージ送信はSSE接続を通じて段階的に行われます
    return response.ok;
  } catch (error) {
    // ネットワークエラーなどの例外が発生した場合
    console.error("ストリーミングメッセージ送信エラー:", error);
    return false;
  }
}
