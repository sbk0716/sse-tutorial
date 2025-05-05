import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 認証が不要なパス
const publicPaths = ["/login"];

export function middleware(request: NextRequest) {
  // 現在のパスを取得
  const path = request.nextUrl.pathname;

  // 認証トークンの確認
  const authToken = request.cookies.get("auth_token")?.value;
  const isAuthenticated = !!authToken;

  // 認証が不要なパスかどうかをチェック
  const isPublicPath = publicPaths.some(
    (publicPath) => path === publicPath || path.startsWith(`${publicPath}/`),
  );

  // 認証されていない場合、かつ認証が必要なパスの場合はログインページにリダイレクト
  if (!isAuthenticated && !isPublicPath) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", encodeURI(request.url));
    return NextResponse.redirect(url);
  }

  // 認証済みでログインページにアクセスした場合はホームページにリダイレクト
  if (isAuthenticated && path === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// ミドルウェアを適用するパスを指定
export const config = {
  matcher: [
    /*
     * 以下のパスにマッチ:
     * - /
     * - /login
     * - /health
     * - /api/...
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
