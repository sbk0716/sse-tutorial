"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "../lib/auth";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const success = await login(username, password);
      if (success) {
        router.push("/");
      } else {
        setError("ユーザー名またはパスワードが正しくありません");
      }
    } catch (err) {
      setError("ログイン中にエラーが発生しました");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="w-full max-w-md space-y-6 p-8 bg-white dark:bg-gray-700 rounded-xl shadow-lg border border-gray-200 dark:border-gray-600 text-[var(--foreground)]"
      style={{ boxShadow: "var(--login-shadow)" }}
    >
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-[var(--foreground)]">
          ログイン
        </h2>
        <p className="mt-2 text-center text-sm text-[var(--foreground)]">
          SSEチュートリアルへようこそ
        </p>
      </div>

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative dark:bg-red-900 dark:text-red-100 dark:border-red-800"
          role="alert"
        >
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="rounded-md shadow-sm -space-y-px">
          <div>
            <label htmlFor="username" className="sr-only">
              ユーザー名
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-600 text-[var(--foreground)] bg-white rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-300"
              placeholder="ユーザー名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              パスワード
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-600 text-[var(--foreground)] bg-white rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-300"
              placeholder="パスワード"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {isLoading ? "ログイン中..." : "ログイン"}
          </button>
        </div>

        <div className="text-sm text-center">
          <p className="text-[var(--foreground)]">
            テスト用アカウント: user01 / password
          </p>
        </div>
      </form>
    </div>
  );
}
