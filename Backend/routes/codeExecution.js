import express from 'express';
import { runCode } from '../controllers/codeExecution.js';
import { authMiddleware } from '../middleware/authValidate.js';

const router = express.Router();

router.post('/run-code', authMiddleware, runCode);

export default router;
