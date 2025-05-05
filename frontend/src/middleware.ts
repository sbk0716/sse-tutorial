/**
 * Server-Sent Events (SSE) アプリケーションのミドルウェア
 *
 * このファイルは、Next.jsのミドルウェア機能を使用して、
 * リクエストの認証状態を確認し、適切なページへのリダイレクトを行います。
 *
 * SSEアプリケーションでは、認証されたユーザーのみが特定のイベントストリームに
 * アクセスできるようにするために、認証の仕組みが重要です。
 * このミドルウェアは、認証トークンの有無に基づいて、保護されたルートへの
 * アクセスを制御します。
 *
 * このファイル全体は、Next.jsの公式ドキュメントの推奨パターンに従って実装されています。
 * 認証チェック、リダイレクト処理、パスのマッチングなど、すべての実装が
 * 公式のベストプラクティスに準拠しています。
 * 詳細は公式ドキュメントを参照してください：
 * https://nextjs.org/docs/app/building-your-application/routing/middleware
 */

import { NextResponse } from "next/server";
// Next.jsのレスポンスユーティリティをインポート
// NextResponseは、リダイレクトや次のミドルウェアへの処理の委譲などを行うためのオブジェクト

import type { NextRequest } from "next/server";
// Next.jsのリクエスト型定義をインポート
// NextRequestは、受信したHTTPリクエストの情報にアクセスするためのインターフェース

// 認証が不要なパス（パブリックルート）のリスト
// これらのパスには認証なしでアクセスできます
const publicPaths = ["/login"];

/**
 * ミドルウェア関数
 *
 * 各リクエストが処理される前に実行される関数です。
 *
 * このミドルウェア関数は以下の役割を果たします：
 * 1. 認証状態の確認 - クッキーからトークンを取得して認証状態を判断
 * 2. 保護されたルートの制御 - 未認証ユーザーを適切にリダイレクト
 * 3. ユーザーエクスペリエンスの向上 - 認証後に元のページに戻れるよう状態を保持
 * 4. 不要なログインページアクセスの防止 - 認証済みユーザーをホームにリダイレクト
 *
 * SSEアプリケーションでは、認証されたユーザーのみが特定のイベントストリームに
 * アクセスできるようにするために重要です。このミドルウェアにより、
 * 認証されていないユーザーがSSEストリームにアクセスすることを防ぎます。
 *
 * @param request - Next.jsのリクエストオブジェクト（NextRequest型）
 *                 リクエストのURL、ヘッダー、クッキーなどの情報を含む
 * @returns NextResponse - 以下のいずれかを返します：
 *                       - リダイレクトレスポンス（認証状態に応じて）
 *                       - 次のミドルウェアへの処理の委譲（通常の処理継続）
 */
export function middleware(request: NextRequest) {
  // 現在のパス（URL）を取得
  // リクエストされたページのパスを取得して、認証が必要かどうかを判断するために使用
  const path = request.nextUrl.pathname;

  // 認証トークンの確認
  // クッキーから認証トークンを取得し、ユーザーが認証済みかどうかを判断
  const authToken = request.cookies.get("auth_token")?.value;
  const isAuthenticated = !!authToken; // トークンが存在すれば認証済みと判断

  // 認証が不要なパス（パブリックルート）かどうかをチェック
  // publicPathsリストに含まれるパス、またはそのサブパスかどうかを確認
  const isPublicPath = publicPaths.some(
    (publicPath) => path === publicPath || path.startsWith(`${publicPath}/`),
  );

  // 認証されていない場合、かつ認証が必要なパスの場合はログインページにリダイレクト
  // 未認証ユーザーが保護されたルートにアクセスしようとした場合の処理
  if (!isAuthenticated && !isPublicPath) {
    // ログインページへのリダイレクトURLを作成
    const url = new URL("/login", request.url);
    // 認証後に元のページに戻れるよう、現在のURLをクエリパラメータとして追加
    url.searchParams.set("callbackUrl", encodeURI(request.url));
    // ログインページへリダイレクト
    return NextResponse.redirect(url);
  }

  // 認証済みでログインページにアクセスした場合はホームページにリダイレクト
  // 既に認証されているユーザーがログインページにアクセスしようとした場合の処理
  if (isAuthenticated && path === "/login") {
    // ホームページへリダイレクト
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 上記の条件に当てはまらない場合は、リクエストを通常通り処理
  return NextResponse.next();
}

// ミドルウェアを適用するパスを指定
// Next.jsのconfig設定で、どのパスに対してミドルウェアを実行するかを定義
export const config = {
  matcher: [
    /*
     * 以下のパスにマッチ:
     * - / (ホームページ)
     * - /login (ログインページ)
     * - /health (ヘルスチェックエンドポイント)
     * - /api/... (APIエンドポイント)
     *
     * 静的ファイル(_next/static, _next/image, favicon.ico)には適用しない
     * これはNext.jsの公式ドキュメントで推奨されているパターンで、
     * パフォーマンスを最適化するために静的ファイルへのリクエストでは
     * ミドルウェアを実行しないようにしています
     *
     * このconfigオブジェクトはファイル内で直接使用されるのではなく、
     * Next.jsのビルドプロセスによって自動的に読み取られ、
     * ミドルウェアの適用範囲を制限するために使用されます
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
