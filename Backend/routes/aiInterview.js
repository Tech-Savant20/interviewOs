import express from 'express';
import { getInterviewQuestions ,evaluateAnswer, reviewCode } from '../controllers/aiInterview.js';
import { getJobPrep } from '../controllers/prep.js';
import { authMiddleware, interviewervalidation } from '../middleware/authValidate.js';

const router = express.Router();

router.post('/ai/interview-questions',authMiddleware, getInterviewQuestions);
router.post('/ai/evaluate-answer', authMiddleware, evaluateAnswer);
router.post('/ai/review-code', interviewervalidation, reviewCode);
router.get('/prep/job/:jobId', authMiddleware, getJobPrep);

export default router;
