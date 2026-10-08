# InterviewOS frontend

React 19, Vite 7, Material UI, React Router, Monaco, Socket.IO and WebRTC. This directory is spelled `Forntend`.

## Development

Start the API on port 5000, then run:

```bash
npm ci
npm run dev
```

The development environment uses an empty VITE_API_URL so Vite proxies `/api`, `/auth`, `/uploads` and `/socket.io`. Set BACKEND_URL if the development API runs elsewhere.

## Production

Create `.env.production`:

```env
VITE_API_URL=https://interviewos.duckdns.org
```

Use the same HTTPS origin as backend CORS. Provider keys belong only in the backend.

```bash
npm ci
NODE_OPTIONS="--max-old-space-size=1536" npm run build
```

The larger heap was needed on the 2 GB EC2 instance. After a successful build, copy `dist/.` to `/var/www/interviewos/`. Nginx needs an index.html fallback for React routes and proxies for API, Google callback and Socket.IO. Do not publish a failed build.

## Current behavior

- Pagination follows the API's totalPages and hides for zero or one page.
- Missing profiles offer a setup button linking to `/profileSetup`.
- AI provider errors display a message; only HTTP 401 redirects to login.
- Google login/signup links to `/auth/google`.
- Public `/privacy` and `/terms` pages are linked in the footer.

## Checks

```bash
node --test tests/interviewRequest.test.js
npm run build
```

In PowerShell use npm.cmd if npm.ps1 is blocked. See the [main README](../README.md) and [deployment guide](../deployment-guide/InterviewOS_AWS_JDoodle_Deployment_Guide.md).
