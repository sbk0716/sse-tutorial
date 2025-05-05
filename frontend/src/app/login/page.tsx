"use client";
// クライアントコンポーネントであることを示す指示子
// このコンポーネントはクライアントサイドでのみ実行されます

/**
 * ログインページコンポーネント
 *
 * このコンポーネントは、ユーザー認証のためのログインフォームを提供します。
 *
 * SSEアプリケーションにおける認証の重要性:
 * 1. セキュリティ - 認証されたユーザーのみが特定のイベントストリームにアクセスできるようにする
 * 2. パーソナライゼーション - ユーザーごとに異なるイベントを送信できるようにする
 * 3. アクセス制御 - 機密性の高いリアルタイムデータへのアクセスを制限する
 *
 * ログイン成功後、ユーザーはSSE接続を通じて認証が必要なイベントストリームに
 * アクセスできるようになります。
 */

import { useState } from "react";
// Reactのフックをインポート
// useState: コンポーネントの状態を管理するためのフック（フォーム入力値、エラー状態など）

import { useRouter } from "next/navigation";
// Next.jsのルーターフックをインポート
// プログラムによるナビゲーション（ページ遷移）を行うためのフック

import { login } from "../lib/auth";
// 認証関連の関数をインポート
// login: ユーザー名とパスワードを使用して認証を行う関数

/**
 * ログインページコンポーネント
 *
 * ユーザー認証のためのログインフォームを提供するコンポーネント
 * ユーザー名とパスワードの入力フィールド、エラー表示、ログインボタンを含む
 *
 * @returns JSX.Element - ログインフォームを表示するコンポーネント
 */
export default function LoginPage() {
  // ユーザー名の入力値を保持する状態
  const [username, setUsername] = useState("");

  // パスワードの入力値を保持する状態
  const [password, setPassword] = useState("");

  // エラーメッセージを保持する状態
  const [error, setError] = useState("");

  // ログイン処理中かどうかを示すフラグ
  const [isLoading, setIsLoading] = useState(false);

  // Next.jsのルーターを取得
  // ログイン成功後のリダイレクトに使用
  const router = useRouter();

  /**
   * フォーム送信ハンドラー
   * ログインフォームが送信されたときに実行される関数
   *
   * @param e - Reactのフォームイベント
   */
  const handleSubmit = async (e: React.FormEvent) => {
    // フォームのデフォルト送信動作を防止
    e.preventDefault();

    // エラーメッセージをクリア
    setError("");

    // ローディング状態を開始
    setIsLoading(true);

    try {
      // ログイン処理を実行
      // auth.tsのlogin関数を呼び出し、ユーザー名とパスワードを渡す
      const success = await login(username, password);

      // ログイン成功時の処理
      if (success) {
        // ホームページにリダイレクト
        router.push("/");
      } else {
        // ログイン失敗時のエラーメッセージを設定
        setError("ユーザー名またはパスワードが正しくありません");
      }
    } catch (err) {
      // 例外発生時のエラーハンドリング
      setError("ログイン中にエラーが発生しました");
      console.error(err);
    } finally {
      // 処理完了後、ローディング状態を終了
      setIsLoading(false);
    }
  };

  return (
    <div
      className="w-full max-w-md space-y-6 p-8 bg-[var(--background)] rounded-xl shadow-lg border border-[var(--card-border)] text-[var(--foreground)]"
      style={{ boxShadow: "var(--login-shadow)" }}
    >
      {/* ヘッダーセクション */}
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-[var(--foreground)]">
          ログイン
        </h2>
        <p className="mt-2 text-center text-sm text-[var(--foreground)]">
          SSEチュートリアルへようこそ
        </p>
      </div>

      {/* エラーメッセージ表示（エラーがある場合のみ表示） */}
      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative dark:bg-red-900 dark:text-red-100 dark:border-red-800"
          role="alert"
        >
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* ログインフォーム */}
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        {/* 入力フィールドグループ */}
        <div className="rounded-md shadow-sm -space-y-px">
          {/* ユーザー名入力フィールド */}
          <div>
            <label htmlFor="username" className="sr-only">
              ユーザー名
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-[var(--input-border)] placeholder-gray-600 text-[var(--foreground)] bg-[var(--input-bg)] rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="ユーザー名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          {/* パスワード入力フィールド */}
          <div>
            <label htmlFor="password" className="sr-only">
              パスワード
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-[var(--input-border)] placeholder-gray-600 text-[var(--foreground)] bg-[var(--input-bg)] rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="パスワード"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {/* ログインボタン */}
        <div>
          <button
            type="submit"
            disabled={isLoading} // ローディング中は無効化
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[var(--button-bg)] hover:bg-[var(--button-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {/* ローディング状態に応じてボタンテキストを変更 */}
            {isLoading ? "ログイン中..." : "ログイン"}
          </button>
        </div>

        {/* テスト用アカウント情報 */}
        <div className="text-sm text-center">
          <p className="text-[var(--foreground)]">
            テスト用アカウント: user01 / password
          </p>
        </div>
      </form>
    </div>
  );
}
