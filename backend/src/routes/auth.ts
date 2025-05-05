// 認証ルート設定ファイル
// このファイルは認証関連のエンドポイント（ログイン、ログアウト）のルーティングを定義します
// 認証付きSSEエンドポイントにアクセスするためのトークンを取得するためのルートを提供します
import express from "express";
// 認証コントローラー関数をインポートします
// loginはユーザー認証を処理し、JWTトークンを発行します
// logoutはログアウト処理を行います（実際にはクライアント側でトークンを削除）
import { login, logout } from "../controllers/authController";

// Expressルーターのインスタンスを作成します
// これを使用してエンドポイントを定義します
const router = express.Router();

// ログインエンドポイント
// '/api/login'へのPOSTリクエストでログイン処理を行います
// express.json()ミドルウェアを使用して、JSONリクエストボディを解析します
// これにより、req.bodyからユーザー名とパスワードを取得できます
router.post("/login", express.json(), login);

// ログアウトエンドポイント
// '/api/logout'へのPOSTリクエストでログアウト処理を行います
// 実際のログアウト処理はクライアント側で行われます（トークンの削除）
router.post("/logout", logout);

// ルーターをエクスポートして、server.tsで使用できるようにします
export default router;
