// SSE（Server-Sent Events）ルート設定ファイル
// このファイルはSSEエンドポイントのルーティングを定義します
import express from "express";
// SSE接続を処理するコントローラー関数をインポートします
// connectSSEは認証不要のSSE接続を処理し、connectSecureSSEは認証付きSSE接続を処理します
import { connectSSE, connectSecureSSE } from "../controllers/eventController";
// 認証ミドルウェアをインポートします
// 認証付きSSEエンドポイントでユーザー認証を行うために使用されます
import { authMiddleware } from "../middleware/auth";

// Expressルーターのインスタンスを作成します
// これを使用してエンドポイントを定義します
const router = express.Router();

// SSE接続エンドポイント（認証不要）
// '/events'へのGETリクエストでSSE接続を確立します
// このエンドポイントは認証を必要とせず、誰でもアクセスできます
// クライアントはこのエンドポイントに接続することでイベントストリームを受信できます
router.get("/events", connectSSE);

// 認証付きSSE接続エンドポイント
// '/secure-events'へのGETリクエストで認証付きSSE接続を確立します
// authMiddlewareを通過した（認証された）リクエストのみが処理されます
// 認証されていないリクエストは401エラーで拒否されます
router.get("/secure-events", authMiddleware, connectSecureSSE);

// ルーターをエクスポートして、server.tsで使用できるようにします
export default router;
