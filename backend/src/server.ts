// Server-Sent Events（SSE）を実装するExpressサーバーのメインファイル
// SSEとは、サーバーからクライアントへの一方向通信を実現するHTTP技術です
import express from "express";
// CORSミドルウェアを使用して、異なるオリジン（ドメイン）からのリクエストを許可します
// SSEはHTTPベースなので、CORSポリシーの対象となります
import cors from "cors";
// サーバー設定を読み込みます（ポート番号、フロントエンドURL、最大クライアント数など）
import { PORT, FRONTEND_URL } from "./config/index";
// すべてのリクエストをログに記録するミドルウェアをインポートします
import { loggingMiddleware } from "./middleware/logging";
// 認証関連のルート（ログイン、ログアウト）をインポートします
import authRoutes from "./routes/auth";
// SSEイベントストリームのルート（/events, /secure-events）をインポートします
// これらのエンドポイントがSSE接続を確立するために使用されます
import eventRoutes from "./routes/events";
// メッセージ送信のルート（/send-message）をインポートします
// このエンドポイントを通じて、接続中のすべてのクライアントにメッセージを送信できます
import messageRoutes from "./routes/messages";
// ログ出力用のユーティリティ関数をインポートします
import { logInfo } from "./utils/logger";

// console警告を無視（TypeScriptのESLint設定に関連）

// Expressアプリケーションのインスタンスを作成します
// これがHTTPサーバーの基盤となります
const app = express();

// CORSを有効化します
// SSEはHTTPベースなので、異なるオリジンからアクセスする場合はCORS設定が必要です
// origin: フロントエンドのURLからのリクエストのみを許可します
// credentials: Cookieなどの認証情報を含むリクエストを許可します（認証付きSSEに必要）
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  }),
);

// ロギングミドルウェアを適用します
// すべてのリクエストとレスポンスの情報をログに記録します
app.use(loggingMiddleware);

// ルーティングの設定
// 各種エンドポイントを定義します
// '/api'プレフィックスを持つルートは認証関連のエンドポイントです
app.use("/api", authRoutes);
// ルートパスにSSEイベントストリームのエンドポイントを設定します
// '/events'と'/secure-events'がここで定義されます
app.use("/", eventRoutes);
// ルートパスにメッセージ送信エンドポイントを設定します
// '/send-message'がここで定義されます
app.use("/", messageRoutes);

// サーバーを指定されたポートで起動します
// SSEはHTTPサーバー上で動作するため、通常のExpressサーバーと同じ方法で起動します
app.listen(PORT, () => {
  // サーバー起動情報をログに出力します
  logInfo(`サーバー起動 - ポート: ${PORT} - URL: http://localhost:${PORT}`);
  logInfo("利用可能なエンドポイント:");
  // SSEストリームを確立するためのエンドポイント（認証不要）
  // クライアントはこのエンドポイントに接続することでイベントを受信できます
  logInfo("- GET  /events         : SSEイベントストリーム（認証不要）");
  // 認証が必要なSSEストリームを確立するためのエンドポイント
  // JWTトークンによる認証が必要です
  logInfo("- GET  /secure-events  : SSEイベントストリーム（認証必要）");
  // 接続中のすべてのクライアントにメッセージを送信するエンドポイント
  logInfo("- POST /send-message   : メッセージ送信");
  // ユーザー認証のためのエンドポイント
  logInfo("- POST /api/login      : ログイン");
  // ログアウト用のエンドポイント
  logInfo("- POST /api/logout     : ログアウト");
});
