import express from 'express';
import { login, logout } from '../controllers/authController';

const router = express.Router();

// ログインエンドポイント
router.post('/login', express.json(), login);

// ログアウトエンドポイント
router.post('/logout', logout);

export default router;