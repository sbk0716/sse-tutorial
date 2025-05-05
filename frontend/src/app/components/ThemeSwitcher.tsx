"use client";
// クライアントコンポーネントであることを示す指示子
// このコンポーネントはクライアントサイドでのみ実行されます

/**
 * テーマ切り替えコンポーネント
 *
 * このコンポーネントは、アプリケーションのテーマ（ライト/ダークモード）を
 * 切り替えるためのボタンを提供します。
 *
 * SSEアプリケーションでは、長時間の接続を前提としているため、
 * ユーザーの好みに合わせたテーマ設定が重要です。特に夜間の使用では
 * ダークモードが目の疲れを軽減します。
 */

import { useTheme } from "next-themes";
// next-themesからuseThemeフックをインポート
// テーマの現在の状態と切り替え関数を提供するフック

import { useEffect, useState } from "react";
// Reactのフックをインポート
// useEffect: 副作用を扱うためのフック
// useState: コンポーネントの状態を管理するためのフック

import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";
// Heroiconsからアイコンをインポート
// SunIcon: 太陽のアイコン（ライトモード切替用）
// MoonIcon: 月のアイコン（ダークモード切替用）

/**
 * テーマ切り替えボタンコンポーネント
 *
 * 現在のテーマに応じて太陽または月のアイコンを表示し、
 * クリックするとテーマを切り替えるボタンを提供します。
 *
 * @returns JSX.Element - テーマ切替ボタンを表示するコンポーネント
 */
export default function ThemeSwitcher() {
  // コンポーネントがマウントされたかどうかを追跡する状態
  // これはクライアントサイドレンダリングとサーバーサイドレンダリングの
  // 不一致（ハイドレーションエラー）を防ぐために必要です
  const [mounted, setMounted] = useState(false);

  // 現在のテーマと、テーマを変更するための関数を取得
  const { theme, setTheme } = useTheme();

  // コンポーネントのマウント時に実行される副作用
  // クライアントサイドでのみ実行されます
  useEffect(() => {
    // コンポーネントがマウントされたことを記録
    setMounted(true);
  }, []); // 空の依存配列は、このエフェクトがコンポーネントのマウント時に1回だけ実行されることを意味します

  // コンポーネントがマウントされるまでは何も表示しない
  // これにより、サーバーサイドレンダリングとクライアントサイドレンダリングの不一致を防ぎます
  if (!mounted) {
    return null;
  }

  return (
    <button
      // クリック時に現在のテーマを反転（ダーク→ライト、ライト→ダーク）
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      // ボタンのスタイル（Tailwind CSS）
      className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
      // アクセシビリティのためのラベル
      aria-label="テーマ切り替え"
    >
      {/* 現在のテーマに応じてアイコンを切り替え */}
      {theme === "dark" ? (
        // ダークモード時は太陽のアイコン（ライトモードに切り替え可能を示す）
        <SunIcon className="h-5 w-5 text-yellow-500" />
      ) : (
        // ライトモード時は月のアイコン（ダークモードに切り替え可能を示す）
        <MoonIcon className="h-5 w-5 text-blue-400" />
      )}
    </button>
  );
}
