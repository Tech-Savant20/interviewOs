import db from "../config/db.js";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import ExpressError from "../ExpressError.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3, { S3_BUCKET, S3_REGION } from "../utils/S3.js";
import { queryWithRetry } from "../utils/queryWithRetry.js";

import redis from "../Redis.js";

import SkillMatchingEmailQueue from "../queues/SkillMatchingEmailQueue.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

export const LOCAL_RESUME_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)), "..", "uploads", "resumes"
);


export const allJobs = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 5);
    const offset = (page - 1) * limit;

    const cacheKey = `alljobs:page:${page}:limit:${limit}`;

    // Check Redis Cache
    const cachedJobs = await redis.get(cacheKey);

    if (cachedJobs) {
      console.log("All Jobs Cache Hit");
      return res.status(200).json(JSON.parse(cachedJobs));
    }

    console.log("All Jobs Cache Miss");

    const [jobs] = await queryWithRetry(
      db,
      `SELECT
        j.*,
        u.username,
        u.email
      FROM jobs j
      LEFT JOIN users u
        ON j.posted_by = u.user_id
      ORDER BY j.created_at DESC
      LIMIT ${limit} OFFSET ${offset}`
    );

    const [[{ total }]] = await queryWithRetry(
      db,
      `SELECT COUNT(*) AS total FROM jobs`
    );

    const responseData = {
      success: true,
      jobs,
      totalJobs: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };

    // Cache for 10 minutes
    await redis.set(cacheKey, JSON.stringify(responseData), "EX", 600);

    return res.status(200).json(responseData);
  } catch (err) {
    console.error("All Jobs Error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const applyJob = async (req, res, next) => {
  try {
    console.log("userId in applyJob:", req.user.id);
    console.log("req.body:", req.body);
    console.log("req.file:", req.file);

    const { email, phone, name, jobId } = req.body;

    if (!email || !phone || !name || !jobId) {
      throw new ExpressError("All fields are required", 400);
    }

    const [job] = await db.execute(
      `SELECT *
       FROM jobs
       JOIN users ON jobs.posted_by = users.user_id
       WHERE jobs.job_id = ?`,
      [jobId]
    );

    if (job[0].posted_by === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot apply to your own job",
      });
    }

    let resumeUrl = null;

    console.log("Bucket Name:", process.env.S3_BUCKET_NAME);
   console.log("Region:", process.env.AWS_REGION);

    // Local development: keep resumes on disk instead of S3
    if (req.file && process.env.RESUME_STORAGE === "local") {
      const safeName = path.basename(req.file.originalname).replace(/[^\w.-]/g, "_");
      const fileName = `${Date.now()}-${safeName}`;
      await fs.mkdir(LOCAL_RESUME_DIR, { recursive: true });
      await fs.writeFile(path.join(LOCAL_RESUME_DIR, fileName), req.file.buffer);
      resumeUrl = `/uploads/resumes/${fileName}`;
    }
    // Upload Resume To S3
    else if (req.file) {
      const fileKey = `resumes/${Date.now()}-${req.file.originalname}`;

      await s3.send(
        new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: fileKey,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        })
      );

      resumeUrl = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${fileKey}`;
    }

    const [rows] = await db.execute(
      `INSERT INTO applications
      (name, email, ph_no, job_id, user_id, resume_url)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, phone, jobId, req.user.id, resumeUrl]
    );

    console.log("Application inserted:", rows);

    res.json({
      success: true,
      message: "Application submitted successfully",
      resumeUrl,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
export const postJob = async (req, res, next) => {
  try {
    const posted_by = req.user.id; // maps to users.user_id

    await redis.del(`dashboard:${posted_by}`);

    const {
      company,
      job_name,
      experience,
      job_type,
      description,
      role,
      min_salary,
      max_salary,
      required_skills,
    } = req.body;

    /* ─────────────────────────────
       Validate Required Fields
    ───────────────────────────── */
    if (
      !company ||
      !job_name ||
      experience === undefined ||
      !job_type ||
      !description ||
      !role ||
      !required_skills ||
      required_skills.length === 0
    ) {
      return next(new ExpressError("All required fields are required", 400));
    }

    /* ─────────────────────────────
       Validate Job Type
    ───────────────────────────── */
    const allowedJobTypes = ["Full-time", "Part-time", "Internship", "Contract"];

    if (!allowedJobTypes.includes(job_type)) {
      return next(new ExpressError("Invalid job type", 400));
    }

    /* ─────────────────────────────
       Validate Salary Range
    ───────────────────────────── */
    if (min_salary && max_salary && Number(min_salary) > Number(max_salary)) {
      return next(
        new ExpressError("Minimum salary cannot be greater than maximum salary", 400)
      );
    }

    /* ─────────────────────────────
       Parse Skills (array or string fallback)
    ───────────────────────────── */
    let skillsArray = [];

    if (Array.isArray(required_skills)) {

      skillsArray = required_skills
        .map((s) => s.trim())
        .filter((s) => s !== "");

    } else if (typeof required_skills === "string") {

      skillsArray = required_skills
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s !== "");
    }

    if (skillsArray.length === 0) {
      return next(new ExpressError("At least one required skill must be provided", 400));
    }

    /* ─────────────────────────────
       Insert Job Into jobs Table
       jobs PK → job_id
       jobs FK → posted_by references users.user_id
    ───────────────────────────── */
    const [result] = await db.execute(
      `INSERT INTO jobs
      (
        company,
        job_name,
        experience,
        job_type,
        description,
        role,
        posted_by,
        min_salary,
        max_salary
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        company,
        job_name,
        Number(experience),
        job_type,
        description,
        role,
        posted_by,
        min_salary || null,
        max_salary || null,
      ]
    );

    const job_id = result.insertId;

    console.log("Job created with ID:", job_id);

    /* ─────────────────────────────
       Insert Each Skill Into job_skills Table
       job_skills columns → skill_id, job_id, skill_name
       (from your schema: skill_name VARCHAR(50))
    ───────────────────────────── */
    for (const skill of skillsArray) {

      await db.execute(
        `INSERT INTO job_skills (job_id, skill_name) VALUES (?, ?)`,
        [job_id, skill]
      );
    }

    console.log(`${skillsArray.length} skills inserted for job ID: ${job_id}`);

    /* ─────────────────────────────
       Find Matched Students
       - users.user_id  (PK)
       - users.role = 'user'  ← your schema uses 'user' not 'student'
       - student_details.student_id → FK to users.user_id
       - student_skills.user_id    → FK to users.user_id
       - student_skills.skill      ← column is 'skill' not 'skill_name'
    ───────────────────────────── */
    const placeholders = skillsArray.map(() => "?").join(", ");

    const [matchedStudents] = await db.execute(
      `SELECT
          u.user_id                               AS student_id,
          u.email                                 AS email,
          sd.full_name                            AS full_name,
          COUNT(ss.skill)                         AS matched_skill_count
       FROM users u
       JOIN student_details sd ON sd.student_id = u.user_id
       JOIN student_skills   ss ON ss.user_id   = u.user_id
       WHERE
          u.role = 'user'
          AND LOWER(ss.skill) IN (${placeholders})
       GROUP BY u.user_id, u.email, sd.full_name
       ORDER BY matched_skill_count DESC`,
      skillsArray.map((s) => s.toLowerCase())

    );

    console.log("Matched Students Query Result:", matchedStudents);

    for(const student of matchedStudents){
      console.log(`Student ID: ${student.student_id}, Full Name: ${student.full_name}, Email: ${student.email}, Matched Skills: ${student.matched_skill_count}`);
       await SkillMatchingEmailQueue.add(
  "job-match-email",
  {
    to: student.email,
    subject: `🎯 New Job Match: ${job_name} at ${company}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Job Match</title>
      </head>
      <body style="margin:0; padding:0; background-color:#f4f7fb; font-family: Arial, sans-serif;">

        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fb; padding: 40px 0;">
          <tr>
            <td align="center">

              <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e2e8f0;">

                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #1976d2, #0f172a); padding: 36px 40px; text-align:center;">
                    <h1 style="margin:0; color:#ffffff; font-size:26px; font-weight:900; letter-spacing:1px;">
                      🎯 You're a Match!
                    </h1>
                    <p style="margin:10px 0 0; color:rgba(255,255,255,0.85); font-size:15px;">
                      A new job posting matches your skill set
                    </p>
                  </td>
                </tr>

                <!-- Greeting -->
                <tr>
                  <td style="padding: 32px 40px 0;">
                    <p style="margin:0; font-size:16px; color:#1e293b;">
                      Hi <strong>${student.full_name}</strong> 👋
                    </p>
                    <p style="margin:10px 0 0; font-size:15px; color:#475569; line-height:1.6;">
                      Great news! A recruiter just posted a job that aligns with your skills on <strong>InterviewOS</strong>. 
                      Check out the details below and apply before it's gone!
                    </p>
                  </td>
                </tr>

                <!-- Job Card -->
                <tr>
                  <td style="padding: 24px 40px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:24px;">
                      <tr>
                        <td style="padding: 0 0 16px;">
                          <h2 style="margin:0; font-size:20px; color:#1976d2;">${job_name}</h2>
                          <p style="margin:4px 0 0; font-size:14px; color:#64748b;">@ ${company}</p>
                        </td>
                      </tr>

                      <!-- Job Details Grid -->
                      <tr>
                        <td>
                          <table width="100%" cellpadding="0" cellspacing="8">

                            <tr>
                              <td width="50%" style="padding: 6px 0;">
                                <span style="font-size:12px; color:#94a3b8; display:block;">ROLE</span>
                                <span style="font-size:14px; color:#1e293b; font-weight:600;">${role}</span>
                              </td>
                              <td width="50%" style="padding: 6px 0;">
                                <span style="font-size:12px; color:#94a3b8; display:block;">JOB TYPE</span>
                                <span style="font-size:14px; color:#1e293b; font-weight:600;">${job_type}</span>
                              </td>
                            </tr>

                            <tr>
                              <td width="50%" style="padding: 6px 0;">
                                <span style="font-size:12px; color:#94a3b8; display:block;">EXPERIENCE</span>
                                <span style="font-size:14px; color:#1e293b; font-weight:600;">${experience} Year(s)</span>
                              </td>
                              <td width="50%" style="padding: 6px 0;">
                                <span style="font-size:12px; color:#94a3b8; display:block;">SALARY RANGE</span>
                                <span style="font-size:14px; color:#1e293b; font-weight:600;">
                                  ${
                                    min_salary && max_salary
                                      ? `₹${Number(min_salary).toLocaleString("en-IN")} – ₹${Number(max_salary).toLocaleString("en-IN")}`
                                      : min_salary
                                      ? `From ₹${Number(min_salary).toLocaleString("en-IN")}`
                                      : max_salary
                                      ? `Up to ₹${Number(max_salary).toLocaleString("en-IN")}`
                                      : "Not disclosed"
                                  }
                                </span>
                              </td>
                            </tr>

                          </table>
                        </td>
                      </tr>

                      <!-- Required Skills -->
                      <tr>
                        <td style="padding-top: 16px;">
                          <span style="font-size:12px; color:#94a3b8; display:block; margin-bottom:8px;">REQUIRED SKILLS</span>
                          <div>
                            ${skillsArray
                              .map(
                                (skill) => `
                              <span style="
                                display:inline-block;
                                background-color:#dbeafe;
                                color:#1976d2;
                                font-size:12px;
                                font-weight:600;
                                padding:4px 12px;
                                border-radius:999px;
                                margin:3px 4px 3px 0;
                              ">${skill}</span>`
                              )
                              .join("")}
                          </div>
                        </td>
                      </tr>

                      <!-- Matched Skills Count -->
                      <tr>
                        <td style="padding-top:14px;">
                          <p style="margin:0; font-size:13px; color:#16a34a; font-weight:600;">
                            ✅ You matched ${student.matched_skill_count} out of ${skillsArray.length} required skill(s)
                          </p>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>

                <!-- Description -->
                <tr>
                  <td style="padding: 0 40px 24px;">
                    <p style="margin:0 0 6px; font-size:12px; color:#94a3b8;">JOB DESCRIPTION</p>
                    <p style="margin:0; font-size:14px; color:#475569; line-height:1.7;">
                      ${description}
                    </p>
                  </td>
                </tr>

                 <!-- CTA Button -->
<tr>
  <td style="padding: 0 40px 36px; text-align:center;">

    <a
      href="${process.env.CLIENT_URL || "https://interviewos.online"}/job/apply/${job_id}"
      style="
        display:inline-block;
        background-color:#1976d2;
        color:#ffffff;
        font-size:15px;
        font-weight:700;
        text-decoration:none;
        padding:14px 36px;
        border-radius:8px;
        margin-top:8px;
      "
    >
      View & Apply Now →
    </a>

  </td>
</tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color:#f8fafc; border-top:1px solid #e2e8f0; padding:20px 40px; text-align:center;">
                    <p style="margin:0; font-size:12px; color:#94a3b8;">
                      You received this email because your skills matched a job on <strong>InterviewOS</strong>.<br/>
                      If you feel this is irrelevant, you can update your skills in your profile.
                    </p>
                  </td>
                </tr>

              </table>

            </td>
          </tr>
        </table>

      </body>
      </html>
    `,
  }
);
  }

    console.log(`${matchedStudents.length} matched students found`);

    /* ─────────────────────────────
       Success Response
    ───────────────────────────── */
    res.status(201).json({
      success: true,
      message: "Job posted successfully",
      job_id,
      skills_added: skillsArray,
      matched_students: matchedStudents.map((student) => ({
        student_id:          student.student_id,
        full_name:           student.full_name,
        email:               student.email,
        matched_skill_count: student.matched_skill_count,
      })),
      total_matched: matchedStudents.length,
    });

  } catch (err) {
    console.log("Post Job Error:", err);
    next(new ExpressError("Failed to post job", 500));
  }
};


export const myJobs = async (req, res, next) => {
  try {

    const posted_by = req.user.id; // comes from auth middleware

    /* ─────────────────────────────
       Fetch All Jobs Posted By This Recruiter
       Along With Their Skills
    ───────────────────────────── */
    const [jobs] = await db.execute(
      `SELECT
          j.job_id,
          j.company,
          j.job_name,
          j.experience,
          j.job_type,
          j.description,
          j.role,
          j.min_salary,
          j.max_salary,
          j.created_at,
          GROUP_CONCAT(js.skill_name ORDER BY js.skill_id SEPARATOR ',') AS skills
       FROM jobs j
       LEFT JOIN job_skills js ON js.job_id = j.job_id
       WHERE j.posted_by = ?
       GROUP BY
          j.job_id,
          j.company,
          j.job_name,
          j.experience,
          j.job_type,
          j.description,
          j.role,
          j.min_salary,
          j.max_salary,
          j.created_at
       ORDER BY j.created_at DESC`,
      [posted_by]
    );

    console.log(`${jobs.length} jobs found for recruiter ID: ${posted_by}`);

    /* ─────────────────────────────
       Convert Skills String → Array
       GROUP_CONCAT returns "React,Node.js,Python"
       We convert it to ["React", "Node.js", "Python"]
    ───────────────────────────── */
    const formattedJobs = jobs.map((job) => ({
      ...job,
      skills: job.skills
        ? job.skills.split(",").map((s) => s.trim())
        : [],
    }));

    /* ─────────────────────────────
       Success Response
    ───────────────────────────── */
    res.status(200).json({
      success: true,
      message: "Jobs fetched successfully",
      total: formattedJobs.length,
      jobs: formattedJobs,
    });

  } catch (err) {
    console.log("My Jobs Error:", err);
    next(new ExpressError("Failed to fetch jobs", 500));
  }
};

export const getJob = async (req, res, next) => {
  try {
    const { job_id } = req.params;

    const [jobs] = await db.execute(
      `SELECT
          j.job_id,
          j.company,
          j.job_name,
          j.experience,
          j.job_type,
          j.description,
          j.role,
          j.min_salary,
          j.max_salary,
          j.created_at
       FROM jobs j
       WHERE j.job_id = ? AND j.posted_by = ?`,
      [job_id, req.user.id]
    );

    if (jobs.length === 0) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    const [skills] = await db.execute(
      "SELECT skill_name FROM job_skills WHERE job_id = ? ORDER BY skill_id",
      [job_id]
    );

    return res.status(200).json({
      success: true,
      job: {
        ...jobs[0],
        required_skills: skills.map((s) => s.skill_name),
      },
    });
  } catch (err) {
    console.log("Get Job Error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch job" });
  }
};

export const deleteJob = async (req, res, next) => {
  try {
    const { job_id } = req.params;

    if (!job_id) {
      return next(new ExpressError(400, "Job ID is required"));
    }

    // Only the recruiter who posted the job may delete it
    const [result] = await db.execute(
      "DELETE FROM jobs WHERE job_id = ? AND posted_by = ?",
      [job_id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return next(new ExpressError(404, "Job not found"));
    }

    return res.status(200).json({
      success: true,
      message: "Job deleted successfully",
    });

  } catch (err) {
    return next(
      new ExpressError(
        500,
        `Failed to delete job: ${err.message}`
      )
    );
  }
};

export const editJob = async (req, res, next) => {
  try {
    const { job_id } = req.params;

    const {
      company,
      job_name,
      experience,
      job_type,
      description,
      role,
      min_salary,
      max_salary,
      required_skills,
    } = req.body;

    if (!job_id) {
      return next(new ExpressError(400, "Job ID is required"));
    }

    // Only the recruiter who posted the job may edit it
    const [job] = await db.execute(
      "SELECT job_id FROM jobs WHERE job_id = ? AND posted_by = ?",
      [job_id, req.user.id]
    );

    if (job.length === 0) {
      return next(new ExpressError(404, "Job not found"));
    }

    // Update job details
    const [result] = await db.execute(
      `
      UPDATE jobs
      SET
        company = ?,
        job_name = ?,
        experience = ?,
        job_type = ?,
        description = ?,
        role = ?,
        min_salary = ?,
        max_salary = ?
      WHERE job_id = ?
      `,
      [
        company,
        job_name,
        experience,
        job_type,
        description,
        role,
        min_salary,
        max_salary,
        job_id,
      ]
    );

    if (result.affectedRows === 0) {
      return next(new ExpressError(400, "Failed to update job"));
    }

    // Remove old skills
    await db.execute(
      "DELETE FROM job_skills WHERE job_id = ?",
      [job_id]
    );

    // Insert updated skills
    if (Array.isArray(required_skills) && required_skills.length > 0) {
      const values = required_skills.map((skill) => [
        job_id,
        skill.trim(),
      ]);

      await db.query(
        "INSERT INTO job_skills (job_id, skill_name) VALUES ?",
        [values]
      );
    }

    return res.status(200).json({
      success: true,
      message: "Job updated successfully",
    });

  } catch (err) {
    return next(
      new ExpressError(
        500,
        `Failed to update job: ${err.message}`
      )
    );
  }
};

export const filterJobs = async (req, res, next) => {
  try {
    const {
      skills,
      job_type,
      experience,
      salary,
      page = 1,
      limit = 5,
    } = req.query;

    console.log("filterJobs query:", req.query);

    const conditions = [];
    const buildParams = [];  // ← build once, spread into both queries

    /* ── Skills ── */
    if (skills) {
      const skillList = skills.split(",").map((s) => s.trim()).filter(Boolean);
      if (skillList.length > 0) {
        const placeholders = skillList.map(() => "?").join(", ");
        conditions.push(`
          j.job_id IN (
            SELECT job_id FROM job_skills
            WHERE LOWER(skill_name) IN (${placeholders})
            GROUP BY job_id
            HAVING COUNT(DISTINCT LOWER(skill_name)) = ?
          )
        `);
        buildParams.push(...skillList.map((s) => s.toLowerCase()), skillList.length);
      }
    }

    /* ── Job Type ── */
    if (job_type) {
      const typeList = job_type.split(",").map((t) => t.trim()).filter(Boolean);
      if (typeList.length > 0) {
        const placeholders = typeList.map(() => "?").join(", ");
        conditions.push(`j.job_type IN (${placeholders})`);
        buildParams.push(...typeList);
      }
    }

    /* ── Experience ── */
    if (experience) {
      const expMap = {
        "Fresher":  { min: 0, max: 0 },
        "1 Year":   { min: 1, max: 1 },
        "2 Years":  { min: 2, max: 2 },
        "3+ Years": { min: 3, max: 4 },
        "5+ Years": { min: 5, max: 99 },
      };
      const range = expMap[experience.trim()];
      if (range) {
        conditions.push(`j.experience BETWEEN ? AND ?`);
        buildParams.push(range.min, range.max);
      }
    }

    /* ── Salary ── */
    if (salary) {
      const salaryMap = {
        "0–3 LPA":   { min: 0,       max: 300000    },
        "3–6 LPA":   { min: 300000,  max: 600000    },
        "6–10 LPA":  { min: 600000,  max: 1000000   },
        "10–20 LPA": { min: 1000000, max: 2000000   },
        "20+ LPA":   { min: 2000000, max: 999999999 },
      };
      const range = salaryMap[salary.trim()];
      if (range) {
        conditions.push(`
          (
            (j.min_salary IS NOT NULL AND j.max_salary IS NOT NULL
              AND j.min_salary <= ? AND j.max_salary >= ?)
            OR
            (j.min_salary IS NOT NULL AND j.max_salary IS NULL
              AND j.min_salary <= ?)
            OR
            (j.max_salary IS NOT NULL AND j.min_salary IS NULL
              AND j.max_salary >= ?)
          )
        `);
        buildParams.push(range.max, range.min, range.max, range.min);
      }
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    /* ── Pagination ── */
    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const offset   = (pageNum - 1) * limitNum;

    console.log("whereClause:", whereClause);
    console.log("buildParams:", buildParams);

    /* ── Count — fresh spread so original untouched ── */
    const [countResult] = await db.execute(
      `SELECT COUNT(DISTINCT j.job_id) AS total FROM jobs j ${whereClause}`,
      [...buildParams]   // ← fresh copy
    );
    const total      = countResult[0].total;
    const totalPages = Math.ceil(total / limitNum);

    /* ── Main Query — fresh spread + pagination params ── */
    const [jobs] = await db.execute(
      `
      SELECT
        j.job_id,
        j.company,
        j.job_name,
        j.experience,
        j.job_type,
        j.description,
        j.role,
        j.min_salary,
        j.max_salary,
        j.created_at,
        GROUP_CONCAT(DISTINCT js.skill_name ORDER BY js.skill_name SEPARATOR ', ') AS skills
      FROM jobs j
      LEFT JOIN job_skills js ON js.job_id = j.job_id
      ${whereClause}
      GROUP BY
        j.job_id, j.company, j.job_name, j.experience,
        j.job_type, j.description, j.role,
        j.min_salary, j.max_salary, j.created_at
      ORDER BY j.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [...buildParams, limitNum, offset]   // ← fresh copy + pagination
    );

    const shaped = jobs.map((job) => ({
      ...job,
      skills: job.skills ? job.skills.split(", ") : [],
    }));

    console.log(`filterJobs: found ${shaped.length} jobs`);

    return res.status(200).json({
      success: true,
      total,
      totalPages,
      page: pageNum,
      jobs: shaped,
    });

  } catch (err) {
    console.log("filterJobs ERROR:", err.message);
    return next(new ExpressError(500, `Failed to fetch jobs: ${err.message}`));
  }
};