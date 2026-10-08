# InterviewOS

A recruitment and technical interview platform combining applications, job-specific AI preparation, messaging, video interviews, a shared editor and code execution.

**Live:** [interviewos.duckdns.org](https://interviewos.duckdns.org/)

## Features and contribution

- Candidate/recruiter accounts, email OTP verification, password login and Google sign-in.
- Profiles, jobs, resume uploads, applications, applicant review and interview scheduling.
- Job-specific skill-gap analysis prioritizes missing skills for AI practice, with difficulty based on the job's experience requirement.
- Saved answers, feedback and scores support readiness assessment for a particular job.
- Socket.IO chat and shared Monaco editor; WebRTC video, microphone, camera and screen sharing.
- Twelve execution languages: JavaScript, TypeScript, Python, Java, C++, C, C#, Go, Rust, Kotlin, Ruby and PHP.
- AI questions, answer evaluation and recruiter code-review scorecards.
- Pagination uses the actual API page count; missing profiles offer a setup button; AI errors do not masquerade as login failures.
- Public [Privacy Policy](https://interviewos.duckdns.org/privacy) and [Terms](https://interviewos.duckdns.org/terms).

The contribution is the integration of job-specific skill gaps, targeted practice and live assessment into one hiring workflow. The project does not claim a new AI algorithm.

## Stack

| Component | Current configuration |
|---|---|
| Frontend | React 19, Vite 7, Material UI, React Router, Monaco |
| API | Node.js 22, Express 5 |
| Database | Private AWS RDS MySQL 8.4 with TLS |
| Cache/queue | Redis on EC2, BullMQ email worker |
| Real-time | Socket.IO and WebRTC |
| Execution | JDoodle in production; Judge0 adapters also available |
| AI | Groq; configurable GROQ_MODEL, default openai/gpt-oss-120b |
| Email | Brevo |
| Hosting/files | EC2, Nginx, PM2, private S3, DuckDNS, Let's Encrypt |
| Authentication | bcrypt, JWT httpOnly cookies, Redis OTPs, Google OAuth |

Nginx serves `/var/www/interviewos` and proxies `/api/`, `/auth/` and `/socket.io/` to localhost:5000. Redis stays at localhost:6379. RDS permits port 3306 from EC2's security group. An EC2 IAM role grants S3 access; AWS access keys are not required in `.env`.

Redis stores OTPs and pending signups for 10 minutes, caches jobs/dashboard responses and supports email queues. BullMQ requires `maxRetriesPerRequest: null` in the Redis connection.

## Local development

Use Node.js 22 and Docker Compose. The frontend folder is spelled **Forntend**.

```bash
docker compose up -d
cd Backend
cp .env.example .env
npm ci
npm run dev
```

In another terminal:

```bash
cd Forntend
npm ci
npm run dev
```

Run `npm run worker` from Backend for queued email processing. The local MySQL port is 3307; Redis is 6379. Vite proxies requests to port 5000 when the development API base is empty. Real keys are required for AI, execution and email features.

Compose loads `Backend/db/schema.sql` and `Backend/db/seed.sql` on initial database creation. Local usernames `demo_interviewer` and `demo_student` use `password123`. Do not import that fixed-ID seed or use those credentials in production.

## Production configuration

Use `Backend/.env.example`; keep secrets out of GitHub and the frontend:

```env
NODE_ENV=production
PORT=5000
CLIENT_URL=https://interviewos.duckdns.org
CLIENT_ORIGINS=https://interviewos.duckdns.org
JWT_SECRET=YOUR_RANDOM_SECRET
DB_HOST=YOUR_RDS_ENDPOINT
DB_PORT=3306
DB_USER=admin
DB_PASSWORD="YOUR_RDS_PASSWORD"
DB_NAME=interviewos
DB_SSL=true
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
S3_BUCKET_NAME=YOUR_PRIVATE_BUCKET
AWS_REGION=ap-south-1
GROQ_API_KEY=YOUR_GROQ_KEY
GROQ_MODEL=openai/gpt-oss-120b
BREVO_API_KEY=YOUR_BREVO_KEY
BREVO_SENDER_EMAIL=YOUR_VERIFIED_SENDER
CODE_EXECUTION_PROVIDER=jdoodle
JDOODLE_CLIENT_ID=YOUR_CLIENT_ID
JDOODLE_CLIENT_SECRET=YOUR_CLIENT_SECRET
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI=https://interviewos.duckdns.org/auth/google/callback
```

Remove `RESUME_STORAGE=local` for S3 uploads. Download the RDS CA bundle to `Backend/global-bundle.pem`. The logical database name is `interviewos`, separate from the RDS instance identifier.

Set `Forntend/.env.production` before building:

```env
VITE_API_URL=https://interviewos.duckdns.org
```

The source still has an old-host fallback, so do not omit this variable. HTTP API calls on an HTTPS page are blocked. CORS origins must exactly match, including HTTPS and no trailing slash.

## Providers and operational notes

- **JDoodle:** credentials stay server-side. Free API documentation lists 20 credits/day shared across users; confirm your account allowance. App rate limit: 10 runs/user/minute. Output can contain compiler diagnostics, so Execution finished is not a verdict that the code passed. [Setup](deployment-guide/JDoodle_Setup.md)
- **Groq:** the old Llama model was retired for free/developer usage. Select an active model using GROQ_MODEL. Only HTTP 401 redirects interview users to login; provider failures display errors. [Deprecations](https://console.groq.com/docs/deprecations)
- **Brevo:** authorize the server's outbound IP and verify the sender. The current email helper catches delivery errors, so signup success does not prove email delivery. Check logs if OTP is missing; never publish OTPs or keys.
- **Google:** uses basic openid/email/profile scopes, validates callback state and verified email, matches existing accounts by email and creates candidate accounts. [Setup and troubleshooting](deployment-guide/Google_And_Troubleshooting.md)

## Deploy and update

Follow the [Markdown guide](deployment-guide/InterviewOS_AWS_JDoodle_Deployment_Guide.md) or [PDF guide](deployment-guide/InterviewOS_AWS_JDoodle_Deployment_Guide.pdf).

Some deployed runtime fixes were transferred using SCP and remain uncommitted locally. Synchronize those runtime files to the fork before assuming a fresh clone or `git pull` contains the full deployed implementation. Preserve `.env`, certificates and intentional edits before updating.

After updating the runtime source:

```bash
cd ~/interviewos/Backend
npm ci
npm test
pm2 restart interviewos-backend interviewos-worker --update-env
pm2 save
cd ../Forntend
npm ci
NODE_OPTIONS="--max-old-space-size=1536" npm run build
```

Only after a successful build:

```bash
sudo cp -r dist/. /var/www/interviewos/
sudo chmod -R a+rX /var/www/interviewos
```

The legacy GitHub Actions workflows need secrets/runner configuration and adaptation for this EC2 instance. They currently omit the new frontend API setting and target different frontend paths. Pushing main is not proof that this manually configured deployment updated.

## Demo jobs

```bash
cd ~/interviewos/Backend
node scripts/seed-demo-jobs.js --dry-run
node scripts/seed-demo-jobs.js
```

This adds six labeled fictional jobs, their skills and illustrative salaries, skips existing demo listings, preserves other records and clears only the jobs cache. The sample owner has no shared password. No email, applications or candidate profiles are created.

## Checks

```bash
cd Backend
npm test
cd ../Forntend
node --test tests/interviewRequest.test.js
npm run build
```

Backend tests mock provider calls; they cover execution validation, rate limits, JWT/cookies, OAuth state and AI parsing. Frontend request tests prevent AI errors being treated as expired sessions. Use `npm.cmd` in PowerShell if npm.ps1 is blocked.

Verified live: HTTPS, MySQL/Redis connections, OTP delivery, password login, session persistence, Google sign-in, JDoodle Python execution, AI questions, profile rendering, policy pages and two-page pagination. Two-participant video, resume/application handling and end-to-end chat still need separate validation.

## Attribution and license

Fork maintained by [Tech-Savant20](https://github.com/Tech-Savant20/interviewOs). Original project by [Rahul](https://github.com/rahulrao2-0/interviewOs). MIT License.
