import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/index";

// ExpressRequestを拡張してuserプロパティを追加
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
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // ヘッダーからトークンを取得
  const authHeader = req.headers.authorization;
  // クエリパラメータからトークンを取得
  const tokenQuery = req.query.token as string;
  // クッキーからトークンを取得
  const cookies = req.headers.cookie
    ?.split(";")
    .find((c) => c.trim().startsWith("auth_token="));
  const tokenCookie = cookies ? cookies.split("=")[1] : null;

  // トークンの取得（優先順位: ヘッダー > クエリ > クッキー）
  let token: string | null = null;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (tokenQuery) {
    token = tokenQuery;
  } else if (tokenCookie) {
    token = tokenCookie;
  }

  if (!token) {
    res.status(401).send("認証が必要です");
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number;
      username: string;
      role: string;
    };
    req.user = decoded;
    next();
  } catch {
    res.status(401).send("無効なトークンです");
    return;
  }
};
