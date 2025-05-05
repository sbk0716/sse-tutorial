/**
 * ログインページのレイアウトコンポーネント
 *
 * このファイルは、ログインページのレイアウトを定義します。
 * Next.jsのレイアウトシステムを使用して、ログインページの
 * メタデータとレイアウト構造を提供します。
 *
 * SSEアプリケーションでは、認証されていないユーザーに対して
 * 専用のログインページを表示し、認証後に適切なSSEストリームに
 * アクセスできるようにすることが重要です。
 */

import type { Metadata } from "next";
// Next.jsのメタデータ型をインポート
// ページのタイトルや説明などのメタデータを定義するために使用

/**
 * ログインページのメタデータ
 *
 * ページのタイトルと説明を定義します。
 * これらの情報は、ブラウザのタブやSEOに使用されます。
 */
export const metadata: Metadata = {
  title: "ログイン - SSE Tutorial", // ブラウザのタブに表示されるタイトル
  description: "Server-Sent Events チュートリアルのログインページ", // SEO用の説明文
};

/**
 * ログインページのレイアウトコンポーネント
 *
 * ログインページの全体的なレイアウト構造を定義します。
 * 中央揃えのフレックスボックスレイアウトを使用して、
 * ログインフォームを画面中央に配置します。
 *
 * @param children - レイアウト内に表示される子コンポーネント（ログインフォーム）
 * @returns JSX.Element - ログインページのレイアウト
 */
export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] py-12 px-4 sm:px-6 lg:px-8">
      {/* 子コンポーネント（ログインフォーム）をレンダリング */}
      {children}
    </div>
  );
}
