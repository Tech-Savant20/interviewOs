import db from "../config/db.js";
import { skillGap, levelForExperience, summarizeScores } from "../utils/skillMatch.js";

const jobSkillsOf = async (jobId) => {
  const [rows] = await db.execute(
    "SELECT skill_name FROM job_skills WHERE job_id = ? ORDER BY skill_id",
    [jobId]
  );
  return rows.map((r) => r.skill_name);
};

const candidateSkillsOf = async (userId) => {
  const [rows] = await db.execute("SELECT skill FROM student_skills WHERE user_id = ?", [userId]);
  return rows.map((r) => r.skill);
};

// Skill match + mock-interview readiness of one candidate for one job (shared with the recruiter view)
export const getCandidateInsights = async (userId, jobId) => {
  const [jobSkills, candidateSkills] = await Promise.all([jobSkillsOf(jobId), candidateSkillsOf(userId)]);

  const [[jobScores], [allScores]] = await Promise.all([
    db.execute("SELECT score FROM mock_interviews WHERE user_id = ? AND job_id = ?", [userId, jobId]),
    db.execute("SELECT score FROM mock_interviews WHERE user_id = ?", [userId]),
  ]);

  return {
    ...skillGap(jobSkills, candidateSkills),
    readiness: summarizeScores(jobScores.map((r) => r.score)),
    overallPractice: summarizeScores(allScores.map((r) => r.score)),
  };
};

// Candidate: what to practise for a job — the skill gap decides the topics, experience the difficulty
export const getJobPrep = async (req, res) => {
  try {
    const jobId = Number.parseInt(req.params.jobId, 10);
    if (!Number.isInteger(jobId)) {
      return res.status(400).json({ success: false, message: "Invalid job id" });
    }

    const [jobs] = await db.execute(
      "SELECT job_id, job_name, company, role, experience FROM jobs WHERE job_id = ?",
      [jobId]
    );
    if (jobs.length === 0) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    const insights = await getCandidateInsights(req.user.id, jobId);

    res.status(200).json({
      success: true,
      job: jobs[0],
      level: levelForExperience(jobs[0].experience),
      // Missing skills first: that is where practice helps most
      suggestedTopics: [...insights.missing, ...insights.matched],
      ...insights,
    });
  } catch (err) {
    console.log("Job Prep Error:", err);
    res.status(500).json({ success: false, message: "Failed to load job prep" });
  }
};
