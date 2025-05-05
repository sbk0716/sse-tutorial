"use client";
// クライアントコンポーネントであることを示す指示子
// このコンポーネントはクライアントサイドでのみ実行されます

/**
 * ナビゲーションバーコンポーネント
 *
 * このコンポーネントは、アプリケーションのナビゲーションバーを提供します。
 * SSEアプリケーションにおいて、認証状態の表示や切り替えは重要な役割を果たします。
 *
 * SSEでは、認証状態に応じて異なるイベントストリームにアクセスできるようにするため、
 * ユーザーの認証状態を常に監視し、適切なSSE接続を確立する必要があります。
 * このコンポーネントは、ユーザーの認証状態を表示し、ログアウト機能を提供します。
 */

import Link from "next/link";
// Next.jsのLinkコンポーネントをインポート
// クライアントサイドナビゲーションを実現するためのコンポーネント

import { useRouter } from "next/navigation";
// Next.jsのルーターフックをインポート
// プログラムによるナビゲーション（ページ遷移）を行うためのフック

import { useEffect, useState } from "react";
// Reactのフックをインポート
// useEffect: 副作用を扱うためのフック（認証状態の監視など）
// useState: コンポーネントの状態を管理するためのフック

import { isAuthenticated, getCurrentUser, logout } from "../lib/auth";
// 認証関連の関数をインポート
// isAuthenticated: ユーザーが認証済みかどうかを確認する関数
// getCurrentUser: 現在のユーザー情報を取得する関数
// logout: ログアウト処理を行う関数

import ThemeSwitcher from "./ThemeSwitcher";
// テーマ切り替えコンポーネントをインポート
// ダークモード/ライトモードの切り替えを行うコンポーネント

/**
 * ナビゲーションバーコンポーネント
 *
 * アプリケーションのトップに表示されるナビゲーションバー
 * ロゴ、認証状態の表示、ログアウトボタン、テーマ切り替えボタンを含む
 *
 * @returns JSX.Element - ナビゲーションバーを表示するコンポーネント
 */
export default function NavBar() {
  // 認証状態を保持する状態
  // ユーザーが認証済みかどうかを示すフラグ
  const [authenticated, setAuthenticated] = useState(false);

  // ユーザー名を保持する状態
  // 認証済みの場合、ログインしているユーザーの名前を表示
  const [username, setUsername] = useState("");

  // Next.jsのルーターを取得
  // プログラムによるページ遷移に使用
  const router = useRouter();

  // コンポーネントのマウント時と認証状態変更時に実行される副作用
  useEffect(() => {
    // 認証状態をチェックする関数
    // クライアントサイドでのみ実行される
    const checkAuth = () => {
      // ユーザーが認証済みかどうかを確認
      const auth = isAuthenticated();
      // 認証状態を更新
      setAuthenticated(auth);

      // 認証済みの場合、ユーザー情報を取得
      if (auth) {
        const user = getCurrentUser();
        // ユーザー名を設定（ユーザー情報がない場合は空文字）
        setUsername(user?.username || "");
      } else {
        // 未認証の場合、ユーザー名をクリア
        setUsername("");
      }
    };

    // 初期認証状態のチェック
    checkAuth();

    // 認証状態変更イベントのハンドラー
    // ログイン/ログアウト時に呼び出される
    const handleAuthStateChanged = () => {
      checkAuth();
    };

    // 認証状態変更イベントのリスナーを登録
    // auth.tsで発行されるカスタムイベントをリッスン
    window.addEventListener("auth-state-changed", handleAuthStateChanged);

    // コンポーネントのアンマウント時にイベントリスナーを削除（クリーンアップ）
    return () => {
      window.removeEventListener("auth-state-changed", handleAuthStateChanged);
    };
  }, []); // 空の依存配列は、このエフェクトがコンポーネントのマウント時に1回だけ実行されることを意味します

  /**
   * ログアウト処理を行う関数
   * ログアウトボタンがクリックされたときに実行される
   */
  const handleLogout = async () => {
    // ログアウト処理を実行
    // サーバーにログアウトリクエストを送信し、クッキーからトークンを削除
    await logout();

    // 認証状態とユーザー名をリセット
    setAuthenticated(false);
    setUsername("");

    // ログインページにリダイレクト
    router.push("/login");
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md">
      {/* ナビゲーションバーのコンテナ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* 左側：ロゴ/アプリ名 */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              {/* ホームページへのリンク */}
              <Link
                href="/"
                className="text-xl font-bold text-blue-600 dark:text-blue-400"
              >
                SSE Tutorial
              </Link>
            </div>
          </div>

          {/* 右側：テーマ切り替えとユーザー情報 */}
          <div className="flex items-center">
            {/* テーマ切り替えボタン（ダーク/ライトモード） */}
            <ThemeSwitcher />

            {/* 認証済みの場合のみユーザー情報とログアウトボタンを表示 */}
            {authenticated ? (
              <div className="ml-4 flex items-center">
                {/* ユーザー名表示 */}
                <span className="text-[var(--foreground)] mr-4">
                  {username}さん
                </span>
                {/* ログアウトボタン */}
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                >
                  ログアウト
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}
