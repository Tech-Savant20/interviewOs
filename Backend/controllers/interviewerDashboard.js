import db from "../config/db.js";
import ExpressError from "../ExpressError.js";
import SendEmail from "../utils/SendEmail.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { io } from "../app.js";
import s3 from "../utils/S3.js";
import redis from "../Redis.js";

import {v4 as uuidv4} from "uuid";


export const getDashboard = async (req, res, next) => {
  try {
    const posted_by = req.user.id;

    const cacheKey = `dashboard:${posted_by}`;

    // ---------------------------
    // 1. Check Redis Cache
    // ---------------------------
    const cachedDashboard = await redis.get(cacheKey);

    if (cachedDashboard) {
      console.log("Dashboard Cache Hit");

      return res.status(200).json(JSON.parse(cachedDashboard));
    }

    console.log("Dashboard Cache Miss");

    // ---------------------------
    // 2. Run Queries In Parallel
    // ---------------------------
    const [
      [[{ total_jobs }]],
      [[stats]],
      [recent_jobs],
      [recent_applicants],
    ] = await Promise.all([
      db.execute(
        `
        SELECT COUNT(*) AS total_jobs
        FROM jobs
        WHERE posted_by = ?
        `,
        [posted_by]
      ),

      db.execute(
        `
        SELECT
          COUNT(*) AS total_applicants,

          SUM(
            CASE
              WHEN a.status = 'shortlisted'
              THEN 1
              ELSE 0
            END
          ) AS shortlisted,

          SUM(
            CASE
              WHEN a.status = 'rejected'
              THEN 1
              ELSE 0
            END
          ) AS rejected

        FROM applications a
        JOIN jobs j
          ON a.job_id = j.job_id

        WHERE j.posted_by = ?
        `,
        [posted_by]
      ),

      db.execute(
        `
        SELECT
          job_id,
          job_name,
          company,
          job_type,
          created_at
        FROM jobs
        WHERE posted_by = ?
        ORDER BY created_at DESC
        LIMIT 5
        `,
        [posted_by]
      ),

      db.execute(
        `
        SELECT
          a.app_id,
          a.name,
          a.status,
          a.applied_at,
          j.job_name
        FROM applications a
        JOIN jobs j
          ON a.job_id = j.job_id
        WHERE j.posted_by = ?
        ORDER BY a.applied_at DESC
        LIMIT 5
        `,
        [posted_by]
      ),
    ]);

    const responseData = {
      success: true,
      stats: {
        total_jobs,
        total_applicants: stats.total_applicants || 0,
        shortlisted: stats.shortlisted || 0,
        rejected: stats.rejected || 0,
      },
      recent_jobs,
      recent_applicants,
    };

    // ---------------------------
    // 3. Cache Dashboard
    // ---------------------------
    await redis.set(
     cacheKey,
     JSON.stringify(responseData),
     "EX",
    300
    );

    return res.status(200).json(responseData);

  } catch (err) {
    console.error("Dashboard Error:", err);
    next(new expressError("Failed to load dashboard", 500));
  }
};

export const scheduleInterview = async (req, res, next) => {
  console.log(
    "Schedule Interview API hit with body:",
    req.body
  );

  try {
    const {
      application_id,
      interview_date,
      student_id,
    } = req.body;

    // logged in interviewer
    const interviewer_id = req.user.id;

    const meeting_link=`${process.env.CLIENT_URL || "https://interviewos.online"}/call/${uuidv4()}`
    
    // validation
    if (
      !application_id ||
      !interview_date ||
      !student_id
    ) {
      return next(
        new ExpressError(
          "Application ID, student ID and interview date are required",
          400
        )
      );
    }

    // check application + fetch details
    const [applicationRows] = await db.execute(
      `SELECT 
          a.app_id,
          a.name,
          a.email,
          a.user_id,

          j.job_name,
          j.company,

          u.username AS interviewer_name

       FROM applications a

       JOIN jobs j
          ON a.job_id = j.job_id

       LEFT JOIN users u
          ON u.user_id = ?

       WHERE a.app_id = ?`,
      [interviewer_id, application_id]
    );

    // application not found
    if (applicationRows.length === 0) {
      return next(
        new ExpressError(
          "Application not found",
          404
        )
      );
    }

    const applicant = applicationRows[0];

    // formatted interview date
    const formattedDate =
      new Date(interview_date).toLocaleString(
        "en-IN",
        {
          dateStyle: "full",
          timeStyle: "short",
        }
      );

    // =========================
    // SEND EMAIL FIRST
    // =========================

    await SendEmail({
      to: applicant.email,

      subject: `Interview Scheduled - ${applicant.job_name}`,

      html: `
        <div style="
          max-width:600px;
          margin:auto;
          font-family:Arial,sans-serif;
          background:#ffffff;
          border-radius:12px;
          overflow:hidden;
          border:1px solid #e5e7eb;
        ">

          <div style="
            background:linear-gradient(135deg,#2563eb,#0f172a);
            padding:30px;
            text-align:center;
            color:white;
          ">
            <h1 style="margin:0;">
              Interview Scheduled
            </h1>

            <p style="
              margin-top:10px;
              opacity:0.9;
            ">
              InterviewOS Hiring Team
            </p>
          </div>

          <div style="padding:30px;">

            <h2 style="
              color:#111827;
              margin-bottom:20px;
            ">
              Hello ${applicant.name},
            </h2>

            <p style="
              color:#374151;
              font-size:15px;
              line-height:1.7;
            ">
              Your interview has been successfully scheduled.
            </p>

            <div style="
              margin-top:25px;
              background:#f8fafc;
              border-radius:10px;
              padding:20px;
              border:1px solid #e2e8f0;
            ">

              <p>
                <strong>Company:</strong>
                ${applicant.company}
              </p>

              <p>
                <strong>Role:</strong>
                ${applicant.job_name}
              </p>

              <p>
                <strong>Interviewer:</strong>
                ${applicant.interviewer_name}
              </p>

              <p>
                <strong>Interview Date:</strong>
                ${formattedDate}
              </p>

            </div>

            <p style="
              margin-top:25px;
              color:#374151;
              line-height:1.7;
            ">
              Please join the interview on time and
              ensure your internet connection and
              microphone are working properly.
              and Interview link will be shared on Interview Time.
            </p>

            <div style="
              margin-top:30px;
              padding-top:20px;
              border-top:1px solid #e5e7eb;
              color:#6b7280;
              font-size:14px;
            ">
              Best Regards,
              <br/>
              <strong>
                InterviewOS Team
              </strong>
            </div>

          </div>
        </div>
      `,
    });

    // =========================
    // INSERT INTERVIEW
    // =========================

    const [result] = await db.execute(
      `INSERT INTO interviews
        (
          app_id,
          student_id,
          interviewer_id,
          scheduled_at,
          status,
          meeting_link
        )

       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        application_id,
        student_id,
        interviewer_id,
        interview_date,
        "scheduled",
        meeting_link || null,
      ]
    );

    // =========================
    // UPDATE APPLICATION STATUS
    // =========================

    await db.execute(
      `UPDATE applications
       SET status = ?
       WHERE app_id = ?`,
      ["shortlisted", application_id]
    );

    // =========================
    // SOCKET MESSAGE FORMAT
    // =========================

    

    
    io.to(String(student_id)).emit(
  "receive_message",
  {
    senderId: interviewer_id,

    receiverId: String(student_id),

    text: `
Interview Scheduled

Company: ${applicant.company}
Role: ${applicant.job_name}
Date: ${formattedDate}
meeting link: ${meeting_link};
    `,

    type: "INTERVIEW_SCHEDULED",

    interview: {
      interview_id: result.insertId,

      application_id,

      interview_date,

      meeting_link,

      status: "scheduled",
    },

    timestamp: new Date().toISOString(),
  }
);

    // =========================
    // RESPONSE
    // =========================

    res.status(201).json({
      success: true,

      message:
        "Interview scheduled successfully",

      interview: {
        interview_id: result.insertId,

        application_id,

        student_id,

        interviewer_id,

        interview_date,

        status: "scheduled",

        meeting_link,
      },

    });

  } catch (err) {
    console.log(
      "Schedule Interview Error:",
      err
    );

    next(
      new ExpressError(
        "Failed to schedule interview",
        500
      )
    );
  }
};

export const getScheduledInterviews = async (req,res,next)=>{
  console.log("Get Scheduled Interviews API hit for interviewer ID:", req.user.id);
  try{
    const interviewer_id = req.user.id;

    const [interviews] = await db.execute(
  `SELECT
      i.interview_id,
      i.scheduled_at,
      i.status,
      i.meeting_link,

      a.app_id,
      a.user_id AS student_id,

      sd.full_name AS student_name,

      j.job_name,
      j.company

   FROM interviews i

   JOIN applications a
      ON i.app_id = a.app_id

   JOIN student_details sd
      ON a.user_id = sd.student_id

   JOIN jobs j
      ON a.job_id = j.job_id

   WHERE i.interviewer_id = ?

   ORDER BY i.scheduled_at DESC`,
  [interviewer_id]
);

    res.status(200).json({
      success: true,
      interviews,
    });

  }catch(err){
    console.log("Get Scheduled Interviews Error:", err);
    next(new ExpressError("Failed to fetch scheduled interviews", 500));
  }
}

export const getResumeUrl = async (req, res) => {

  console.log("Resume API hit ")
  const { applicationId } = req.params;

  console.log("Fetching resume for application ID:", applicationId);

  const [rows] = await db.execute(
    "SELECT resume_url FROM applications WHERE app_id = ?",
    [applicationId]
  );

  console.log("Retrieved resume URL:", rows[0]?.resume_url);

  if (!rows.length || !rows[0].resume_url) {
    return res.status(404).json({
      success: false,
      message: "Resume not found",
    });
  }

  const resumeUrl = rows[0].resume_url;

  // Resumes stored locally (RESUME_STORAGE=local) are served directly
  if (!resumeUrl.includes(".amazonaws.com/")) {
    return res.json({ success: true, url: resumeUrl });
  }

  const key = resumeUrl.split(".amazonaws.com/")[1];

  const command = new GetObjectCommand({
    Bucket: "interviewos-resumes-915116533522",
    Key: key,
  });

  const signedUrl = await getSignedUrl(
    s3,
    command,
    { expiresIn: 300 }
  );

  console.log("Generated signed URL:", signedUrl);

  res.json({
    success: true,
    url: signedUrl,
  });
};

export const getMeetingUrl = async (req, res, next) => {
  try {
    const { student_id } = req.body;

    const [rows] = await db.execute(
      "SELECT meeting_link FROM interviews WHERE student_id = ?",
      [student_id]
    );

    console.log("Result in Get Meeting URL:", rows);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Meeting link not found",
      });
    }

    res.json({
      success: true,
      url: rows[0].meeting_link,
    });

  } catch (err) {
    next(new ExpressError("Failed to fetch Meeting URL", 500));
  }
};