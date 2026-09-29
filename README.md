# InterviewOS 🎯

> A full-stack recruitment and technical interview platform with live video interviews, a shared coding editor with real code execution, and an AI mock interviewer.

**Live:** [interviewos.online](https://interviewos.online)

---

## 📖 Overview

InterviewOS brings the technical hiring pipeline into one place. Recruiters post jobs, review applicants and run live interviews. Candidates build a profile, apply for jobs, chat with recruiters and practise with an AI interviewer. The interview room combines a peer-to-peer video call, a collaborative code editor and multi-language code execution.

---

## ✨ Features

- **Authentication** — username/password login with bcrypt hashing, 4-digit email OTP verification (OTP and pending signup held in Redis for 10 minutes), JWT in an httpOnly cookie, and Google sign-in
- **Two roles** — candidates (`user`) and interviewers/recruiters (`interviewer`), each with their own profile setup
- **Jobs** — post, edit and delete jobs; browse with pagination and filter by skills, job type, experience and salary band
- **Skill-match emails** — when a job is posted, candidates whose skills overlap are emailed through a BullMQ queue and a background worker
- **Applications** — apply with a resume (stored in AWS S3, opened by recruiters through a 5-minute signed URL); recruiters shortlist, select or reject, and the candidate is emailed
- **Recruiter dashboard** — total jobs, applicants, shortlisted and rejected counts, recent jobs and applicants (cached in Redis)
- **Interview scheduling** — creates a unique meeting room, emails the candidate and notifies them in chat
- **Real-time chat** — Socket.IO messaging between recruiters and candidates, persisted in MySQL
- **Live interview room** — WebRTC peer-to-peer video with mute, camera and screen share, plus a Monaco code editor whose code, language and run output stay in sync for both participants
- **Code execution** — 12 languages (JavaScript, TypeScript, Python, Java, C++, C, C#, Go, Rust, Kotlin, Ruby, PHP) run in a sandbox through Judge0, with per-user rate limiting
- **AI mock interview** — Groq's Llama 3.3 70B generates questions for a chosen topic and difficulty, then scores each answer from 0–10 with feedback; answers can be spoken (browser speech recognition) and questions are read aloud

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Material UI, React Router |
| Backend | Node.js, Express 5 |
| Database | MySQL (AWS RDS in production) |
| Caching / Queues | Redis, BullMQ |
| Real-time Communication | Socket.IO, WebRTC |
| Code Editor | Monaco Editor |
| Code Execution | Judge0 CE |
| AI Integration | Groq API (Llama 3.3 70B) |
| Email | Brevo |
| Infrastructure | AWS EC2, AWS RDS, AWS S3, Nginx (reverse proxy + SSL), PM2 |
| CI/CD | GitHub Actions |
| Auth | JWT, bcrypt, OTP email verification, Google OAuth 2.0 |

---

## 🏗️ Architecture

<img width="882" height="668" alt="image" src="https://github.com/user-attachments/assets/5816845a-a1eb-4226-ac7b-a635f605d6a2" />


**Key design decisions:**
- **Redis for OTPs and caching** — short-lived OTPs and pending signups expire automatically, and hot reads (job list, dashboard) skip MySQL
- **Background email queue** — BullMQ moves skill-match emails out of the request, so posting a job stays fast
- **WebRTC for peer-to-peer video** — media flows directly between participants; the server only relays signalling over Socket.IO
- **Socket.IO for code sync** — low-latency bi-directional updates for the collaborative editor
- **Sandboxed execution** — untrusted code runs in Judge0's isolated containers, never on the application server

---

## ☁️ Deployment

- The React build and the Express API run on one **AWS EC2** instance (ap-south-1) behind **Nginx**, which serves the frontend, proxies `/api` and Socket.IO to the backend, and terminates SSL.
- The backend runs under **PM2**. **MySQL** is on **AWS RDS** (SSL), **Redis** runs on the EC2 instance, and resumes are stored in **S3**.
- **GitHub Actions** deploy on every push to `main`: the frontend is built and copied to the server over SSH, and a self-hosted runner on the EC2 instance installs backend dependencies and restarts PM2.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Docker Desktop (runs MySQL and Redis locally)

### Run locally

```bash
# 1. Start MySQL + Redis (schema and demo data load automatically on first start)
docker compose up -d

# 2. Backend — http://localhost:5000
cd Backend
cp .env.example .env        # works as-is; add GROQ_API_KEY for the AI mock interview
npm install
npm run dev

# 3. Frontend — http://localhost:5173 (in a second terminal)
cd Forntend
npm install
npm run dev
```

Log in with a demo account (password `password123`):

| Username | Role |
|---|---|
| `demo_interviewer` | Interviewer / recruiter |
| `demo_student` | Candidate |

Notes:
- In development the frontend proxies `/api`, `/auth` and `/socket.io` to the backend (see `Forntend/vite.config.js`), so no CORS or cookie setup is needed. Production builds still call `https://interviewos.online`.
- Without `BREVO_API_KEY`, emails are not sent. The signup OTP is printed in the backend console instead.
- `RESUME_STORAGE=local` saves uploaded resumes to `Backend/uploads/` instead of S3.
- Reset the database with `docker compose down -v && docker compose up -d`.
- The schema is in `Backend/db/schema.sql` and the demo data in `Backend/db/seed.sql`.

### Environment Variables

See `Backend/.env.example` for the full list. The main ones:

```env
DB_HOST= DB_PORT= DB_USER= DB_PASSWORD= DB_NAME=
DB_SSL=false               # omit in production (uses the AWS RDS CA bundle)
REDIS_HOST= REDIS_PORT=
JWT_SECRET=
GROQ_API_KEY=              # AI mock interview questions + evaluation
BREVO_API_KEY=             # transactional email
JUDGE0_API_KEY=            # RapidAPI key for Judge0 CE (code execution)
JUDGE0_API_URL=            # optional, defaults to https://judge0-ce.p.rapidapi.com
CLIENT_ORIGINS=            # extra CORS origins, comma separated
CLIENT_URL=                # frontend URL used in meeting links and emails
```

---

## 🧪 Testing

```bash
cd Backend
npm test
```

Unit tests (Node's built-in test runner) cover the code-execution endpoint (Judge0 mocked), rate limiting, error handling, auth cookies and JWTs.

---

## 📸 Screenshots / Demo

<img width="1899" height="968" alt="image" src="https://github.com/user-attachments/assets/a97f28b6-3659-448a-890c-50ae90f9593e" />
<img width="1917" height="976" alt="image" src="https://github.com/user-attachments/assets/1336ccc4-d48c-4b45-b933-a81b951eef31" />
<img width="1896" height="972" alt="image" src="https://github.com/user-attachments/assets/e34631c1-7e53-4261-a45d-4f74f3ae9293" />




## 🗺️ Roadmap

- [ ] Add support for group/panel interviews
- [ ] Expand language support in the code execution engine
- [ ] Add analytics dashboard for interviewers

---

## 📄 License

This project is licensed under the MIT License.

---

## 👤 Author

**Rahul**
[LinkedIn](https://linkedin.com/in/rahul-yadav-073756289) · [GitHub](https://github.com/rahulrao2-0) · yadavrahul81135@gmail.com
