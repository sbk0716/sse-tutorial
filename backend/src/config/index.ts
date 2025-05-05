import dotenv from 'dotenv';

// 環境変数の読み込み
dotenv.config();

// JWT設定
export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
export const JWT_EXPIRES_IN = '1h';

// サーバー設定
export const PORT = process.env.PORT || 3000;
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';

// SSE設定
export const MAX_CLIENTS = 1000;
export const MAX_CACHE_SIZE = 100;