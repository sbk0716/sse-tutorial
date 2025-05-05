"use client";

import { useState, useEffect } from "react";
import { ConnectionState } from "../lib/api";

interface ConnectionStatusProps {
  connectionState: ConnectionState;
}

export default function ConnectionStatus({
  connectionState,
}: ConnectionStatusProps) {
  return (
    <div className="connection-status flex items-center text-sm">
      {connectionState === "connected" && (
        <span className="flex items-center">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
          <span className="text-green-500">接続済み</span>
        </span>
      )}
      {connectionState === "connecting" && (
        <span className="flex items-center">
          <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-2 animate-pulse"></span>
          <span className="text-yellow-500">接続中...</span>
        </span>
      )}
      {connectionState === "reconnecting" && (
        <span className="flex items-center">
          <span className="inline-block w-2 h-2 rounded-full bg-orange-500 mr-2 animate-pulse"></span>
          <span className="text-orange-500">再接続中...</span>
        </span>
      )}
      {connectionState === "disconnected" && (
        <span className="flex items-center">
          <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2"></span>
          <span className="text-red-500">切断されました</span>
        </span>
      )}
    </div>
  );
}

// グローバルな接続状態を監視するフック
export function useConnectionStatus(): ConnectionState {
  const [status, setStatus] = useState<ConnectionState>("connecting");

  useEffect(() => {
    const handleConnected = () => setStatus("connected");
    const handleConnecting = () => setStatus("connecting");
    const handleReconnecting = (e: CustomEvent) => {
      setStatus("reconnecting");
      console.log(`再接続試行: ${e.detail.retryCount}回目`);
    };
    const handleDisconnected = () => setStatus("disconnected");

    // イベントリスナーの登録
    window.addEventListener("sse-connected", handleConnected);
    window.addEventListener("sse-connecting", handleConnecting);
    window.addEventListener(
      "sse-reconnecting",
      handleReconnecting as EventListener,
    );
    window.addEventListener("sse-disconnected", handleDisconnected);

    // クリーンアップ
    return () => {
      window.removeEventListener("sse-connected", handleConnected);
      window.removeEventListener("sse-connecting", handleConnecting);
      window.removeEventListener(
        "sse-reconnecting",
        handleReconnecting as EventListener,
      );
      window.removeEventListener("sse-disconnected", handleDisconnected);
    };
  }, []);

  return status;
}
