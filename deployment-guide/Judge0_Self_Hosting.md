# InterviewOS: self-host Judge0 on AWS

This is an optional alternative, not the current deployment. The live application uses JDoodle. See [JDoodle setup](JDoodle_Setup.md) and the [current AWS guide](InterviewOS_AWS_JDoodle_Deployment_Guide.md) for the deployed configuration. Do not create another runner unless deliberately switching providers.

This setup uses a dedicated runner EC2 instance and private VPC connectivity. There is no RapidAPI subscription or per-submission API fee; the additional EC2 instance and storage still cost money. The local backend has been updated for Judge0 CE v1.13.1 language IDs and token authentication. These changes must also be copied to the application EC2 server before switching endpoints.

## 1. Launch the runner

In Mumbai, launch an instance named `interviewos-judge0`:

- Ubuntu Server **22.04 LTS**, **x86_64** (the release's recommended OS).
- Suggested starting size: **t3.medium**, 4 GiB RAM, **30 GiB gp3**. This is a sizing recommendation for a small demo, not a guaranteed capacity limit.
- Same VPC as `interviewos-server`, a public subnet with outbound internet so you can install packages and pull images.
- Your existing SSH key pair is fine.
- New security group `interviewos-judge0-sg`: TCP **22** from your current IP; TCP **2358** from **interviewos-web-sg** only.
- Do not open 2358 to Anywhere. Do not add this runner security group to RDS's allowed sources.
- No S3 IAM role, application keys, or database credentials on the runner.
- Under Advanced details, disable the instance metadata endpoint. The runner does not need AWS credentials.

Record its public IP for SSH and private IPv4 for application traffic. The private IPv4 stays with this instance across stop/start; the public address may change. A separate domain and Elastic IP are not needed for the runner.

## 2. Connect to the runner (Windows PowerShell)

```powershell
ssh -i "C:\Users\abhyu\Downloads\interviewos-key.pem" ubuntu@RUNNER_PUBLIC_IP
```

All commands below run on this NEW runner unless labeled application server.

## 3. Enable the cgroup mode required by this release

```bash
sudo apt update
sudo apt install -y ca-certificates curl unzip python3
sudo nano /etc/default/grub
```

Find `GRUB_CMDLINE_LINUX`. Preserve any existing arguments and append:

```text
systemd.unified_cgroup_hierarchy=0
```

If it was empty, the line becomes:

```text
GRUB_CMDLINE_LINUX="systemd.unified_cgroup_hierarchy=0"
```

Save, then:

```bash
sudo update-grub
sudo reboot
```

SSH disconnects. Reconnect after reboot and verify:

```bash
stat -fc %T /sys/fs/cgroup
```

Expect `tmpfs` for cgroup v1, rather than `cgroup2fs`. Do not alter the app server's GRUB settings.

## 4. Install Docker and Compose

On the fresh runner, install from Docker's official Ubuntu repository:

```bash
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

sudo tee /etc/apt/sources.list.d/docker.sources > /dev/null <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "$VERSION_CODENAME")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo docker run --rm hello-world
sudo docker compose version
```

## 5. Download the patched Judge0 release

```bash
cd ~
curl -fL -o judge0-v1.13.1.zip \
  https://github.com/judge0/judge0/releases/download/v1.13.1/judge0-v1.13.1.zip
unzip judge0-v1.13.1.zip
cd judge0-v1.13.1
```

Use v1.13.1, which patches critical issues in earlier releases. The official deployment uses privileged containers, which is why this runner is separated from the application.

## 6. Configure authentication and limits

Generate three distinct secrets on the runner and keep the authentication token privately:

```bash
openssl rand -hex 32
openssl rand -hex 32
openssl rand -hex 32
nano judge0.conf
```

Replace the corresponding existing lines (do not append duplicate keys):

```env
REDIS_PASSWORD=FIRST_RANDOM_SECRET
POSTGRES_PASSWORD=SECOND_RANDOM_SECRET
AUTHN_HEADER=X-Auth-Token
AUTHN_TOKEN=THIRD_RANDOM_SECRET
ENABLE_WAIT_RESULT=true
ENABLE_NETWORK=false
ALLOW_ENABLE_NETWORK=false
ENABLE_CALLBACKS=false
ENABLE_ADDITIONAL_FILES=false
ENABLE_COMPILER_OPTIONS=false
ENABLE_COMMAND_LINE_ARGUMENTS=false
ENABLE_BATCHED_SUBMISSIONS=false
ENABLE_SUBMISSION_DELETE=false
COUNT=2
MAX_QUEUE_SIZE=20
CPU_TIME_LIMIT=3
MAX_CPU_TIME_LIMIT=3
WALL_TIME_LIMIT=10
MAX_WALL_TIME_LIMIT=10
MEMORY_LIMIT=128000
MAX_MEMORY_LIMIT=128000
MAX_FILE_SIZE=1024
MAX_MAX_FILE_SIZE=1024
JUDGE0_TELEMETRY_ENABLE=false
```

Judge0's PostgreSQL and Redis are separate from InterviewOS's RDS MySQL and Redis. Keep the release's `POSTGRES_HOST=db` and `REDIS_HOST=redis` values.

Edit `docker-compose.yml`:

```bash
nano docker-compose.yml
```

Replace BOTH Judge0 server/worker image values with `judge0/judge0:1.13.1` instead of `latest` (if necessary). Preserve other release settings, especially the readonly configuration mount, internal database/Redis networking and persistent database volume. Keep the server port mapping `2358:2358`. PostgreSQL and Redis must have no published host ports.

Protect the config:

```bash
chmod 600 judge0.conf
sudo docker compose config --quiet
sudo docker compose pull
```

If image download fails, stop here and inspect the error rather than substituting an older release.

## 7. Start and test

```bash
sudo docker compose up -d db redis
sudo docker compose ps
```

Allow roughly 10 seconds for database initialization, then:

```bash
sudo docker compose up -d
sudo docker compose ps
sudo docker compose logs --tail=60 server workers
```

Wait for the API to finish booting. Avoid posting logs containing secrets.

Read the token without putting its literal value into shell history:

```bash
read -rsp "Judge0 token: " JUDGE0_TEST_TOKEN
echo
curl --fail-with-body -H "X-Auth-Token: $JUDGE0_TEST_TOKEN" \
  http://127.0.0.1:2358/languages
```

Run Python:

```bash
curl --fail-with-body \
  -H "Content-Type: application/json" \
  -H "X-Auth-Token: $JUDGE0_TEST_TOKEN" \
  -d '{"language_id":71,"source_code":"print(42)","enable_network":false}' \
  'http://127.0.0.1:2358/submissions?base64_encoded=false&wait=true'
unset JUDGE0_TEST_TOKEN
```

Expect `stdout` containing `42\n` and status ID **3** (`Accepted`). A working `/languages` response alone does not prove the worker sandbox works.

## 8. Install the integration changes on the APP server

The local files changed for this setup are:

- `Backend/controllers/codeExecution.js`
- `Backend/utils/judge0Config.js` (new)
- `Backend/tests/judge0Config.test.js` (new)
- `Backend/.env.example`

These changes have NOT been pushed to GitHub. Either commit/push and pull them on EC2, or copy the three JavaScript files directly. For direct copy, run these commands on Windows, using your existing app Elastic IP:

```powershell
Set-Location "C:\Users\abhyu\Desktop\projects\capstone project"
scp -i "C:\Users\abhyu\Downloads\interviewos-key.pem" Backend/controllers/codeExecution.js ubuntu@13.206.13.11:~/interviewos/Backend/controllers/
scp -i "C:\Users\abhyu\Downloads\interviewos-key.pem" Backend/utils/judge0Config.js ubuntu@13.206.13.11:~/interviewos/Backend/utils/
scp -i "C:\Users\abhyu\Downloads\interviewos-key.pem" Backend/tests/judge0Config.test.js ubuntu@13.206.13.11:~/interviewos/Backend/tests/
```

Confirm the destination folders exist first. Adapt the path if your application clone is elsewhere.

SSH to the APPLICATION server, then edit its existing environment file:

```bash
cd ~/interviewos/Backend
nano .env
```

Replace existing Judge0 settings with:

```env
JUDGE0_MODE=self-hosted
JUDGE0_API_URL=http://RUNNER_PRIVATE_IP:2358
JUDGE0_AUTH_TOKEN=THIRD_RANDOM_SECRET
JUDGE0_API_KEY=
```

Use the runner's PRIVATE IP and the exact same `AUTHN_TOKEN`. Keep this token out of the frontend. No changes to frontend API URL, Nginx or DuckDNS are needed.

From the app server, verify connectivity with the same authenticated `/languages` curl request, replacing localhost with the runner's private IP. Then:

```bash
npm test
pm2 restart interviewos-backend --update-env
```

If PM2 is not set up yet, start `app.js` as described in the deployment guide instead. Test Python, JavaScript and a compiled language from the site's interview room, including a syntax error and an infinite loop (which should terminate at the configured time limit).

## Runtime versions and troubleshooting

This release's compilers are older than RapidAPI's catalog: Python 3.8, Node 12, Java 13, Go 1.13 and TypeScript 3.7. Newer language features may not be supported. The integration keeps the same 12 editor languages but maps them to this release's IDs; `/languages` is the source of truth.

- Timeout from app server: check private IP, same VPC and TCP 2358 inbound source security group.
- Unauthorized: check matching token and copied backend integration.
- Internal Error / cgroup error: check cgroup mode after reboot, privileged container settings and worker logs. Do not disable the sandbox to fix execution.
- Invalid language ID: confirm `JUDGE0_MODE=self-hosted` and restart PM2.
- In Queue / Processing: inspect worker logs and database/Redis startup. Wait-mode requests still have the backend's 20-second timeout under load.
- Keep the runner's operating system and supporting Docker images patched; the published release includes old compiler runtimes. This walkthrough is a capstone starting point, not a certification of isolation against arbitrary hostile code.
- Stop runner: `sudo docker compose stop`. Restart: `sudo docker compose up -d`. Avoid `down -v`, which deletes Judge0's stored database volume.

## Sources

- https://github.com/judge0/judge0/blob/v1.13.1/CHANGELOG.md
- https://github.com/judge0/judge0/blob/v1.13.1/judge0.conf
- https://github.com/judge0/judge0/blob/v1.13.1/docker-compose.yml
- https://github.com/judge0/judge0/blob/v1.13.1/db/languages/active.rb
- https://docs.docker.com/engine/install/ubuntu/
