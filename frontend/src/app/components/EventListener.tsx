"use client";
// クライアントコンポーネントであることを示す指示子
// このコンポーネントはクライアントサイドでのみ実行されます

/**
 * Server-Sent Events (SSE) とは？
 *
 * SSEはサーバーからクライアントへの一方向通信を実現するWeb技術です。
 * 従来のHTTP通信では、クライアントがリクエストを送信し、サーバーがレスポンスを返す
 * という一回限りの通信でしたが、SSEでは一度接続を確立すると、サーバーから
 * クライアントへ継続的にデータを送信し続けることができます。
 *
 * SSEの主な特徴:
 * 1. 一方向通信 - サーバーからクライアントへの通信のみ
 * 2. 自動再接続 - 接続が切れた場合に自動的に再接続を試みる
 * 3. イベントタイプ - 異なる種類のイベントを区別可能
 * 4. リアルタイム更新 - チャット、通知、ライブフィードなどに最適
 *
 * このコンポーネントは、SSE接続を確立し、サーバーから送信されるイベントを
 * リアルタイムで表示する役割を担っています。通常のメッセージ、システムメッセージ、
 * 部分的なメッセージ（ストリーミング）の3種類のイベントを処理します。
 */

import { useEffect, useState } from "react";
// Reactのフックをインポート
// useEffect: 副作用を扱うためのフック（SSE接続の確立など）
// useState: コンポーネントの状態を管理するためのフック

import { connectToEvents, ConnectionState, EventHandlers } from "../lib/api";
// SSE接続関連の関数と型をインポート
// connectToEvents: SSE接続を確立する関数（EventSourceを内部で使用）
// ConnectionState: 接続状態を表す型（"connecting"|"connected"|"reconnecting"|"disconnected"）
// EventHandlers: イベントハンドラーの型（各種イベントを処理するコールバック関数群）

import ConnectionStatus from "./ConnectionStatus";
// 接続状態を表示するコンポーネントをインポート
// このコンポーネントは、現在のSSE接続状態を視覚的に表示します

/**
 * イベントの型定義
 * 受信したイベントを表示するためのデータ構造
 *
 * SSEから受信した様々な種類のイベントを統一的に扱うための内部型定義です。
 * サーバーから受信したイベントデータを、UI表示に適した形式に変換します。
 *
 * @property id - イベントの一意識別子（オプション）
 *               複数のイベントを区別するために使用されます。
 * @property time - イベントのタイムスタンプ（オプション）
 *                 イベントが発生した時刻を示します。
 * @property message - イベントのメッセージ内容
 *                    実際に表示されるテキストメッセージです。
 * @property type - イベントの種類（オプション）
 *                "error", "warning", "success", "info"などの値を取り、
 *                システムメッセージの表示スタイルを決定します。
 * @property eventType - イベントのカテゴリ
 *                     "message"（通常メッセージ）, "system"（システム通知）,
 *                     "partial-message"（ストリーミング中のメッセージ）のいずれかです。
 * @property progress - 部分的なメッセージの進捗率（0-100）（オプション）
 *                     ストリーミングメッセージの完了度を示します。
 * @property isComplete - 部分的なメッセージが完了したかどうか（オプション）
 *                       ストリーミングメッセージが完了したかどうかを示します。
 */
interface Event {
  id?: string;
  time?: string;
  message: string;
  type?: string;
  eventType?: "message" | "system" | "partial-message";
  progress?: number;
  isComplete?: boolean;
}

/**
 * EventListenerコンポーネント
 *
 * SSEを使用してサーバーからのイベントをリアルタイムで受信し表示するコンポーネント
 * 通常のメッセージ、システムメッセージ、部分的なメッセージ（ストリーミング）を処理します
 *
 * @returns JSX.Element - イベントリスナーとイベント表示領域を含むコンポーネント
 */
export default function EventListener() {
  // 受信したイベントを保持する状態
  const [events, setEvents] = useState<Event[]>([]);

  // 現在の接続状態を保持する状態（初期値は"connecting"）
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("connecting");

  // コンポーネントのマウント時に実行される副作用
  // SSE接続を確立し、イベントハンドラーを設定します
  useEffect(() => {
    // イベントハンドラーの定義
    // 各種イベントを受信したときの処理を定義します
    const handlers: EventHandlers = {
      // 標準メッセージイベント処理
      // 通常の一括送信メッセージを受信したときの処理
      // 受信したデータをイベント配列に追加します
      onMessage: (data) => {
        setEvents((prevEvents) => [
          ...prevEvents,
          { ...data, eventType: "message" },
        ]);
      },

      // 部分的なメッセージイベント処理
      // ストリーミング形式で送信される部分的なメッセージを受信したときの処理
      // ChatGPTのような段階的なメッセージ表示を実現するための核となる処理です
      onPartialMessage: (data) => {
        setEvents((prevEvents) => {
          // 最後のイベントが部分的メッセージかどうかをチェック
          // 部分的なメッセージの更新か、新規追加かを判断するために使用します
          const lastEvent = prevEvents[prevEvents.length - 1];

          // 完了フラグがある場合は既存の部分的メッセージを更新
          // isComplete=trueは、すべてのチャンクが送信完了したことを示します
          if (data.isComplete) {
            // 最後のイベントが部分的メッセージなら更新、そうでなければ新規追加
            // 部分的なメッセージの連続性を維持するための条件分岐です
            if (lastEvent && lastEvent.eventType === "partial-message") {
              // 既存の部分的メッセージを完了したメッセージに更新
              // 配列の最後の要素を更新し、eventTypeを"message"に変更します
              const updatedEvents = [...prevEvents];
              updatedEvents[updatedEvents.length - 1] = {
                ...data,
                eventType: "message", // 完了したので通常のメッセージに変更
              };
              return updatedEvents;
            }
            // 最後のイベントが部分的メッセージでない場合は、新しいメッセージとして追加
            return [...prevEvents, { ...data, eventType: "message" }];
          } else {
            // 部分的なメッセージを更新または追加（isComplete=false）
            // まだ送信中のメッセージを処理します
            if (lastEvent && lastEvent.eventType === "partial-message") {
              // 既存の部分的メッセージを更新
              // 同じメッセージの続きとして表示するために、最後のイベントを更新します
              const updatedEvents = [...prevEvents];
              updatedEvents[updatedEvents.length - 1] = {
                ...data,
                eventType: "partial-message",
              };
              return updatedEvents;
            }
            // 新しい部分的メッセージとして追加
            // 初めての部分的メッセージ、または前のメッセージとは関係ない新しいメッセージの場合
            return [...prevEvents, { ...data, eventType: "partial-message" }];
          }
        });
      },

      // システムイベント処理
      // 接続状態の変更やエラーなどのシステム通知を受信したときの処理
      // システムメッセージをイベント配列に追加します
      onSystem: (data) => {
        setEvents((prevEvents) => [
          ...prevEvents,
          { message: data.message, type: data.type, eventType: "system" },
        ]);
      },

      // 接続状態の変更処理
      // SSE接続の状態が変化したときの処理
      // 接続状態を更新し、必要に応じてシステムメッセージを追加します
      onConnectionStateChange: (state) => {
        setConnectionState(state);

        // 接続が切断された場合
        if (state === "disconnected") {
          setEvents((prevEvents) => [
            ...prevEvents,
            {
              message:
                "サーバーとの接続が切断されました。再接続を試みています...",
              type: "error",
              eventType: "system",
            },
          ]);
        }

        // 再接続された場合
        if (state === "connected") {
          // 既存のイベントがある場合のみメッセージを追加
          const hasEvents =
            document.querySelectorAll(".mb-2.p-2.rounded").length > 0;
          if (hasEvents) {
            setEvents((prevEvents) => [
              ...prevEvents,
              {
                message: "サーバーとの接続が再確立されました。",
                type: "success",
                eventType: "system",
              },
            ]);
          }
        }
      },
    };

    // SSE接続を確立
    // 定義したハンドラーを使用してサーバーとのSSE接続を開始します
    let connection = connectToEvents(handlers);

    // 認証状態変更イベントのリスナー
    // ユーザーがログイン/ログアウトしたときに接続を再確立するための処理
    const handleAuthStateChanged = () => {
      // 既存の接続を閉じる
      connection.close();
      // 新しい接続を確立
      connection = connectToEvents(handlers);
    };

    // イベントリスナーを登録
    // 認証状態変更イベントをグローバルに監視します
    window.addEventListener("auth-state-changed", handleAuthStateChanged);

    // コンポーネントのアンマウント時にSSE接続を閉じる
    // クリーンアップ関数を返すことで、コンポーネントがアンマウントされたときに
    // 接続を閉じ、イベントリスナーを削除します（メモリリーク防止）
    return () => {
      connection.close();
      window.removeEventListener("auth-state-changed", handleAuthStateChanged);
    };
  }, []);

  // イベントの種類に応じたスタイルを適用するヘルパー関数
  // イベントのタイプに基づいて適切なTailwind CSSクラスを返します
  const getEventStyle = (event: Event) => {
    if (event.eventType === "system") {
      switch (event.type) {
        case "error":
          return "bg-red-100 dark:bg-red-900 border-red-200 dark:border-red-800";
        case "warning":
          return "bg-yellow-100 dark:bg-yellow-900 border-yellow-200 dark:border-yellow-800";
        case "success":
          return "bg-green-100 dark:bg-green-900 border-green-200 dark:border-green-800";
        default:
          // 情報メッセージのスタイルを改善
          return "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800";
      }
    } else if (event.eventType === "partial-message") {
      // 部分的なメッセージのスタイル
      // ストリーミング中のメッセージには特別なスタイルを適用
      // relativeを追加することで、プログレスバーの位置決めの基準点になります
      return "bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 relative";
    }
    return "bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700";
  };

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-[var(--foreground)]">
          受信したイベント
        </h2>
        <ConnectionStatus connectionState={connectionState} />
      </div>

      <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 h-96 overflow-y-auto bg-white dark:bg-gray-900">
        {events.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            イベントを待機中...
          </p>
        ) : (
          events.map((event, index) => (
            <div
              key={index}
              className={`mb-2 p-2 rounded ${getEventStyle(event)}`}
            >
              {/* イベントタイプに応じて異なる表示形式を適用 */}
              {event.eventType === "system" ? (
                // システムイベントの表示
                // エラー、警告、成功、情報などの種類に応じて色を変更
                <p
                  className={
                    event.type === "error"
                      ? "text-red-800 dark:text-red-200"
                      : event.type === "warning"
                        ? "text-yellow-800 dark:text-yellow-200"
                        : event.type === "success"
                          ? "text-green-800 dark:text-green-200"
                          : "text-blue-800 dark:text-white"
                  }
                >
                  <span
                    className={`font-bold ${
                      event.type === "error"
                        ? "text-red-600 dark:text-red-400"
                        : event.type === "warning"
                          ? "text-yellow-600 dark:text-yellow-400"
                          : event.type === "success"
                            ? "text-green-600 dark:text-green-400"
                            : "text-blue-600 dark:text-blue-300"
                    }`}
                  >
                    {event.type === "error"
                      ? "エラー"
                      : event.type === "warning"
                        ? "警告"
                        : event.type === "success"
                          ? "成功"
                          : "情報"}
                  </span>
                  : {event.message}
                </p>
              ) : event.eventType === "partial-message" ? (
                // 部分的なメッセージの表示（ストリーミング中）
                <div>
                  <p>
                    {/* タイムスタンプ表示 */}
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {event.time}
                    </span>
                    : {event.message}
                    {/* タイピングインジケーター（点滅するカーソル） */}
                    <span className="typing-indicator ml-1 inline-block w-2 h-4 bg-transparent border-r-2 border-current animate-pulse"></span>
                  </p>
                  {/* 進捗バー（progressプロパティがある場合のみ表示） */}
                  {event.progress !== undefined && (
                    <div className="w-full bg-gray-200 dark:bg-gray-700 h-1 mt-2 rounded-full overflow-hidden">
                      {/* 進捗に応じて幅が変化するバー */}
                      <div
                        className="bg-blue-500 h-1 rounded-full"
                        style={{ width: `${event.progress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              ) : (
                // 通常のメッセージ表示
                <p>
                  {/* タイムスタンプ表示 */}
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {event.time}
                  </span>
                  : {event.message}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
