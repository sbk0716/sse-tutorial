"use client";

import { useEffect, useState } from "react";
import { connectToEvents, ConnectionState, EventHandlers } from "../lib/api";
import ConnectionStatus from "./ConnectionStatus";

interface Event {
  id?: string;
  time?: string;
  message: string;
  type?: string;
  eventType?: "message" | "system";
}

export default function EventListener() {
  const [events, setEvents] = useState<Event[]>([]);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("connecting");

  useEffect(() => {
    // イベントハンドラーの定義
    const handlers: EventHandlers = {
      // 標準メッセージイベント
      onMessage: (data) => {
        setEvents((prevEvents) => [
          ...prevEvents,
          { ...data, eventType: "message" },
        ]);
      },

      // システムイベント
      onSystem: (data) => {
        setEvents((prevEvents) => [
          ...prevEvents,
          { message: data.message, type: data.type, eventType: "system" },
        ]);
      },

      // 接続状態の変更
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
    let connection = connectToEvents(handlers);

    // 認証状態変更イベントのリスナー
    const handleAuthStateChanged = () => {
      // 既存の接続を閉じる
      connection.close();
      // 新しい接続を確立
      connection = connectToEvents(handlers);
    };

    // イベントリスナーを登録
    window.addEventListener("auth-state-changed", handleAuthStateChanged);

    // コンポーネントのアンマウント時にSSE接続を閉じる
    return () => {
      connection.close();
      window.removeEventListener("auth-state-changed", handleAuthStateChanged);
    };
  }, []);

  // イベントの種類に応じたスタイルを適用
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
              {event.eventType === "system" ? (
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
              ) : (
                <p>
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
