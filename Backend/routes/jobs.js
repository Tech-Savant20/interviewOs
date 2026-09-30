import express from "express";
import { allJobs , applyJob , postJob,myJobs,getJob,deleteJob,editJob,filterJobs } from "../controllers/jobs.js";
import { authMiddleware, interviewervalidation } from "../middleware/authValidate.js";
import upload from "../utils/multer.js";

const router = express.Router();

// ← /allJobs/filter MUST be before /allJobs
router.get("/allJobs/filter", authMiddleware, filterJobs)  // ← move this UP
router.get("/allJobs", allJobs)
router.post("/applyJob", authMiddleware, upload.single("resume"), applyJob)

// Recruiter-only
router.post("/postJob", interviewervalidation, postJob)
router.get("/my-Jobs", interviewervalidation, myJobs)
router.get("/get-job/:job_id", interviewervalidation, getJob)
router.delete("/delete-job/:job_id", interviewervalidation, deleteJob)
router.put("/edit-job/:job_id", interviewervalidation, editJob)
export default router;
