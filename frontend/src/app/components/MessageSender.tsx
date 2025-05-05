"use client";

import { useState } from "react";
import { sendMessage } from "../lib/api";

export default function MessageSender() {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) return;

    setIsSending(true);

    try {
      const success = await sendMessage(message);

      if (success) {
        setMessage("");
      } else {
        alert("メッセージの送信に失敗しました。");
      }
    } catch (error) {
      console.error("送信エラー:", error);
      alert("メッセージの送信中にエラーが発生しました。");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="送信するメッセージを入力"
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSending}
        />
        <button
          type="submit"
          disabled={isSending || !message.trim()}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSending ? "送信中..." : "送信"}
        </button>
      </div>
    </form>
  );
}
