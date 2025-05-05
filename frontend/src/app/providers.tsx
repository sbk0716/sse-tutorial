"use client";
// クライアントコンポーネントであることを示す指示子
// このコンポーネントはクライアントサイドでのみ実行されます

/**
 * プロバイダーコンポーネント
 *
 * このコンポーネントは、アプリケーション全体で使用される
 * コンテキストプロバイダーを提供します。
 *
 * SSEアプリケーションでは、長時間の接続を前提としているため、
 * ユーザーの好みに合わせたテーマ設定が重要です。このコンポーネントは
 * テーマ設定のためのプロバイダーを提供し、ユーザーエクスペリエンスを
 * 向上させます。
 *
 * 将来的に認証状態やSSE接続状態などの他のコンテキストプロバイダーも
 * ここに追加することができます。
 */

import { ThemeProvider } from "next-themes";
// next-themesからThemeProviderをインポート
// ダークモード/ライトモードの切り替え機能を提供するプロバイダー

import { ReactNode } from "react";
// Reactの型定義をインポート
// ReactNode: Reactコンポーネントの子要素の型

/**
 * プロバイダーコンポーネント
 *
 * アプリケーション全体で使用されるコンテキストプロバイダーを提供します。
 * 現在はテーマプロバイダーのみを提供していますが、将来的に他の
 * プロバイダーも追加することができます。
 *
 * @param children - プロバイダー内にラップされる子コンポーネント
 * @returns JSX.Element - プロバイダーでラップされたコンポーネント
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class" // テーマ切り替えに使用するHTML属性（Tailwind CSSのダークモード対応）
      defaultTheme="system" // デフォルトのテーマ（システム設定に従う）
      enableSystem // システムのテーマ設定を有効にする
    >
      {/* プロバイダー内の子コンポーネントをレンダリング */}
      {children}
    </ThemeProvider>
  );
}
