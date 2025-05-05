/**
 * Server-Sent Events (SSE) アプリケーションの認証モジュール
 *
 * このファイルは、SSEアプリケーションの認証機能を提供します。
 * SSEでは、認証されたユーザーのみが特定のイベントストリームにアクセスできるようにするために、
 * 認証の仕組みが重要です。このモジュールは、ユーザーの認証状態を管理し、
 * 認証トークンの保存・取得・削除などの機能を提供します。
 *
 * SSEにおける認証の重要性:
 * 1. セキュリティ - 認証されたユーザーのみが特定のイベントストリームにアクセスできるようにする
 * 2. パーソナライゼーション - ユーザーごとに異なるイベントを送信できるようにする
 * 3. リソース管理 - 認証されたユーザーのみにリソースを提供し、サーバーの負荷を軽減する
 */

/**
 * 認証済みユーザーの型定義
 *
 * @property id - ユーザーの一意識別子
 * @property username - ユーザー名
 * @property role - ユーザーの役割（権限レベル）
 */
export interface AuthUser {
  id: number;
  username: string;
  role: string;
}

// クッキーの有効期限（1時間 = 60秒 × 60分）
// この期間が過ぎると、クッキーは自動的に削除され、ユーザーは再認証が必要になります
const COOKIE_MAX_AGE = 60 * 60;

/**
 * クッキーに認証トークンを保存する関数
 *
 * JWTトークンをブラウザのクッキーに保存します。
 * このトークンは、SSE接続時にサーバーに送信され、認証に使用されます。
 *
 * @param token - 保存するJWTトークン
 */
function setAuthCookie(token: string): void {
  // サーバーサイドでの実行時は何もしない（documentオブジェクトがない）
  if (typeof document === "undefined") return;

  // クッキーにトークンを保存
  // path=/: すべてのパスでクッキーを利用可能にする
  // max-age: クッキーの有効期限（秒単位）
  // SameSite=Lax: クロスサイトリクエストの制限（セキュリティ対策）
  document.cookie = `auth_token=${token}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

/**
 * クッキーから認証トークンを削除する関数
 *
 * ログアウト時などに、保存されている認証トークンを削除します。
 * max-age=0を設定することで、クッキーを即時に無効化します。
 */
function removeAuthCookie(): void {
  // サーバーサイドでの実行時は何もしない（documentオブジェクトがない）
  if (typeof document === "undefined") return;

  // クッキーを無効化（max-age=0を設定）
  document.cookie = "auth_token=; path=/; max-age=0; SameSite=Lax";
}

/**
 * ログイン関数
 *
 * ユーザー名とパスワードを使用してサーバーに認証リクエストを送信し、
 * 認証に成功した場合はJWTトークンを取得してクッキーに保存します。
 * また、認証状態の変更を通知するイベントを発行します。
 *
 * SSEアプリケーションでは、認証状態が変わると、新しい認証状態に基づいて
 * SSE接続を再確立する必要があります。
 *
 * @param username - ユーザー名
 * @param password - パスワード
 * @returns 認証成功時はtrue、失敗時はfalse
 */
export async function login(
  username: string,
  password: string,
): Promise<boolean> {
  try {
    // サーバーのログインAPIにリクエストを送信
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      },
    );

    // レスポンスが成功（200-299）でない場合は認証失敗
    if (!response.ok) {
      return false;
    }

    // レスポンスからJWTトークンを取得
    const data = await response.json();

    // トークンをクッキーに保存
    setAuthCookie(data.token);

    // 認証状態変更イベントを発行
    // このイベントにより、SSE接続を再確立するなどの処理がトリガーされます
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth-state-changed"));
    }

    return true;
  } catch (error) {
    // エラーハンドリング
    console.error("ログインエラー:", error);
    return false;
  }
}

/**
 * ログアウト関数
 *
 * サーバーにログアウトリクエストを送信し、
 * クッキーから認証トークンを削除します。
 * また、認証状態の変更を通知するイベントを発行します。
 *
 * SSEアプリケーションでは、ログアウト時にSSE接続を再確立し、
 * 認証が必要なイベントストリームから一般公開イベントストリームに
 * 切り替える必要があります。
 */
export async function logout(): Promise<void> {
  try {
    // サーバーのログアウトAPIにリクエストを送信
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/logout`, {
      method: "POST",
    });
  } catch (error) {
    // エラーハンドリング
    console.error("ログアウトエラー:", error);
  } finally {
    // エラーが発生しても、クライアント側では必ずトークンを削除
    removeAuthCookie();

    // 認証状態変更イベントを発行
    // このイベントにより、SSE接続を再確立するなどの処理がトリガーされます
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth-state-changed"));
    }
  }
}

/**
 * 現在のユーザー情報を取得する関数
 *
 * JWTトークンからユーザー情報を抽出します。
 * JWTトークンは、ヘッダー、ペイロード、署名の3つの部分からなり、
 * ペイロード部分にユーザー情報が含まれています。
 *
 * @returns 認証済みの場合はユーザー情報、未認証の場合はnull
 */
export function getCurrentUser(): AuthUser | null {
  // サーバーサイドでの実行時は何もしない（windowオブジェクトがない）
  if (typeof window === "undefined") {
    return null; // サーバーサイドでの実行時
  }

  // 認証トークンを取得
  const token = getAuthToken();
  if (!token) return null;

  try {
    // JWTのペイロード部分をデコード
    // JWTは「ヘッダー.ペイロード.署名」の形式になっているため、
    // split(".")で分割し、[1]でペイロード部分を取得
    const base64Url = token.split(".")[1];

    // Base64Url形式からBase64形式に変換
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

    // Base64デコードしてJSONをパース
    const payload = JSON.parse(window.atob(base64));

    // ユーザー情報を返す
    return {
      id: payload.id,
      username: payload.username,
      role: payload.role,
    };
  } catch (error) {
    // トークン解析エラーのハンドリング
    console.error("トークン解析エラー:", error);
    return null;
  }
}

/**
 * 認証トークンを取得する関数
 *
 * クッキーから認証トークンを取得します。
 * このトークンは、SSE接続時にサーバーに送信され、認証に使用されます。
 *
 * @returns 認証トークン、または未認証の場合はnull
 */
export function getAuthToken(): string | null {
  // サーバーサイドでの実行時は何もしない（windowオブジェクトがない）
  if (typeof window === "undefined") {
    return null; // サーバーサイドでの実行時
  }

  // クッキー文字列をセミコロンで分割して配列に変換
  const cookies = document.cookie.split(";");

  // auth_tokenで始まるクッキーを検索
  const authCookie = cookies.find((cookie) =>
    cookie.trim().startsWith("auth_token="),
  );

  // 認証クッキーが見つかった場合、その値（トークン）を返す
  if (authCookie) {
    return authCookie.split("=")[1];
  }

  // 認証クッキーが見つからない場合はnullを返す
  return null;
}

/**
 * ユーザーが認証済みかチェックする関数
 *
 * 認証トークンの有無を確認し、ユーザーが認証済みかどうかを判定します。
 * SSEアプリケーションでは、この関数を使用して、認証が必要なイベントストリームに
 * アクセスできるかどうかを判断します。
 *
 * @returns 認証済みならtrue、未認証ならfalse
 */
export function isAuthenticated(): boolean {
  // getAuthToken()がnullでなければtrue、nullならfalseを返す
  return !!getAuthToken();
}
