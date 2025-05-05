import express from "express";
import cors from "cors";
import { PORT, FRONTEND_URL } from "./config/index";
import { loggingMiddleware } from "./middleware/logging";
import authRoutes from "./routes/auth";
import eventRoutes from "./routes/events";
import messageRoutes from "./routes/messages";
import { logInfo } from "./utils/logger";

// console警告を無視

const app = express();

// CORSを有効化
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  }),
);

// ロギングミドルウェアを適用
app.use(loggingMiddleware);

// ルーティングの設定
app.use("/api", authRoutes);
app.use("/", eventRoutes);
app.use("/", messageRoutes);

// サーバー起動
app.listen(PORT, () => {
  logInfo(`サーバー起動 - ポート: ${PORT} - URL: http://localhost:${PORT}`);
  logInfo("利用可能なエンドポイント:");
  logInfo("- GET  /events         : SSEイベントストリーム（認証不要）");
  logInfo("- GET  /secure-events  : SSEイベントストリーム（認証必要）");
  logInfo("- POST /send-message   : メッセージ送信");
  logInfo("- POST /api/login      : ログイン");
  logInfo("- POST /api/logout     : ログアウト");
});
