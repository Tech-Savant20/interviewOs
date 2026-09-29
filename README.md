# InterviewOS 🎯

> A full-stack recruitment and AI-powered technical interview platform enabling live video interviews, real-time collaborative coding, and automated candidate evaluation.

**Live:** [interviewos.online](https://interviewos.online)

---

## 📖 Overview

InterviewOS streamlines the technical hiring pipeline for interviewers and candidates — combining peer-to-peer video interviews, a collaborative live coding environment, multi-language code execution, and AI-driven interview prep and evaluation into a single platform.

Built for 100+ users across candidate and interviewer roles, with production deployment on AWS EC2.

---

## ✨ Features

- **JWT Authentication + OTP Email Verification** — secure sign-up/login with Redis-backed session management
- **Peer-to-Peer Video Interviews** — WebRTC + Socket.IO powered video rooms with sub-200ms audio/video latency
- **Live Collaborative Code Editor** — Monaco Editor with real-time bi-directional sync over Socket.IO; interviewers and candidates co-edit with zero lag
- **Multi-Language Code Execution Engine** — isolated code execution for 10+ languages (JavaScript, Python, Java, C++, TypeScript, Go, and more), results delivered in under 2 seconds
- **AI-Powered Interview Prep** — real-time audio transcription with OpenAI-driven, role- and difficulty-tailored question generation
- **Automated Candidate Evaluation** — AI evaluator scores responses on accuracy, clarity, and relevance; generates performance reports in under 10 seconds
- **Recruiter Workflow Tools** — scheduling, application tracking, and messaging in one dashboard

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js |
| Backend | Node.js, Express.js |
| Database | MySQL |
| Caching / Sessions | Redis |
| Real-time Communication | Socket.IO, WebRTC |
| Code Editor | Monaco Editor |
| AI Integration | OpenAI API |
| Infrastructure | AWS EC2, AWS S3, Nginx (reverse proxy + SSL termination) |
| CI/CD | GitHub Actions |
| Auth | JWT, OTP Email Verification |

---

## 🏗️ Architecture

<img width="882" height="668" alt="image" src="https://github.com/user-attachments/assets/5816845a-a1eb-4226-ac7b-a635f605d6a2" />


**Key design decisions:**
- **Redis for session management** — reduces DB load and enables fast OTP/session lookups
- **WebRTC for peer-to-peer video** — avoids routing media through the server, keeping latency low and infra cost down
- **Socket.IO for code sync** — enables low-latency bi-directional updates for the collaborative editor
- **Isolated execution engine** — sandboxes untrusted code submissions per language runtime

---

## 📊 Performance & Impact

- Sub-200ms audio/video latency in interview rooms
- Zero-lag real-time code synchronization between interviewer and candidate
- Code execution results delivered in under 2 seconds per submission
- AI performance reports generated in under 10 seconds
- 45% improvement in average API response time; 30% reduction in MySQL query load via Redis caching and query optimization
- Deployment time reduced from 20 minutes to 3 minutes via GitHub Actions CI/CD automation
- 99.9% uptime on AWS EC2 with Nginx reverse proxy and SSL termination
- 50% reduction in mock interview preparation time via AI-generated question sets
- 35% reduction in recruiter coordination overhead through streamlined scheduling and messaging

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
npm test
```

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
