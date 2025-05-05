/**
 * 認証関連の型定義
 */
export interface AuthUser {
  id: number;
  username: string;
  role: string;
}

// クッキーの有効期限（1時間）
const COOKIE_MAX_AGE = 60 * 60;

/**
 * クッキーにトークンを保存
 * @param token JWTトークン
 */
function setAuthCookie(token: string): void {
  if (typeof document === "undefined") return;

  document.cookie = `auth_token=${token}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

/**
 * クッキーからトークンを削除
 */
function removeAuthCookie(): void {
  if (typeof document === "undefined") return;

  document.cookie = "auth_token=; path=/; max-age=0; SameSite=Lax";
}

/**
 * ログイン関数
 * @param username ユーザー名
 * @param password パスワード
 * @returns 認証成功時はtrue、失敗時はfalse
 */
export async function login(
  username: string,
  password: string,
): Promise<boolean> {
  try {
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

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    // トークンをクッキーとセッションストレージに保存
    setAuthCookie(data.token);

    // 認証状態変更イベントを発行
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth-state-changed"));
    }

    return true;
  } catch (error) {
    console.error("ログインエラー:", error);
    return false;
  }
}

/**
 * ログアウト関数
 */
export async function logout(): Promise<void> {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/logout`, {
      method: "POST",
    });
  } catch (error) {
    console.error("ログアウトエラー:", error);
  } finally {
    // クッキーとセッションストレージからトークンを削除
    removeAuthCookie();

    // 認証状態変更イベントを発行
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth-state-changed"));
    }
  }
}

/**
 * 現在のユーザー情報を取得
 * @returns ユーザー情報またはnull
 */
export function getCurrentUser(): AuthUser | null {
  if (typeof window === "undefined") {
    return null; // サーバーサイドでの実行時
  }

  const token = getAuthToken();
  if (!token) return null;

  try {
    // JWTのペイロード部分をデコード
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(window.atob(base64));

    return {
      id: payload.id,
      username: payload.username,
      role: payload.role,
    };
  } catch (error) {
    console.error("トークン解析エラー:", error);
    return null;
  }
}

/**
 * 認証トークンを取得
 * @returns 認証トークンまたはnull
 */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null; // サーバーサイドでの実行時
  }

  const cookies = document.cookie.split(";");
  const authCookie = cookies.find((cookie) =>
    cookie.trim().startsWith("auth_token="),
  );

  if (authCookie) {
    return authCookie.split("=")[1];
  }

  return null;
}

/**
 * ユーザーが認証済みかチェック
 * @returns 認証済みならtrue
 */
export function isAuthenticated(): boolean {
  return !!getAuthToken();
}
