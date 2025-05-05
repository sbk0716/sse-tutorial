import express from 'express';
import { sendMessage } from '../controllers/messageController';

const router = express.Router();

// 全クライアントにメッセージを送信するエンドポイント
router.post('/send-message', express.json(), sendMessage);

export default router;