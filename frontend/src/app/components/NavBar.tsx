"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isAuthenticated, getCurrentUser, logout } from "../lib/auth";
import ThemeSwitcher from "./ThemeSwitcher";

export default function NavBar() {
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const router = useRouter();

  useEffect(() => {
    // クライアントサイドでのみ実行
    const checkAuth = () => {
      const auth = isAuthenticated();
      setAuthenticated(auth);

      if (auth) {
        const user = getCurrentUser();
        setUsername(user?.username || "");
      } else {
        setUsername("");
      }
    };

    checkAuth();

    // 認証状態変更イベントを監視
    const handleAuthStateChanged = () => {
      checkAuth();
    };

    // 独自で定義したカスタムイベント
    window.addEventListener("auth-state-changed", handleAuthStateChanged);

    return () => {
      window.removeEventListener("auth-state-changed", handleAuthStateChanged);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    setAuthenticated(false);
    setUsername("");
    router.push("/login");
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link
                href="/"
                className="text-xl font-bold text-blue-600 dark:text-blue-400"
              >
                SSE Tutorial
              </Link>
            </div>
          </div>

          <div className="flex items-center">
            <ThemeSwitcher />

            {authenticated ? (
              <div className="ml-4 flex items-center">
                <span className="text-[var(--foreground)] mr-4">
                  {username}さん
                </span>
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
