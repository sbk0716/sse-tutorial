# SSE Tutorial Backend

このディレクトリには、Server-Sent Events（SSE）を使用したリアルタイム通信サーバーの実装が含まれています。Express.jsとTypeScriptを使用して構築されています。

## 技術スタック

- **Express.js**: HTTPサーバーフレームワーク
- **TypeScript**: 型安全な開発環境
- **JWT**: 認証トークン
- **bcrypt**: パスワードハッシュ化
- **dotenv**: 環境変数管理
- **ESLint & Prettier**: コード品質とフォーマット

## ディレクトリ構造

```
backend/
├── .env.sample               # 環境変数設定ファイル
├── .prettierrc               # Prettier設定
├── eslint.config.mjs         # ESLint設定
├── package.json              # プロジェクト設定
├── tsconfig.json             # TypeScript設定
└── src/                      # ソースコード
    ├── config/               # 設定ファイル
    │   └── index.ts          # アプリケーション設定
    ├── controllers/          # コントローラー
    │   ├── authController.ts # 認証コントローラー
    │   ├── eventController.ts # イベントコントローラー
    │   └── messageController.ts # メッセージコントローラー
    ├── middleware/           # ミドルウェア
    │   ├── auth.ts           # 認証ミドルウェア
    │   └── logging.ts        # ロギングミドルウェア
    ├── models/               # モデル
    │   ├── client.ts         # クライアントモデル
    │   ├── event.ts          # イベントモデル
    │   └── user.ts           # ユーザーモデル
    ├── routes/               # ルーティング
    │   ├── auth.ts           # 認証ルート
    │   ├── events.ts         # イベントルート
    │   └── messages.ts       # メッセージルート
    ├── utils/                # ユーティリティ
    │   └── logger.ts         # ロギングユーティリティ
    └── server.ts             # メインサーバーファイル
```

## 主な機能

- **SSE接続**: クライアントとのリアルタイム通信
- **JWT認証**: セキュアなAPI通信
- **イベント管理**: イベントのキャッシュと再送信
- **複数の認証方法**: ヘッダー、クエリパラメータ、クッキー
- **ロギング**: 詳細なサーバーログ

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

ルートディレクトリに`.env`ファイルを作成：

```
PORT=3000
FRONTEND_URL=http://localhost:3001
JWT_SECRET=your-secret-key-should-be-very-long-and-random
```

## 開発環境の起動

```bash
# 開発モード（ホットリロード）
npm run dev

# 本番モード
npm run build
npm start
```

サーバーは`http://localhost:3000`で起動します（環境変数で変更可能）。

## APIエンドポイント

### 認証

- **POST /api/login**: ユーザー認証とJWTトークン発行

  - リクエスト: `{ "username": "user01", "password": "password" }`
  - レスポンス: `{ "token": "jwt-token-here" }`

- **POST /api/logout**: ログアウト処理
  - レスポンス: `{ "message": "ログアウトしました" }`

### SSE接続

- **GET /events**: 認証不要のSSEエンドポイント

  - レスポンス: SSEストリーム

- **GET /secure-events**: 認証必須のSSEエンドポイント
  - ヘッダー: `Authorization: Bearer <token>`
  - クエリ: `?token=<token>`
  - クッキー: `auth_token=<token>`
  - レスポンス: SSEストリーム

### メッセージ

- **POST /send-message**: 全クライアントにメッセージを送信
  - リクエスト: `{ "message": "こんにちは、世界！" }`
  - レスポンス: `{ "success": true, "message": "メッセージが送信されました", "recipients": 2 }`

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
