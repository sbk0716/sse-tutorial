// 認証ミドルウェアファイル
// このファイルは認証が必要なエンドポイント（認証付きSSEなど）のユーザー認証を処理します
import { Request, Response, NextFunction } from "express";
// JWTを検証するためのライブラリをインポートします
import jwt from "jsonwebtoken";
// JWT署名に使用する秘密鍵を設定ファイルからインポートします
import { JWT_SECRET } from "../config/index";

// ExpressRequestを拡張してuserプロパティを追加
// これにより、認証されたユーザーの情報をリクエストオブジェクトに保存できます
// コントローラーでreq.userとしてアクセスできるようになります
declare module "express" {
  interface Request {
    user?: {
      id: number;
      username: string;
      role: string;
    };
  }
}

// 認証ミドルウェア
// このミドルウェアは認証が必要なルート（/secure-eventsなど）で使用されます
// JWTトークンを検証し、有効な場合はリクエストを次のハンドラーに渡します
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // ヘッダーからトークンを取得
  // Authorization: Bearer xxxxx 形式のヘッダーからトークンを抽出します
  const authHeader = req.headers.authorization;
  // クエリパラメータからトークンを取得
  // ?token=xxxxx 形式のURLパラメータからトークンを抽出します
  // これはSSEのようなストリーミング接続で特に便利です（ヘッダーが使えない場合）
  const tokenQuery = req.query.token as string;
  // クッキーからトークンを取得
  // auth_token=xxxxx 形式のクッキーからトークンを抽出します
  const cookies = req.headers.cookie
    ?.split(";")
    .find((c) => c.trim().startsWith("auth_token="));
  const tokenCookie = cookies ? cookies.split("=")[1] : null;

  // トークンの取得（優先順位: ヘッダー > クエリ > クッキー）
  // 複数の場所からトークンを取得できるようにすることで、
  // さまざまなクライアント環境（ブラウザ、モバイルアプリなど）に対応できます
  let token: string | null = null;

  // Authorizationヘッダーがあり、Bearer形式の場合
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }
  // クエリパラメータにトークンがある場合
  else if (tokenQuery) {
    token = tokenQuery;
  }
  // クッキーにトークンがある場合
  else if (tokenCookie) {
    token = tokenCookie;
  }

  // トークンがない場合は401 Unauthorizedエラーを返します
  if (!token) {
    res.status(401).send("認証が必要です");
    return;
  }

  try {
    // JWTトークンを検証します
    // トークンが有効な場合、デコードされたペイロードを取得します
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number;
      username: string;
      role: string;
    };
    // デコードされたユーザー情報をリクエストオブジェクトに保存します
    // これにより、後続のハンドラー（コントローラーなど）でユーザー情報にアクセスできます
    req.user = decoded;
    // 次のミドルウェアまたはルートハンドラーに処理を渡します
    next();
  } catch {
    // トークンが無効な場合（期限切れ、改ざんなど）は401エラーを返します
    res.status(401).send("無効なトークンです");
    return;
  }
};
