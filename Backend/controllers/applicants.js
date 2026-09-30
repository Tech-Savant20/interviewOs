import db from "../config/db.js";
import ExpressError from "../ExpressError.js";


import SendEmail from "../utils/SendEmail.js";

export const applicants = async (req, res, next) => {
  try {
    console.log("applicant api hit")
    // 🔥 DB query (must use await)
     const [applications] = await db.execute(
  `SELECT 
      a.app_id,
      a.status,
      a.applied_at,
      u.user_id,
      u.username,
      u.email,
      j.job_id,
      j.job_name,
      j.company
   FROM applications a
   JOIN users u ON a.user_id = u.user_id
   JOIN jobs j ON a.job_id = j.job_id
   WHERE j.posted_by = ?`,
  [req.user.id] // interviewer ID
   );

   if (applications.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }

    
    // ✅ Send response
    return res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });

  } catch (err) {
    console.error(err);

    // ❌ Error response
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const getInterviewerInboxUsers = async(req,res,next)=>{
  console.log("getInterviewerInboxUsers API hit for user ID:", req.user.id);
  try{
    const userId = req.user.id;

    const [rows] = await db.execute(
      `
      SELECT DISTINCT 
        u.user_id,
        u.username,
        u.email
      FROM messages m
      JOIN users u ON (m.sender_id = u.user_id OR m.receiver_id = u.user_id)
      WHERE (m.sender_id = ? OR m.receiver_id = ?) AND u.user_id != ?
      `,
      [userId, userId, userId]
    );

    res.status(200).json({
      success: true,
      users: rows,
    });

    

    console.log("Inbox users fetched:", rows);

  }catch(err){
    return next(new ExpressError("Failed to fetch inbox users", 500));
  }
}




export const MyApplications = async (req, res, next) => {
  console.log("My application api hit");

  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const userId = req.user.id;
    console.log("userId in MyApplications:", userId);

    const [rows] = await db.execute(
  `
  SELECT 
    a.app_id AS id,
    a.name,
    a.email,
    a.ph_no AS phone,
    a.applied_at AS date,
    a.status,

    j.job_name AS jobTitle,
    j.company AS company,
    j.job_type AS jobType,
    j.experience,
    j.min_salary AS minSalary,
    j.max_salary AS maxSalary,

    u.username AS applicantName

  FROM applications a
  JOIN jobs j ON a.job_id = j.job_id
  JOIN users u ON a.user_id = u.user_id

  WHERE a.user_id = ?
  ORDER BY a.applied_at DESC
  `,
  [userId]
);

    res.status(200).json({
      success: true,
      applications: rows,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getStudentInboxUsers = async(req,res,next)=>{
  console.log("getStudentInboxUsers API hit for user ID:", req.user.id);

  try{

    const userId = req.user.id;

    
     const [rows] = await db.execute(
       `
     SELECT DISTINCT 
      u.user_id,
      u.username,
      u.email
     FROM messages m
     JOIN users u 
      ON u.user_id = CASE 
      WHEN m.sender_id = ? THEN m.receiver_id
      ELSE m.sender_id
      END
      WHERE m.sender_id = ? OR m.receiver_id = ?
      `,
     [userId, userId, userId]
     );


    res.status(200).json({
      success: true,
      users: rows,
    });
  }catch(err){
    next(new ExpressError("Failed to fetch inbox users", 500));
  }
}


export const applicantFullDetail = async(req,res,next)=>{
  try{

    const{applicantId} = req.params;
    if(!applicantId){
      return next(new ExpressError("Applicant ID is required",400));
    }

    const [rows] = await db.execute(
  `SELECT 
      sd.student_details_id,
      sd.student_id,
      sd.full_name,
      sd.phone_number,
      sd.degree_branch,
      sd.email_address,
      sd.college_university,
      sd.graduation_year,
      sd.cgpa,
      sd.skills,
      sd.linkedin_profile,
      sd.resume_link_portfolio,

      a.app_id,
      a.status AS application_status,
      a.applied_at,
      a.resume_url,

      j.job_id,
      j.company,
      j.job_name,
      j.experience,
      j.job_type,
      j.description,
      j.role,
      j.min_salary,
      j.max_salary

   FROM student_details sd

   LEFT JOIN applications a
      ON sd.student_id = a.user_id

   LEFT JOIN jobs j
      ON a.job_id = j.job_id

   WHERE sd.student_id = ?`,
  [applicantId]
);

    console.log("Applicant full detail fetched for applicant ID:", applicantId, "Result:", rows);

    if (rows.length === 0) {
      return next(new ExpressError("Applicant not found", 404));
    }

    res.status(200).json({
      success: true,
      data: rows[0],
    });

  }catch(err){
    next(new ExpressError("Failed to fetch applicant Detail",500))
  }
}

export const profileExist = async(req,res,next)=>{
  try{
    const userId = req.user.id;

    console.log("Profile exist API hit for user ID:", userId);

    const [existing] = await db.execute("SELECT * FROM student_details WHERE student_id = ?", [userId]);

    console.log("Profile exist check for user ID:", userId, "Result:", existing);

    if(existing.length > 0){
      return res.status(200).json({ success: true, message: "Profile exists" });
    }else{
      return res.status(200).json({ success: false, message: "Profile does not exist" });
    }

    if(!userId){
      return next(new ExpressError("Please login before Appliying",))
    }

  }catch(err){
    next(new ExpressError("Failed to check Profile",500))
  }
}



export const StudentProfileSetup = async (req, res, next) => {

  console.log("Student setup profile API hit");

  try {

    const student_id = req.user.id;
    const { fullName, phone, degree, email, college, graduationYear, cgpa, skills, linkedin, resume } = req.body;

    console.log("Skills received in backend:", skills);
    console.log("Student ID in backend:", student_id);

    /* ─────────────────────────────
       Validate Required Fields
    ───────────────────────────── */
    if (!fullName || !phone || !degree || !email || !college || !graduationYear || !cgpa || !skills) {
      return next(new ExpressError("All required fields are required", 400));
    }

    /* ─────────────────────────────
       Check If Profile Already Exists
    ───────────────────────────── */
    const [existingProfile] = await db.execute(
      "SELECT student_details_id FROM student_details WHERE student_id = ?",
      [student_id]
    );

    if (existingProfile.length > 0) {
      return next(new ExpressError("Student profile already exists", 409));
    }

    /* ─────────────────────────────
       Insert Into student_details
    ───────────────────────────── */
    const [result] = await db.execute(
      `INSERT INTO student_details 
      (
        student_id,
        full_name,
        phone_number,
        degree_branch,
        email_address,
        college_university,
        graduation_year,
        cgpa,
        skills,
        linkedin_profile,
        resume_link_portfolio
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`,
      [
        student_id,
        fullName,
        phone,
        degree,
        email,
        college,
        graduationYear,
        cgpa,
        skills,
        linkedin || null,
        resume || null,
      ]
    );

    console.log("Student profile created with ID:", result.insertId);

    /* ─────────────────────────────
       Parse Skills & Insert Each One Separately
    ───────────────────────────── */

    // Skills can arrive as array (from frontend) or string (fallback)
    let skillsArray = [];

    if (Array.isArray(skills)) {

      skillsArray = skills
        .map((skill) => skill.trim())
        .filter((skill) => skill !== "");

    } else if (typeof skills === "string") {

      skillsArray = skills
        .split(",")
        .map((skill) => skill.trim())
        .filter((skill) => skill !== "");

    }

    console.log("Parsed skills array:", skillsArray);

    if (skillsArray.length === 0) {
      return next(new ExpressError("At least one skill is required", 400));
    }

    /* ─────────────────────────────
       Insert Each Skill Separately With user_id
    ───────────────────────────── */
    for (const skill of skillsArray) {

      await db.execute(
        `INSERT INTO student_skills (user_id, skill) VALUES (?, ?)`,
        [student_id, skill]
      );

    }

    console.log(`${skillsArray.length} skills inserted for student ID: ${student_id}`);


    if(result.insertId){
      await db.execute(
        `UPDATE users SET profileExist = ? WHERE user_id = ?`,
        [true, student_id]
      );
    }
    /* ─────────────────────────────
       Success Response
    ───────────────────────────── */
    res.status(201).json({
      success: true,
      message: "Student profile setup successfully",
      student_details_id: result.insertId,
      skills_added: skillsArray,
    });

  } catch (err) {

    console.log("Profile Setup Error:", err);
    next(new ExpressError("Failed to setup profile", 500));

  }
};



export const InterviewerProfileSetup = async (req, res, next) => {
  try {
    const interviewer_id = req.user.id;

    console.log(req.body)

    const {
      fullName,
      phone,
      designation,
      domain,
      email,
      company,
      experience,
      hiringFor,
      linkedin,
      website,
    } = req.body;

    // ✅ Validation
    if (
      !fullName ||
      !phone ||
      !designation ||
      !domain ||
      !email ||
      !company ||
      experience === undefined ||
      !hiringFor
    ) {
      return next(
        new ExpressError("All required fields are required", 400)
      );
    }

    // ✅ Check existing profile
    const [existingProfile] = await db.execute(
      `SELECT interviewer_details_id 
       FROM interviewer_details 
       WHERE interviewer_id = ?`,
      [interviewer_id]
    );

    if (existingProfile.length > 0) {
      return next(
        new ExpressError("Interviewer profile already exists", 409)
      );
    }

    // ✅ Insert profile
    const [result] = await db.execute(
      `INSERT INTO interviewer_details
      (
        interviewer_id,
        full_name,
        phone_number,
        designation,
        domain_expertise,
        work_email,
        company_name,
        years_of_experience,
        hiring_for_roles,
        linkedin_profile,
        company_website
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        interviewer_id,
        fullName,
        phone,
        designation,
        domain,
        email,
        company,
        experience,
        hiringFor,
        linkedin || null,
        website || null,
      ]
    );

    if(result.insertId){
      await db.execute(
        `UPDATE users SET profileExist = ? WHERE user_id = ?`,
        [true, interviewer_id]
      );
    }

    res.status(201).json({
      success: true,
      message: "Interviewer profile setup successfully",
      interviewer_details_id: result.insertId,
    });

  } catch (err) {
    console.log(err);

    next(new ExpressError("Failed to setup profile", 500));
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const user_id = req.user.id;

    /* ── Fetch Student Details ── */
    const [profileRows] = await db.execute(
      `SELECT
          sd.full_name,
          sd.phone_number,
          sd.degree_branch,
          sd.email_address,
          sd.college_university,
          sd.graduation_year,
          sd.cgpa,
          sd.linkedin_profile,
          sd.resume_link_portfolio
       FROM student_details sd
       WHERE sd.student_id = ?`,
      [user_id]
    );

    if (profileRows.length === 0) {
      return next(new ExpressError("Profile not found", 404));
    }

    /* ── Fetch Skills Separately ── */
    const [skillRows] = await db.execute(
      `SELECT skill FROM student_skills WHERE user_id = ?`,
      [user_id]
    );

    const skills = skillRows.map((row) => row.skill);

    res.status(200).json({
      success: true,
      profile: profileRows[0],
      skills,
    });

  } catch (err) {
    console.log("Get Profile Error:", err);
    next(new ExpressError("Failed to fetch profile", 500));
  }
};

export const updateSelectionStatus = async (req, res, next) => {
  try {
    console.log("Update selection status API hit with body:", req.body);

    const { application_id, status } = req.body;

    if (!application_id || !status) {
      return next(
        new ExpressError(
          "Application ID and status are required",
          400
        )
      );
    }

    const validStatus = [
      "applied",
      "shortlisted",
      "rejected",
      "selected",
    ];

    if (!validStatus.includes(status)) {
      return next(
        new ExpressError("Invalid status value", 400)
      );
    }

    // get applicant + job details
    const [applicationRows] = await db.execute(
      `SELECT 
          a.name,
          a.email,
          j.job_name,
          j.company
       FROM applications a
       JOIN jobs j
          ON a.job_id = j.job_id
       WHERE a.app_id = ? AND j.posted_by = ?`,
      [application_id, req.user.id]
    );

    if (applicationRows.length === 0) {
      return next(
        new ExpressError("Application not found", 404)
      );
    }

    const applicant = applicationRows[0];
    console.log("Applicant details for status update:", applicant);

    // update status
    await db.execute(
      `UPDATE applications
       SET status = ?
       WHERE app_id = ?`,
      [status, application_id]
    );

    // email subject
    let subject = "";

    // email html
    let html = "";

    if (status === "shortlisted") {
      subject = "Application Shortlisted";

      html = `
        <h2>Hello ${applicant.name},</h2>

        <p>
          Congratulations! You have been shortlisted for the role of
          <b>${applicant.job_name}</b>
          at <b>${applicant.company}</b>.
        </p>

        <p>
          Our team will contact you soon regarding the next steps.
        </p>

        <br/>

        <p>InterviewOS Team</p>
      `;
    }

    else if (status === "selected") {
      subject = "Application Selected";

      html = `
        <h2>Hello ${applicant.name},</h2>

        <p>
          Congratulations! You have been selected for the role of
          <b>${applicant.job_name}</b>
          at <b>${applicant.company}</b>.
        </p>

        <p>
          We are excited to have you onboard.
        </p>

        <br/>

        <p>InterviewOS Team</p>
      `;
    }

    else if (status === "rejected") {
      subject = "Application Update";

      html = `
        <h2>Hello ${applicant.name},</h2>

        <p>
          Thank you for applying for
          <b>${applicant.job_name}</b>
          at <b>${applicant.company}</b>.
        </p>

        <p>
          After careful review, we regret to inform you that
          you were not selected for this role.
        </p>

        <p>
          We encourage you to apply again in the future.
        </p>

        <br/>

        <p>InterviewOS Team</p>
      `;
    }

    // send email
    await SendEmail({
      to: applicant.email,
      subject,
      html,
    });

    res.status(200).json({
      success: true,
      message: "Selection status updated successfully",
    });

  } catch (err) {
    console.log("Update Selection Status Error:", err);

    next(
      new ExpressError(
        "Failed to update selection status",
        500
      )
    );
  }
};

