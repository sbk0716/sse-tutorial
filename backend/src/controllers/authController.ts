import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { findUserByUsername } from "../models/user";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/index";
import { logLogin } from "../utils/logger";

// ログインコントローラー
export const login = (req: Request, res: Response): void => {
  const { username, password } = req.body;
  const clientIP =
    req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";

  // ユーザーの検索
  const user = findUserByUsername(username);
  if (!user) {
    logLogin(username, false, "ユーザーが見つかりません", clientIP as string);
    res
      .status(401)
      .json({ message: "ユーザー名またはパスワードが正しくありません" });
    return;
  }

  // 開発用の簡易認証（パスワードが'password'の場合は認証成功）
  if (password === "password") {
    logLogin(username, true, "簡易認証", clientIP as string);

    // JWTトークンの生成
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN,
      },
    );

    // トークンを返す
    res.status(200).json({ token });
    return;
  }

  // パスワードの検証
  bcrypt.compare(
    password,
    user.password,
    (err: Error | undefined, result: boolean): void => {
      if (err) {
        logLogin(
          username,
          false,
          `パスワード検証エラー: ${err.message}`,
          clientIP as string,
        );
        res
          .status(401)
          .json({ message: "ユーザー名またはパスワードが正しくありません" });
        return;
      }

      if (!result) {
        logLogin(username, false, "パスワード不一致", clientIP as string);
        res
          .status(401)
          .json({ message: "ユーザー名またはパスワードが正しくありません" });
        return;
      }

      logLogin(username, true, "通常認証", clientIP as string);

      // JWTトークンの生成
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        {
          expiresIn: JWT_EXPIRES_IN,
        },
      );

      // トークンを返す
      res.status(200).json({ token });
    },
  );
};

// ログアウトコントローラー（クライアント側でトークンを削除するため、シンプルなレスポンスのみ）
export const logout = (_req: Request, res: Response): void => {
  res.status(200).json({ message: "ログアウトしました" });
};
