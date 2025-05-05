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
 * 主な特徴:
 * 1. 一方向通信 - サーバーからクライアントへの通信のみ
 * 2. 自動再接続 - 接続が切れた場合に自動的に再接続を試みる
 * 3. イベントID - 各イベントに一意のIDを付与し、再接続時の続きから受信可能
 * 4. イベントタイプ - 異なる種類のイベントを区別可能
 *
 * SSEはWebSocketと似ていますが、より単純で、HTTPプロトコル上に構築されています。
 * チャット、通知、リアルタイム更新など、サーバーからクライアントへの
 * プッシュ通知が必要なアプリケーションに適しています。
 */

import { useState, useEffect } from "react";
// Reactのフックをインポート
// useState: コンポーネントの状態を管理するためのフック
// useEffect: 副作用を扱うためのフック（イベントリスナーの登録など）

import { ConnectionState } from "../lib/api";
// SSE接続状態の型定義をインポート
// ConnectionState: "connecting" | "connected" | "reconnecting" | "disconnected"の文字列リテラル型

/**
 * ConnectionStatusコンポーネントのプロパティ型定義
 *
 * @property connectionState - 現在のSSE接続状態を表す文字列
 */
interface ConnectionStatusProps {
  connectionState: ConnectionState;
}

/**
 * ConnectionStatusコンポーネント
 *
 * Server-Sent Events (SSE)の接続状態を視覚的に表示するコンポーネント
 * 接続状態に応じて異なる色とテキストで状態を表示します
 *
 * @param connectionState - 現在の接続状態
 * @returns 接続状態を表示するUI要素
 */
export default function ConnectionStatus({
  connectionState,
}: ConnectionStatusProps) {
  return (
    <div className="connection-status flex items-center text-sm">
      {/* 接続済み状態の表示 - 緑色のインジケーターと「接続済み」テキスト */}
      {connectionState === "connected" && (
        <span className="flex items-center">
          {/* 緑色の丸いインジケーター - 接続が安定していることを示す */}
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
          {/* 接続状態テキスト */}
          <span className="text-green-500">接続済み</span>
        </span>
      )}

      {/* 接続中状態の表示 - 黄色の点滅するインジケーターと「接続中...」テキスト */}
      {connectionState === "connecting" && (
        <span className="flex items-center">
          {/* 黄色の点滅する丸いインジケーター - 初期接続中であることを示す */}
          <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-2 animate-pulse"></span>
          {/* 接続状態テキスト */}
          <span className="text-yellow-500">接続中...</span>
        </span>
      )}

      {/* 再接続中状態の表示 - オレンジ色の点滅するインジケーターと「再接続中...」テキスト */}
      {connectionState === "reconnecting" && (
        <span className="flex items-center">
          {/* オレンジ色の点滅する丸いインジケーター - 接続が切断され再接続中であることを示す */}
          <span className="inline-block w-2 h-2 rounded-full bg-orange-500 mr-2 animate-pulse"></span>
          {/* 接続状態テキスト */}
          <span className="text-orange-500">再接続中...</span>
        </span>
      )}

      {/* 切断状態の表示 - 赤色のインジケーターと「切断されました」テキスト */}
      {connectionState === "disconnected" && (
        <span className="flex items-center">
          {/* 赤色の丸いインジケーター - 接続が切断されていることを示す */}
          <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2"></span>
          {/* 接続状態テキスト */}
          <span className="text-red-500">切断されました</span>
        </span>
      )}
    </div>
  );
}

/**
 * グローバルな接続状態を監視するカスタムフック
 *
 * SSE接続の状態変化をグローバルイベントを通じて監視し、
 * 現在の接続状態を返します。
 *
 * このフックを使用することで、アプリケーション内の任意のコンポーネントが
 * SSE接続の状態を簡単に取得できます。
 *
 * @returns 現在のSSE接続状態
 */
export function useConnectionStatus(): ConnectionState {
  // 接続状態を保持するステート（初期値は"connecting"）
  const [status, setStatus] = useState<ConnectionState>("connecting");

  // コンポーネントのマウント時に実行される副作用
  // グローバルなSSE接続状態変更イベントのリスナーを登録します
  useEffect(() => {
    // 各接続状態変更イベントのハンドラー関数を定義

    // 接続完了時のハンドラー
    const handleConnected = () => setStatus("connected");

    // 接続開始時のハンドラー
    const handleConnecting = () => setStatus("connecting");

    // 再接続時のハンドラー
    // CustomEventからretryCount（再試行回数）を取得してログに出力
    const handleReconnecting = (e: CustomEvent) => {
      setStatus("reconnecting");
      console.log(`再接続試行: ${e.detail.retryCount}回目`);
    };

    // 切断時のハンドラー
    const handleDisconnected = () => setStatus("disconnected");

    // グローバルイベントリスナーの登録
    // api.tsファイルで発行されるカスタムイベントをリッスンします
    window.addEventListener("sse-connected", handleConnected);
    window.addEventListener("sse-connecting", handleConnecting);
    window.addEventListener(
      "sse-reconnecting",
      handleReconnecting as EventListener, // TypeScriptの型互換性のためにキャスト
    );
    window.addEventListener("sse-disconnected", handleDisconnected);

    // コンポーネントのアンマウント時にイベントリスナーを削除（クリーンアップ）
    // これによりメモリリークを防止します
    return () => {
      window.removeEventListener("sse-connected", handleConnected);
      window.removeEventListener("sse-connecting", handleConnecting);
      window.removeEventListener(
        "sse-reconnecting",
        handleReconnecting as EventListener,
      );
      window.removeEventListener("sse-disconnected", handleDisconnected);
    };
  }, []); // 空の依存配列は、このエフェクトがコンポーネントのマウント時に1回だけ実行されることを意味します

  // 現在の接続状態を返す
  return status;
}
