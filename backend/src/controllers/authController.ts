// 認証コントローラーファイル
// このファイルはユーザー認証（ログイン、ログアウト）を処理します
// 認証付きSSEエンドポイントで使用されるJWTトークンの発行を担当します
import { Request, Response } from "express";
// JWTトークンを生成するためのライブラリをインポートします
import jwt from "jsonwebtoken";
// パスワードハッシュを検証するためのライブラリをインポートします
import bcrypt from "bcrypt";
// ユーザー検索関数をインポートします
import { findUserByUsername } from "../models/user";
// JWT設定（秘密鍵、有効期限）を設定ファイルからインポートします
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/index";
// ログイン試行をログに記録するための関数をインポートします
import { logLogin } from "../utils/logger";

// ログインコントローラー
// このコントローラーはユーザー認証を処理し、成功した場合はJWTトークンを発行します
// 認証付きSSEエンドポイント（/secure-events）にアクセスするために必要なトークンを提供します
export const login = (req: Request, res: Response): void => {
  // リクエストボディからユーザー名とパスワードを取得します
  const { username, password } = req.body;
  // クライアントのIPアドレスを取得します（ロギングとデバッグ用）
  const clientIP =
    req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";

  // ユーザーの検索
  // 指定されたユーザー名を持つユーザーをデータベース（この場合は配列）から検索します
  const user = findUserByUsername(username);
  // ユーザーが見つからない場合は401エラーを返します
  if (!user) {
    // ログイン失敗をログに記録します
    logLogin(username, false, "ユーザーが見つかりません", clientIP as string);
    // セキュリティ上の理由から、具体的なエラー理由は返さず、一般的なメッセージを返します
    res
      .status(401)
      .json({ message: "ユーザー名またはパスワードが正しくありません" });
    return;
  }

  // 開発用の簡易認証（パスワードが'password'の場合は認証成功）
  // 注意: これは開発環境でのみ使用すべきで、本番環境では削除すべきです
  if (password === "password") {
    // 簡易認証によるログイン成功をログに記録します
    logLogin(username, true, "簡易認証", clientIP as string);

    // JWTトークンの生成
    // ユーザーID、ユーザー名、ロールを含むペイロードでトークンを作成します
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN, // トークンの有効期限（設定ファイルで定義）
      },
    );

    // トークンを返す
    // クライアントはこのトークンを使用して認証付きSSEエンドポイントにアクセスできます
    res.status(200).json({ token });
    return;
  }

  // パスワードの検証
  // bcryptを使用してハッシュ化されたパスワードと入力されたパスワードを比較します
  bcrypt.compare(
    password,
    user.password,
    (err: Error | undefined, result: boolean): void => {
      // パスワード検証中にエラーが発生した場合
      if (err) {
        // パスワード検証エラーをログに記録します
        logLogin(
          username,
          false,
          `パスワード検証エラー: ${err.message}`,
          clientIP as string,
        );
        // 401エラーを返します
        res
          .status(401)
          .json({ message: "ユーザー名またはパスワードが正しくありません" });
        return;
      }

      // パスワードが一致しない場合
      if (!result) {
        // パスワード不一致をログに記録します
        logLogin(username, false, "パスワード不一致", clientIP as string);
        // 401エラーを返します
        res
          .status(401)
          .json({ message: "ユーザー名またはパスワードが正しくありません" });
        return;
      }

      // パスワードが一致した場合（ログイン成功）
      // 通常認証によるログイン成功をログに記録します
      logLogin(username, true, "通常認証", clientIP as string);

      // JWTトークンの生成
      // ユーザーID、ユーザー名、ロールを含むペイロードでトークンを作成します
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        {
          expiresIn: JWT_EXPIRES_IN, // トークンの有効期限（設定ファイルで定義）
        },
      );

      // トークンを返す
      // クライアントはこのトークンを使用して認証付きSSEエンドポイントにアクセスできます
      res.status(200).json({ token });
    },
  );
};

// ログアウトコントローラー（クライアント側でトークンを削除するため、シンプルなレスポンスのみ）
// JWTはステートレスなので、サーバー側でのセッション管理は行いません
// クライアントは単にトークンを破棄することでログアウトします
export const logout = (_req: Request, res: Response): void => {
  // 成功メッセージを返します
  // 実際のログアウト処理はクライアント側で行われます（トークンの削除）
  res.status(200).json({ message: "ログアウトしました" });
};
