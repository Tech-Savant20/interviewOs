-- InterviewOS database schema (MySQL 8)
-- Load with: mysql -u root -p interviewos < db/schema.sql
-- (docker compose loads it automatically on first start)

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  user_id       INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password      VARCHAR(255) NOT NULL,
  role          ENUM('user', 'interviewer') NOT NULL DEFAULT 'user',
  verify        BOOLEAN NOT NULL DEFAULT FALSE,
  profileExist  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_details (
  student_details_id     INT AUTO_INCREMENT PRIMARY KEY,
  student_id             INT NOT NULL UNIQUE,
  full_name              VARCHAR(100) NOT NULL,
  phone_number           VARCHAR(20)  NOT NULL,
  degree_branch          VARCHAR(150) NOT NULL,
  email_address          VARCHAR(255) NOT NULL,
  college_university     VARCHAR(200) NOT NULL,
  graduation_year        INT NOT NULL,
  cgpa                   VARCHAR(20) NOT NULL,
  skills                 TEXT,
  linkedin_profile       VARCHAR(255),
  resume_link_portfolio  VARCHAR(255),
  FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS student_skills (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  user_id  INT NOT NULL,
  skill    VARCHAR(50) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_student_skills_skill (skill)
);

CREATE TABLE IF NOT EXISTS interviewer_details (
  interviewer_details_id  INT AUTO_INCREMENT PRIMARY KEY,
  interviewer_id          INT NOT NULL UNIQUE,
  full_name               VARCHAR(100) NOT NULL,
  phone_number            VARCHAR(20)  NOT NULL,
  designation             VARCHAR(100) NOT NULL,
  domain_expertise        VARCHAR(150) NOT NULL,
  work_email              VARCHAR(255) NOT NULL,
  company_name            VARCHAR(150) NOT NULL,
  years_of_experience     INT NOT NULL DEFAULT 0,
  hiring_for_roles        VARCHAR(255) NOT NULL,
  linkedin_profile        VARCHAR(255),
  company_website         VARCHAR(255),
  FOREIGN KEY (interviewer_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS jobs (
  job_id       INT AUTO_INCREMENT PRIMARY KEY,
  company      VARCHAR(150) NOT NULL,
  job_name     VARCHAR(150) NOT NULL,
  experience   INT NOT NULL DEFAULT 0,
  job_type     ENUM('Full-time', 'Part-time', 'Internship', 'Contract') NOT NULL,
  description  TEXT NOT NULL,
  role         VARCHAR(150) NOT NULL,
  posted_by    INT NOT NULL,
  min_salary   INT,
  max_salary   INT,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (posted_by) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_jobs_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS job_skills (
  skill_id    INT AUTO_INCREMENT PRIMARY KEY,
  job_id      INT NOT NULL,
  skill_name  VARCHAR(50) NOT NULL,
  FOREIGN KEY (job_id) REFERENCES jobs(job_id) ON DELETE CASCADE,
  INDEX idx_job_skills_name (skill_name)
);

CREATE TABLE IF NOT EXISTS applications (
  app_id      INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(255) NOT NULL,
  ph_no       VARCHAR(20)  NOT NULL,
  job_id      INT NOT NULL,
  user_id     INT NOT NULL,
  resume_url  VARCHAR(500),
  status      ENUM('applied', 'shortlisted', 'rejected', 'selected') NOT NULL DEFAULT 'applied',
  applied_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id)  REFERENCES jobs(job_id)   ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS interviews (
  interview_id    INT AUTO_INCREMENT PRIMARY KEY,
  app_id          INT NOT NULL,
  student_id      INT NOT NULL,
  interviewer_id  INT NOT NULL,
  scheduled_at    DATETIME NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'scheduled',
  meeting_link    VARCHAR(255),
  FOREIGN KEY (app_id)         REFERENCES applications(app_id) ON DELETE CASCADE,
  FOREIGN KEY (student_id)     REFERENCES users(user_id)       ON DELETE CASCADE,
  FOREIGN KEY (interviewer_id) REFERENCES users(user_id)       ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
  mess_id      INT AUTO_INCREMENT PRIMARY KEY,
  sender_id    INT NOT NULL,
  receiver_id  INT NOT NULL,
  message      TEXT NOT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id)   REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(user_id) ON DELETE CASCADE
);
