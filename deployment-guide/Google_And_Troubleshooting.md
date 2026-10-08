# Google sign-in and deployment operations

Updated 9 October 2026. Live application: https://interviewos.duckdns.org. Commands run in EC2 SSH unless labeled Windows PowerShell. Never publish API keys, passwords, OTPs, OAuth secrets or SSH private keys.

## Google Auth Platform

1. Create/select a project in Google Cloud Console and open Google Auth Platform.
2. Configure Branding: app name InterviewOS, support/developer email abhyudaytomar1@gmail.com, and External audience.
3. Create a Web application OAuth client. JavaScript origin: `https://interviewos.duckdns.org`. Redirect URI: `https://interviewos.duckdns.org/auth/google/callback` (exact match).
4. Add the client ID, secret and redirect URI to Backend/.env. These are separate from JDoodle credentials.

```env
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI=https://interviewos.duckdns.org/auth/google/callback
```

```bash
pm2 restart interviewos-backend --update-env
pm2 save
```

5. Test Log in with Google. Verified email matches an existing account; new users receive a candidate account. The backend validates ID tokens and browser callback state. OAuth state cookies use SameSite=Lax for Google's top-level redirect.
6. To publish, complete Branding and save. Homepage: `https://interviewos.duckdns.org`; privacy: `https://interviewos.duckdns.org/privacy`; terms: `https://interviewos.duckdns.org/terms`. Enter a developer contact email. Leave the optional logo blank unless ready for branding verification. Resolve highlighted errors, then open Audience and publish.

Google sign-in uses only openid/email/profile. These are basic identity scopes, not Gmail/Drive access. Publishing and branding verification are separate. Keep authorized URLs consistent with the hostname accepted by Google; domain-verification requirements can apply.

References: [Google setup](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid), [OAuth web-server flow](https://developers.google.com/identity/protocols/oauth2/web-server).

## Missing OTP

Authorize your EC2 outbound IP in [Brevo Authorized IPs](https://app.brevo.com/security/authorised_ips), in the account owning the API key. Current Elastic IP: 13.206.13.11. Verify BREVO_SENDER_EMAIL there. Retry signup to request a new OTP after correcting delivery; old rejected emails are not resent.

```bash
pm2 logs interviewos-backend --lines 60 --nostream
```

Look for Brevo Error or Email sent successfully. The existing helper catches email failures, so a successful signup response alone is not proof of delivery. Redis OTPs and pending users expire after 10 minutes.

## Logged-in user redirected from AI interview

The earlier implementation interpreted every AI failure as a login failure. It has been fixed locally/deployed: only HTTP 401 redirects to login; provider errors display their message. The retired Llama model returned model_not_found even while /api/me returned 200.

```env
GROQ_MODEL=openai/gpt-oss-120b
```

Restart the backend after updating the setting. Rebuild/publish the frontend if deploying the request-handling fix. Model availability and quotas depend on the Groq account. [Groq model deprecations](https://console.groq.com/docs/deprecations).

## HTTPS and CORS

Frontend production build:

```env
VITE_API_URL=https://interviewos.duckdns.org
```

Backend:

```env
CLIENT_URL=https://interviewos.duckdns.org
CLIENT_ORIGINS=https://interviewos.duckdns.org
```

No trailing slash on the CORS origin. Rebuild the frontend after changing VITE_API_URL and restart PM2 after changing backend settings. Mixed-content errors indicate an HTTP API URL inside an HTTPS page. Not allowed by CORS indicates a backend origin mismatch.

## Nginx welcome page or wrong certificate site

Ensure the application configuration is enabled before running Certbot:

```bash
ls -l /etc/nginx/sites-enabled/
sudo ln -sfn /etc/nginx/sites-available/interviewos /etc/nginx/sites-enabled/interviewos
```

If the default-site symlink is present and unused, disable it with `sudo unlink /etc/nginx/sites-enabled/default`. Test with `sudo nginx -t`; reload only after success. If Certbot previously installed the certificate in default, rerun `sudo /snap/bin/certbot --nginx -d interviewos.duckdns.org` and choose reinstall existing certificate.

## Frontend heap limit

```bash
cd ~/interviewos/Forntend
NODE_OPTIONS="--max-old-space-size=1536" npm run build
```

Publish dist only after success. If it still fails, check `free -h` and `swapon --show` before allocating more memory. Bundle-size warnings are separate from build failures. Dependency audit findings also need separate review.

## Profile and pagination

New accounts need candidate profile details. The profile page offers Complete profile and routes to `/profileSetup`; choose Student and enter your own details. Do not seed fabricated personal data into a real account.

Job pagination uses the API totalPages, so six jobs at five per page yield two pages. Next is disabled on the last page; zero/one page hides pagination.

## Demo jobs

```bash
cd ~/interviewos/Backend
node scripts/seed-demo-jobs.js --dry-run
node scripts/seed-demo-jobs.js
```

This additive seed preserves existing data, skips existing demo jobs and clears only alljobs:* Redis cache entries. It creates a sample owner with an unknown random password and no verified login, six fictional job listings and skills. No emails are sent. Do not run Backend/db/seed.sql against production: it assumes fixed IDs and shared passwords.

## Camera and microphone

Open the HTTPS site in a browser, grant OS/browser camera access, and reset denied site permissions when needed. On Android, an overlay/floating-window app can prevent Chrome from requesting permissions; close it before retrying. Exact troubleshooting depends on the device and message. The service does not implement server-side interview recording. Two-participant video still needs testing across networks; restrictive networks may need TURN.

## Updates and repository synchronization

Some runtime fixes currently remain uncommitted despite being deployed by SCP. Commit/synchronize them before replacing EC2 source with a fresh checkout. The existing GitHub Actions workflows are not proven to deploy this new server and need path/API-URL/secrets/runner configuration changes. Keep secrets and private keys outside commits. PM2 startup commands depend on the Node version printed by pm2 startup; noninteractive SSH needs the Node binary directory on PATH.
