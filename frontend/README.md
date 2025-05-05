# SSE Tutorial Frontend

このディレクトリには、Server-Sent Events（SSE）を使用したリアルタイム通信クライアントの実装が含まれています。Next.js、React、TypeScriptを使用して構築されています。

## 技術スタック

- **Next.js**: Reactフレームワーク
- **React**: UIライブラリ
- **TypeScript**: 型安全な開発環境
- **Tailwind CSS**: ユーティリティファーストのCSSフレームワーク
- **next-themes**: ダークモード管理
- **@heroicons/react**: アイコンライブラリ
- **ESLint & Prettier**: コード品質とフォーマット

## ディレクトリ構造

```
frontend/
├── .env.sample               # 環境変数設定ファイル
├── next.config.ts            # Next.js設定
├── package.json              # プロジェクト設定
├── tsconfig.json             # TypeScript設定
├── public/                   # 静的ファイル
└── src/                      # ソースコード
    ├── app/                  # App Router
    │   ├── components/       # コンポーネント
    │   │   ├── ConnectionStatus.tsx # 接続状態表示
    │   │   ├── EventListener.tsx    # イベントリスナー
    │   │   ├── MessageSender.tsx    # メッセージ送信
    │   │   ├── NavBar.tsx           # ナビゲーションバー
    │   │   └── ThemeSwitcher.tsx    # テーマ切り替え
    │   ├── lib/              # ユーティリティ関数
    │   │   ├── api.ts        # API通信
    │   │   └── auth.ts       # 認証機能
    │   ├── login/            # ログインページ
    │   │   ├── layout.tsx    # ログインレイアウト
    │   │   └── page.tsx      # ログインページ
    │   ├── globals.css       # グローバルスタイル
    │   ├── layout.tsx        # ルートレイアウト
    │   ├── page.tsx          # ホームページ
    │   └── providers.tsx     # プロバイダー
    └── middleware.ts         # ミドルウェア
```

## 主な機能

- **SSE接続**: サーバーからのリアルタイムイベント受信
- **JWT認証**: セキュアなAPI通信
- **メッセージ送信**: サーバーへのメッセージ送信
- **ダークモード**: テーマの切り替え
- **レスポンシブデザイン**: モバイルフレンドリーなUI
- **接続状態表示**: リアルタイムの接続状態フィードバック

## インストール

### 前提条件

- Node.js 18.0.0以上
- npm 8.0.0以上

### セットアップ手順

1. 依存関係のインストール

```bash
npm install
```

2. 環境変数の設定

ルートディレクトリに`.env.local`ファイルを作成：

```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## 開発環境の起動

```bash
# 開発モード（ホットリロード）
npm run dev

# 本番モード
npm run build
npm start
```

アプリケーションは`http://localhost:3001`で起動します。

## コンポーネント構成

### ページコンポーネント

- **page.tsx**: メインページ - メッセージ送信とイベント表示
- **login/page.tsx**: ログインページ - ユーザー認証

### 機能コンポーネント

- **EventListener.tsx**: SSEイベントの受信と表示
- **MessageSender.tsx**: メッセージ送信フォーム
- **ConnectionStatus.tsx**: 接続状態の表示
- **NavBar.tsx**: ナビゲーションバーとユーザー情報
- **ThemeSwitcher.tsx**: ダークモード切り替えボタン

### ユーティリティ

- **api.ts**: SSE接続とAPI通信
- **auth.ts**: JWT認証とユーザー管理

## テストユーザー

開発環境では、以下のテストユーザーが利用可能です：

- ユーザー名: `user01`
- パスワード: `password`

## コード品質

コード品質を維持するために以下のコマンドを使用できます：

```bash
# リント
npm run lint

# リント（自動修正）
npm run lint:fix

# フォーマット
npm run format

# フォーマットチェック
npm run format:check
```