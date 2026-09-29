import express from "express";
import { allJobs , applyJob , postJob,myJobs,getJob,deleteJob,editJob,filterJobs } from "../controllers/jobs.js";
import { authMiddleware } from "../middleware/authValidate.js";
import upload from "../utils/multer.js";

const router = express.Router();

// ← /allJobs/filter MUST be before /allJobs
router.get("/allJobs/filter", authMiddleware, filterJobs)  // ← move this UP
router.get("/allJobs", allJobs)
router.post("/applyJob", authMiddleware, upload.single("resume"), applyJob)
router.post("/postJob", authMiddleware, postJob)
router.get("/my-Jobs", authMiddleware, myJobs)
router.get("/get-job/:job_id", authMiddleware, getJob)
router.delete("/delete-job/:job_id", authMiddleware, deleteJob)
router.put("/edit-job/:job_id", authMiddleware, editJob)
export default router;