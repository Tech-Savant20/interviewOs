import express from "express";
import { getDashboard,scheduleInterview ,getScheduledInterviews,getResumeUrl,getMeetingUrl} from "../controllers/interviewerDashboard.js";
import { authMiddleware, interviewervalidation } from "../middleware/authValidate.js";

const router = express.Router();

router.get("/dashboard", interviewervalidation, getDashboard);
router.get("/getScheduledInterviews", interviewervalidation, getScheduledInterviews);
router.post("/schedule-interview", interviewervalidation, scheduleInterview);
router.get("/resume/:applicationId",interviewervalidation,getResumeUrl);
router.post("/getMeetingUrl",authMiddleware,getMeetingUrl)

export default router;
