import { Request, Response } from "express";
import { clients } from "../models/client";
import { sendEvent } from "../models/event";
import { logMessageSent } from "../utils/logger";

// console警告を無視
/* eslint-disable no-console */

// 全クライアントにメッセージを送信するコントローラー
export const sendMessage = (req: Request, res: Response): void => {
  const message = req.body.message || "デフォルトメッセージ";
  const timestamp = new Date().toISOString();
  const clientIP =
    req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";

  // 全クライアントにメッセージを送信
  let successCount = 0;
  clients.forEach((client) => {
    try {
      sendEvent(client.res, "message", { time: timestamp, message: message });
      successCount++;
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] メッセージ送信エラー - クライアントID: ${client.id} - エラー: ${error}`,
      );
    }
  });

  logMessageSent(message, successCount, clientIP as string);
  res.status(200).json({
    success: true,
    message: "メッセージが送信されました",
    recipients: successCount,
  });
};
