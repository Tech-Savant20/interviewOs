-- Demo data for local development. Both accounts use the password: password123
--   demo_interviewer  (role: interviewer)
--   demo_student      (role: user)

SET NAMES utf8mb4;

INSERT INTO users (user_id, username, email, password, role, verify, profileExist) VALUES
  (1, 'demo_interviewer', 'interviewer@demo.local', '$2b$10$hceeDST5CBAV.yy/.JtJqOqTjf69lB6lx7p4J8VM2b6w7N3BQOOV6', 'interviewer', TRUE, TRUE),
  (2, 'demo_student',     'student@demo.local',     '$2b$10$hceeDST5CBAV.yy/.JtJqOqTjf69lB6lx7p4J8VM2b6w7N3BQOOV6', 'user',        TRUE, TRUE);

INSERT INTO interviewer_details
  (interviewer_id, full_name, phone_number, designation, domain_expertise, work_email,
   company_name, years_of_experience, hiring_for_roles, linkedin_profile, company_website)
VALUES
  (1, 'Priya Sharma', '+91 98765 43210', 'Senior Software Engineer', 'Backend', 'interviewer@demo.local',
   'TechNova Labs', 8, 'SDE-1, SDE Intern', NULL, 'technova.example.com');

INSERT INTO student_details
  (student_id, full_name, phone_number, degree_branch, email_address, college_university,
   graduation_year, cgpa, skills, linkedin_profile, resume_link_portfolio)
VALUES
  (2, 'Aarav Mehta', '+91 91234 56789', 'B.Tech - Computer Science', 'student@demo.local', 'VIT Bhopal University',
   2027, '8.4', 'React, Node.js, MySQL, Python', NULL, NULL);

INSERT INTO student_skills (user_id, skill) VALUES
  (2, 'React'), (2, 'Node.js'), (2, 'MySQL'), (2, 'Python');

INSERT INTO jobs (job_id, company, job_name, experience, job_type, description, role, posted_by, min_salary, max_salary) VALUES
  (1, 'TechNova Labs', 'Full Stack Developer', 0, 'Full-time',
   'Build and ship features across our React frontend and Node.js/MySQL backend.', 'Full Stack Developer', 1, 600000, 900000),
  (2, 'TechNova Labs', 'Backend Engineer Intern', 0, 'Internship',
   'Work on REST APIs, caching with Redis and background jobs.', 'Backend Developer', 1, 240000, 360000),
  (3, 'TechNova Labs', 'Data Analyst', 1, 'Full-time',
   'Turn product data into dashboards and insights using SQL and Python.', 'Data Analyst', 1, 500000, 800000);

INSERT INTO job_skills (job_id, skill_name) VALUES
  (1, 'React'), (1, 'Node.js'), (1, 'MySQL'),
  (2, 'Node.js'), (2, 'Redis'), (2, 'MySQL'),
  (3, 'SQL'), (3, 'Python');

INSERT INTO applications (app_id, name, email, ph_no, job_id, user_id, resume_url, status) VALUES
  (1, 'Aarav Mehta', 'student@demo.local', '+91 91234 56789', 1, 2, NULL, 'applied');

INSERT INTO messages (sender_id, receiver_id, message) VALUES
  (1, 2, 'Hi Aarav, thanks for applying to the Full Stack Developer role!');
