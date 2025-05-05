// SSE（Server-Sent Events）メッセージルート設定ファイル
// このファイルはSSEクライアントへのメッセージ送信エンドポイントのルーティングを定義します
// 通常の一括送信とストリーミング送信の両方のエンドポイントを提供します
import express from "express";
// メッセージ送信を処理するコントローラー関数をインポートします
// これらの関数は接続中のすべてのSSEクライアントにメッセージを送信します
// sendMessage: 通常の一括送信用コントローラー
// streamMessage: ストリーミング形式の段階的送信用コントローラー
import { sendMessage, streamMessage } from "../controllers/messageController";

// Expressルーターのインスタンスを作成します
// これを使用してエンドポイントを定義します
// Express.jsのルーターを使用することで、関連するエンドポイントをグループ化し、
// コードの構造を整理することができます
const router = express.Router();

// 全クライアントにメッセージを送信するエンドポイント
// '/send-message'へのPOSTリクエストでメッセージを送信します
// express.json()ミドルウェアを使用して、JSONリクエストボディを解析します
// これにより、req.bodyからメッセージ内容を取得できます
// このエンドポイントは、メッセージを一度に全て送信する通常の送信方式を使用します
router.post("/send-message", express.json(), sendMessage);

// 全クライアントにメッセージをストリーミング形式で送信するエンドポイント
// '/stream-message'へのPOSTリクエストでメッセージを段階的に送信します
// メッセージは小さなチャンクに分割され、順次送信されます
// このエンドポイントは、ChatGPTのような「考え中」の表示を実現するために使用されます
// express.json()ミドルウェアを使用して、JSONリクエストボディを解析します
// 送信されたメッセージは単語ごとに分割され、100ms間隔で段階的に送信されます
router.post("/stream-message", express.json(), streamMessage);

// ルーターをエクスポートして、server.tsで使用できるようにします
// メインのサーバーファイルでこのルーターをマウントすることで、
// 定義したエンドポイントがアプリケーション全体で利用可能になります
export default router;
