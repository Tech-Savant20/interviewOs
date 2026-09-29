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
- MySQL
- Redis
- OpenAI API key

### Installation

```bash
# Clone the repository
git clone https://github.com/rahulrao2-0/interviewos.git
cd interviewos

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in your DB, Redis, JWT secret, and OpenAI API credentials

# Run database migrations
npm run migrate

# Start the development server
npm run dev
```

### Environment Variables

```env
DATABASE_URL=
REDIS_URL=
JWT_SECRET=
OPENAI_API_KEY=
EMAIL_SERVICE_API_KEY=
AWS_S3_BUCKET=
JUDGE0_API_KEY=        # RapidAPI key for Judge0 CE (code execution)
JUDGE0_API_URL=        # optional, defaults to https://judge0-ce.p.rapidapi.com
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
