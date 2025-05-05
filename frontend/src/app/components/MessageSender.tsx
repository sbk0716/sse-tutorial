"use client";
// クライアントコンポーネントであることを示す指示子
// このコンポーネントはクライアントサイドでのみ実行されます

/**
 * Server-Sent Events (SSE) におけるメッセージ送信
 *
 * SSEは基本的にサーバーからクライアントへの一方向通信ですが、
 * クライアントからサーバーへのメッセージ送信も可能です。
 *
 * このコンポーネントでは、2種類のメッセージ送信方法を提供しています：
 *
 * 1. 通常送信（一括送信）:
 *    メッセージ全体を一度にサーバーに送信します。サーバーは受信後、
 *    そのメッセージをSSE接続を通じて他のクライアントに配信します。
 *
 * 2. ストリーミング送信（段階的送信）:
 *    メッセージをサーバーに送信し、サーバーはそれを単語ごとに分割して
 *    段階的にSSE接続を通じてクライアントに配信します。これにより、
 *    ChatGPTのような「考え中」の表示効果を実現できます。
 *
 * どちらの方法でも、送信されたメッセージは最終的にSSE接続を通じて
 * すべてのクライアントに配信されます。
 */

import { useState } from "react";
// Reactのフックをインポート
// useState: コンポーネントの状態を管理するためのフック（メッセージ内容、送信状態など）

import { sendMessage, streamMessage } from "../lib/api";
// メッセージ送信関連の関数をインポート
// sendMessage: 通常の一括送信を行う関数（メッセージ全体を一度に送信）
// streamMessage: ストリーミング形式（段階的）送信を行う関数（ChatGPTのような表示効果）

/**
 * MessageSenderコンポーネント
 *
 * メッセージ入力フォームと送信ボタンを提供するコンポーネント
 * 通常送信とストリーミング送信（ChatGPTのような段階的表示）の切り替えが可能
 *
 * @returns JSX.Element - メッセージ送信フォームを含むコンポーネント
 */
export default function MessageSender() {
  // メッセージの内容を保持する状態
  const [message, setMessage] = useState("");

  // 送信中かどうかを示すフラグ
  const [isSending, setIsSending] = useState(false);

  // ストリーミングモードかどうかを示すフラグ
  // false: 通常の一括送信モード
  // true: ストリーミング形式の段階的送信モード（ChatGPTのような表示）
  const [isStreamMode, setIsStreamMode] = useState(false);

  /**
   * フォーム送信ハンドラー
   * フォームが送信されたときに実行される関数
   *
   * @param e - Reactのフォームイベント
   */
  const handleSubmit = async (e: React.FormEvent) => {
    // フォームのデフォルト送信動作を防止
    e.preventDefault();

    // 空のメッセージは送信しない
    if (!message.trim()) return;

    // 送信中フラグをセット
    setIsSending(true);

    try {
      // ストリーミングモードに応じて適切な送信関数を呼び出す
      // isStreamMode=trueの場合はstreamMessage関数を使用（段階的送信）
      // isStreamMode=falseの場合はsendMessage関数を使用（一括送信）
      const success = isStreamMode
        ? await streamMessage(message)
        : await sendMessage(message);

      // 送信成功時の処理
      if (success) {
        // 入力フィールドをクリア
        setMessage("");
      } else {
        // 送信失敗時のエラーメッセージ
        alert("メッセージの送信に失敗しました。");
      }
    } catch (error) {
      // 例外発生時のエラーハンドリング
      console.error("送信エラー:", error);
      alert("メッセージの送信中にエラーが発生しました。");
    } finally {
      // 処理完了後、送信中フラグを解除
      setIsSending(false);
    }
  };

  /**
   * 送信モードを切り替える関数
   * トグルスイッチがクリックされたときに実行される
   * 通常送信モードとストリーミング送信モードを切り替える
   */
  const toggleStreamMode = () => {
    // 現在の状態を反転させる
    setIsStreamMode(!isStreamMode);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <div className="flex flex-col gap-4">
        {/* 送信モード切替トグルスイッチ */}
        <div className="flex items-center justify-end">
          <label className="inline-flex items-center cursor-pointer">
            {/* 通常送信ラベル */}
            <span className="mr-3 text-sm font-medium text-[var(--foreground)]">
              Normal
            </span>
            {/* トグルスイッチ */}
            <div className="relative">
              {/* チェックボックス（非表示） */}
              <input
                type="checkbox"
                value=""
                className="sr-only peer" // 視覚的に非表示だが機能的
                checked={isStreamMode} // ストリーミングモードフラグと連動
                onChange={toggleStreamMode} // 切り替え関数を呼び出す
                disabled={isSending} // 送信中は操作不可
              />
              {/* トグルスイッチの視覚的な部分 */}
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </div>
            {/* ストリーミング送信ラベル */}
            <span className="ml-3 text-sm font-medium text-[var(--foreground)]">
              Streaming
            </span>
          </label>
        </div>

        {/* メッセージ入力フィールドと送信ボタン */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* メッセージ入力フィールド */}
          <input
            type="text"
            value={message} // 入力値と状態を連動
            onChange={(e) => setMessage(e.target.value)} // 入力時に状態を更新
            placeholder="送信するメッセージを入力"
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSending} // 送信中は入力不可
          />
          {/* 送信ボタン */}
          <button
            type="submit"
            disabled={isSending || !message.trim()} // 送信中または空メッセージの場合は無効
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {/* 状態に応じてボタンのテキストを変更 */}
            {isSending
              ? "送信中..."
              : isStreamMode
                ? "ストリーミング送信"
                : "送信"}
          </button>
        </div>
      </div>
    </form>
  );
}
