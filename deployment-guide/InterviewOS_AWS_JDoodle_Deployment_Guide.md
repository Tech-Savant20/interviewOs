## InterviewOS | AWS Deployment Guide

Fresh AWS account • Free DuckDNS hostname • Existing Groq and Brevo credentials

Prepared 9 October 2026. This guide covers EC2, RDS and S3 in the new AWS account. Keep resources already created; do not reuse the previous account’s RDS endpoint or S3 bucket. API keys are placeholders.

## Before you start

Updated 9 October 2026 for the current deployment: JDoodle execution, configurable Groq model, Google login and public policy pages. If you already completed steps 1-10, continue at step 11. Do not recreate working AWS resources.

JDoodle and other runtime fixes have been deployed by SCP, but some remain uncommitted locally. Until synchronized to GitHub, a fresh clone needs the matching runtime files and tests. Keep credentials private.

Create an AWS monthly budget alert. EC2, RDS, storage and public IPv4 addresses may incur charges. The API keys previously shared in chat are exposed; rotating them before public launch is recommended.

Replace YOUR_NAME.duckdns.org, YOUR_EC2_IP, YOUR_RDS_ENDPOINT, YOUR_BUCKET_NAME and YOUR_REPOSITORY_URL with your actual values. Never publish .env or the SSH private key.

## Where commands run

SSH, nslookup and the step 14 scp commands run in Windows PowerShell on your laptop. Linux commands run inside your EC2 SSH session. To save a file in nano: Ctrl+O, Enter, then Ctrl+X.

```
Browser -> HTTPS -> Nginx on EC2
                    |-- React static files
                    |-- Express + Socket.IO
                    |-- Redis + email worker
                         |-- RDS MySQL
                         |-- S3 resumes
```

Keep a private note of your Elastic IP, key file path, VPC ID, EC2 security group ID, DuckDNS hostname, RDS endpoint and credentials, and bucket name.

## 1. Launch EC2 in Mumbai

Sign in at console.aws.amazon.com. Select Asia Pacific (Mumbai), ap-south-1, in the region selector. Search for EC2, then choose Instances > Launch instances.

Name: interviewos-server. AMI: Ubuntu Server 24.04 LTS, 64-bit x86. Instance: t3.small (2 GB RAM) for a small demonstration. Storage: 20 GiB gp3.

Create an RSA key pair named interviewos-key, format .pem. Download and keep the file securely. Choose the default VPC and a public/default subnet; enable auto-assigned public IP.

Create interviewos-web-sg. Allow TCP 22 from My IP only; HTTP 80 and HTTPS 443 from Anywhere IPv4 (0.0.0.0/0). Do not expose 5000, 3306 or 6379. Launch and wait for Running and successful status checks.

Record the VPC ID from Networking and security group ID from Security. RDS must use this same VPC.

## 2. Allocate an Elastic IP

EC2 > Network & Security > Elastic IP addresses > Allocate Elastic IP address. Use the default pool. Select the address > Actions > Associate Elastic IP address > Instance > interviewos-server. Record the IP. Elastic IPs incur public IPv4 charges.

## 3. Register a free DuckDNS hostname

Open https://www.duckdns.org and sign in. Add an available name, such as interviewos-abhyuday. Set its IPv4 address to the Elastic IP and save. Leave IPv6 empty unless configured. Your address becomes YOUR_NAME.duckdns.org.

In Windows PowerShell, check DNS:

```
nslookup YOUR_NAME.duckdns.org
```

The IPv4 result must match your Elastic IP. Wait for propagation if needed. A fixed Elastic IP means no periodic DuckDNS update script is needed.

## 4. Create RDS MySQL

Your existing RDS configuration uses MySQL 8.4, username admin, Single-AZ and a private endpoint. Keep it. For a new setup, select a supported MySQL version, self-managed credentials and a small eligible instance with 20 GiB storage; review the displayed price.

Connectivity: choose the same VPC as EC2. Use an available/default DB subnet group. Public access: No. Create security group interviewos-db-sg. Port: 3306. Choose manual EC2 connectivity if prompted.

Under Additional configuration, set Initial database name to interviewos. Keep automated backups enabled. Review optional paid features. Create and wait until Available.

The RDS identifier interviewos-db is not the MySQL database name interviewos. Copy the endpoint hostname from Connectivity & security, without https:// or a port.

## 5. Allow EC2 to connect to RDS

Your RDS setup used automatic connection to interviewos-server. AWS creates connection security groups such as rds-ec2-1, so skip adding a duplicate rule if that connection is in place. For manual connectivity, allow TCP 3306 on the RDS security group from the EC2 security group. Never use Anywhere as the source.

## 6. Create a private S3 bucket

S3 > Create bucket. Use a globally unique new name, such as interviewos-resumes-yourname-2026, in ap-south-1. Keep Bucket owner enforced, Block all public access enabled, and default encryption enabled. Record the bucket name.

The application uses temporary signed download URLs. Resumes do not need a public bucket.

## 7. Create the S3 access policy

IAM > Policies > Create policy > JSON. Replace YOUR_BUCKET_NAME, then save as InterviewOSResumeAccess:

```
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:PutObject", "s3:GetObject"],
    "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
  }]
}
```

## 8. Attach the role and connect

IAM > Roles > Create role. Trusted entity: AWS service; use case: EC2. Attach InterviewOSResumeAccess and name the role InterviewOSEC2Role. EC2 > Instances > select your instance > Actions > Security > Modify IAM role. Attach that role. AWS access keys are not needed in .env.

Run on Windows PowerShell (adjust the key path):

```
ssh -i "C:\Users\abhyu\Downloads\interviewos-key.pem" ubuntu@YOUR_EC2_IP
```

Accept the first connection fingerprint after confirming the target instance. All remaining commands run on EC2.

## 9. Install server packages

```
sudo apt update
sudo apt install -y nginx redis-server mysql-client git curl unzip snapd
sudo systemctl enable --now nginx redis-server
redis-cli ping
```

Expected Redis reply: PONG. Keep Redis bound to localhost with protected mode enabled.

## 10. Install Node.js 22 and PM2

Open https://nodejs.org/en/download. Select Linux, Node.js 22 and nvm. Run its displayed NVM installation command on EC2. Reconnect SSH if needed, then:

```
nvm install 22
nvm use 22
nvm alias default 22
node --version
npm --version
npm install -g pm2
```

Node should report v22.x. Run npm as ubuntu; do not use sudo npm with NVM.

## 11. Download the project

```
cd ~
git clone https://github.com/Tech-Savant20/interviewOs.git interviewos
```

The repository must contain Backend and Forntend. For private repositories, use an authorized deploy key or supported authentication method. Keep tokens out of clone URLs.

## 12. Fix the BullMQ Redis connection

```
nano ~/interviewos/Backend/Redis.js
```

Ensure the Redis constructor contains this configuration. Preserve the change in your repository:

```
const redis = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
});
```

The worker needs maxRetriesPerRequest: null. This code reads REDIS_HOST and REDIS_PORT, not REDIS_URL.

## 13. Configure Backend/.env

```
cd ~/interviewos/Backend
npm ci
cp .env.example .env
nano .env
```

Use the following template. Paste the existing API keys locally, and use your NEW database and bucket settings:

```
NODE_ENV=production
PORT=5000
CLIENT_URL=https://YOUR_NAME.duckdns.org
CLIENT_ORIGINS=https://YOUR_NAME.duckdns.org
JWT_SECRET=YOUR_JWT_SECRET
GROQ_API_KEY=PASTE_OLD_GROQ_KEY_LOCALLY
GROQ_MODEL=openai/gpt-oss-120b
BREVO_API_KEY=PASTE_OLD_BREVO_KEY_LOCALLY
BREVO_SENDER_EMAIL=YOUR_VERIFIED_BREVO_SENDER
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
DB_HOST=YOUR_RDS_ENDPOINT
DB_PORT=3306
DB_USER=admin
DB_PASSWORD="YOUR_NEW_RDS_PASSWORD"
DB_NAME=interviewos
DB_SSL=true
S3_BUCKET_NAME=interviewos-resumes-abhyuday-2026
AWS_REGION=ap-south-1
CODE_EXECUTION_PROVIDER=jdoodle
JDOODLE_CLIENT_ID=YOUR_CLIENT_ID
JDOODLE_CLIENT_SECRET=YOUR_CLIENT_SECRET
```

CLIENT_URL and CLIENT_ORIGINS must use the exact HTTPS hostname, without a trailing slash. The old Llama Groq model was retired; use an active model available to your account. Brevo also requires authorizing the new EC2 outbound IP in the account owning the API key.

The sender must remain verified in the Brevo account associated with the existing key. Remove RESUME_STORAGE=local so uploads use S3. A new JWT secret can be generated with openssl rand -hex 32.

```
chmod 600 .env
```

## 14. Configure execution and initialize MySQL

On your laptop, open a separate Windows PowerShell window and copy these three files. These commands assume the current Elastic IP is 13.206.13.11 and the clone is ~/interviewos. Adjust the IP if it changed.

```
Set-Location "C:\Users\abhyu\Desktop\projects\capstone project"
scp -i "C:\Users\abhyu\Downloads\interviewos-key.pem" `
  Backend/controllers/codeExecution.js `
  ubuntu@13.206.13.11:~/interviewos/Backend/controllers/
scp -i "C:\Users\abhyu\Downloads\interviewos-key.pem" `
  Backend/utils/jdoodle.js Backend/utils/judge0Config.js `
  ubuntu@13.206.13.11:~/interviewos/Backend/utils/
```

Copy the corresponding test files as well so production provider settings do not break old Judge0-only mocks:

```
scp -i "C:\Users\abhyu\Downloads\interviewos-key.pem" `
  Backend/tests/codeExecution.test.js Backend/tests/jdoodle.test.js `
  Backend/tests/judge0Config.test.js `
  ubuntu@13.206.13.11:~/interviewos/Backend/tests/
```

Return to the EC2 SSH terminal. JDoodle credentials belong only in Backend/.env. No RapidAPI subscription or Judge0 key is required. The frontend uses the existing execution endpoint.

Download the certificate, then create the logical database if Easy create did not create one:

Download the RDS CA certificate at the location expected by the backend:

```
cd ~/interviewos/Backend
curl -fsSLo global-bundle.pem \
  https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
```

Connect with this command, entering your NEW RDS password when prompted:

```
mysql --host=YOUR_RDS_ENDPOINT --port=3306 \
  --user=admin --password \
  --ssl-mode=VERIFY_IDENTITY --ssl-ca=global-bundle.pem
```

At the mysql> prompt, run:

```
CREATE DATABASE IF NOT EXISTS interviewos;
EXIT;
```

Import the schema into the new, empty database. Do not repeat this import on a populated deployment:

```
mysql --host=YOUR_RDS_ENDPOINT --port=3306 \
  --user=admin --password \
  --ssl-mode=VERIFY_IDENTITY --ssl-ca=global-bundle.pem \
  interviewos < db/schema.sql
```

Verify the tables:

```
mysql --host=YOUR_RDS_ENDPOINT \
  --user=admin --password \
  --ssl-mode=VERIFY_IDENTITY --ssl-ca=global-bundle.pem \
  interviewos --execute="SHOW TABLES;"
```

Expected: users, student_details, student_skills, interviewer_details, jobs, job_skills, applications, interviews, mock_interviews and messages. Skip seed.sql for public launch; it contains known demo passwords. For ongoing use, switch to a dedicated application database user.

## 15. Start API and email worker

```
npm test
pm2 start app.js --name interviewos-backend
pm2 start workers/SkillMatchingEmailWorker.js \
  --name interviewos-worker
pm2 status
curl http://127.0.0.1:5000/test
pm2 logs --lines 50
```

Both processes should be online. The test endpoint returns {"message":"API is working!"}. Also confirm database and Redis connections in logs. Ctrl+C exits the log display without stopping the app.

```
pm2 startup
# Run the exact sudo command printed by PM2, then:
pm2 save
```

## 16. Build and publish the frontend

The folder is spelled Forntend in this project:

```
cd ~/interviewos/Forntend
nano .env.production
```

```
VITE_API_URL=https://YOUR_NAME.duckdns.org
```

This overrides the old interviewos.online backend URL. Build and publish:

```
npm ci
NODE_OPTIONS="--max-old-space-size=1536" npm run build
sudo mkdir -p /var/www/interviewos
sudo cp -r dist/. /var/www/interviewos/
sudo chmod -R a+rX /var/www/interviewos
```

## 17. Configure Nginx

```
sudo nano /etc/nginx/sites-available/interviewos
```

Paste the following, replacing the hostname:

```
server {
    listen 80;
    server_name YOUR_NAME.duckdns.org;
    root /var/www/interviewos;
    index index.html;
    client_max_body_size 10M;

    location / {
        try_files $uri $uri/ /index.html;
    }
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }
    location /auth/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location /socket.io/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 3600s;
    }
}
```

## 18. Enable the site and HTTPS

```
sudo ln -s /etc/nginx/sites-available/interviewos \
  /etc/nginx/sites-enabled/interviewos
sudo nginx -t
sudo systemctl reload nginx
```

First open http://YOUR_NAME.duckdns.org. The frontend should load. Then enable HTTPS:

If the Nginx welcome page appears, confirm your application symlink exists in sites-enabled and disable the unused default symlink. Certbot must install HTTPS into the application site; if it used default earlier, reinstall the existing certificate after enabling your site.

```
sudo snap install --classic certbot
sudo /snap/bin/certbot --nginx -d YOUR_NAME.duckdns.org
sudo /snap/bin/certbot renew --dry-run
```

Enter your email, accept the terms and enable HTTPS redirection if prompted. DNS must resolve to EC2 and port 80 must be reachable for certificate validation. Use https://YOUR_NAME.duckdns.org for login and camera access.

## 19. Verify every feature

Create fresh candidate and recruiter accounts. Check signup OTP, verification, login after refresh, both profile types, job posting, applications, uploads to the new S3 bucket, and recruiter resume viewing.

Check AI questions and feedback, chat between two sessions, scheduling links using your DuckDNS hostname, and direct React page refreshes. In the interview editor, select Python and run print("JDoodle is connected!"). Verify output; also test stdin. Compiler errors appear in the output, so Execution finished does not mean the program passed.

JDoodle free API allowance is 20 credits per day, shared across all users of your app; a normal execution costs one credit. Check the account dashboard for your current allowance. Automated local tests do not verify your live credentials.

Test video on two devices using different networks. The current implementation uses STUN only; restrictive networks may require a TURN relay.

Google login is optional and needs separate OAuth credentials. Register https://YOUR_NAME.duckdns.org/auth/google/callback as the callback, and set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI in Backend/.env.

Google Branding links for the deployed hostname: https://interviewos.duckdns.org/privacy and https://interviewos.duckdns.org/terms. These pages are public and linked from the homepage. Complete Branding and save before publishing in Audience. Use separate Google credentials, not JDoodle credentials.

A missing profile is expected until profile setup is completed; use the Complete profile button. Pagination follows actual page counts. AI provider errors must not redirect a valid logged-in user to login.

## Optional: Add demo listings

```
cd ~/interviewos/Backend
node scripts/seed-demo-jobs.js --dry-run
node scripts/seed-demo-jobs.js
```

Use this additive seed for six clearly labeled fictional jobs. It preserves existing data and clears only the jobs cache. Do not import the local fixed-ID seed.sql into an existing live database.

## 20. Update future versions

Before git pull, commit and push the Redis correction and all three JDoodle runtime files into your fork. The scp transfer did not update GitHub. Otherwise git pull may conflict or a future checkout may lose the integration. Never commit .env. Apply database migrations separately when needed.

```
cd ~/interviewos
git pull
cd Backend
npm ci
npm test
pm2 restart interviewos-backend interviewos-worker --update-env
cd ../Forntend
npm ci
NODE_OPTIONS="--max-old-space-size=1536" npm run build
sudo cp -r dist/. /var/www/interviewos/
```

## Troubleshooting checklist

SSH timeout: Confirm instance is running, Elastic IP is correct and port 22 allows your current public IP.

Site unreachable: Check DuckDNS IPv4, ports 80/443 and Nginx. Remove incorrect IPv6 records.

Database timeout: Check same VPC, correct endpoint and RDS inbound 3306 from EC2 security group.

Database not found: Initial database name must be interviewos; do not confuse it with RDS identifier.

Missing CA file: Check Backend/global-bundle.pem exists and was downloaded successfully.

Nginx 502: Check PM2 process status and backend startup logs.

Worker exits: Check Redis and maxRetriesPerRequest: null.

Old backend requests: Check Forntend/.env.production, then rebuild and republish.

Resume access denied: Check new bucket name, IAM role attachment and object permissions.

OTP not received: Check Brevo key validity, verified sender and backend logs.

AI or code execution fails: Check provider credentials, subscriptions, quotas and endpoint/model availability.

Login or camera fails: Use HTTPS and match the hostname exactly in frontend/backend settings.

```
pm2 status
pm2 logs interviewos-backend --lines 100
pm2 logs interviewos-worker --lines 100
sudo tail -n 100 /var/log/nginx/error.log
redis-cli ping
```

## Official references

See also: [Google setup and troubleshooting](Google_And_Troubleshooting.md).

https://www.jdoodle.com/docs/api/credits

https://www.jdoodle.com/docs/api/rest

https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/EC2_GetStarted.html

https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/ec2-rds-connect.html

https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/attach-iam-role.html

https://www.duckdns.org/

https://nodejs.org/en/download

https://certbot.eff.org/instructions?os=snap&tab=standard&ws=nginx
