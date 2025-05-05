import express from 'express';
import { connectSSE, connectSecureSSE } from '../controllers/eventController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// SSE接続エンドポイント（認証不要）
router.get('/events', connectSSE);

// 認証付きSSE接続エンドポイント
router.get('/secure-events', authMiddleware, connectSecureSSE);

export default router;