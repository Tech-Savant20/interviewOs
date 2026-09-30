-- Run once on a database created before the job-targeted AI prep feature:
--   mysql -h <host> -u <user> -p <database> < db/migrations/001_mock_interviews.sql
-- (New databases get this table from schema.sql.)

CREATE TABLE IF NOT EXISTS mock_interviews (
  mock_id     INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  job_id      INT NULL,
  topic       VARCHAR(100),
  level       VARCHAR(20),
  question    TEXT NOT NULL,
  answer      TEXT NOT NULL,
  score       TINYINT NOT NULL,
  feedback    TEXT,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (job_id)  REFERENCES jobs(job_id)   ON DELETE SET NULL,
  INDEX idx_mock_user_job (user_id, job_id)
);
