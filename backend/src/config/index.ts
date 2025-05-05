// アプリケーション設定ファイル
// このファイルはアプリケーション全体で使用される設定値を定義します
import dotenv from "dotenv";

// 環境変数の読み込み
// .envファイルから環境変数を読み込みます
// これにより、開発環境と本番環境で異なる設定を使用できます
dotenv.config();

// JWT（JSON Web Token）設定
// 認証に使用されるJWTの設定です
// JWT_SECRETはトークンの署名に使用される秘密鍵です
export const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
// JWT_EXPIRES_INはトークンの有効期限です（1時間）
export const JWT_EXPIRES_IN = "1h";

// サーバー設定
// PORTはサーバーが待ち受けるポート番号です
// 環境変数から取得するか、デフォルト値として3000を使用します
export const PORT = process.env.PORT || 3000;
// FRONTEND_URLはCORS設定に使用されるフロントエンドのURLです
// 環境変数から取得するか、デフォルト値としてlocalhost:3001を使用します
export const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3001";

// SSE（Server-Sent Events）設定
// MAX_CLIENTSは同時に接続できるSSEクライアントの最大数です
// この制限を超えると、新しい接続は503エラーで拒否されます
// サーバーリソースの過負荷を防ぐために重要です
export const MAX_CLIENTS = 1000;
// MAX_CACHE_SIZEはイベントキャッシュの最大サイズです
// 再接続時に失われたイベントを再送するために使用されるキャッシュの上限です
// メモリ使用量を制限するために重要です
export const MAX_CACHE_SIZE = 100;
