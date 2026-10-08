# Enable JDoodle on InterviewOS

JDoodle support is deployed on the AWS application and a live Python execution has been verified. Some local runtime changes still need to be committed to GitHub. Existing Judge0 modes remain available. No new npm dependency or frontend build is needed specifically for the JDoodle adapter.

## Copy the changed runtime files

In Windows PowerShell:

```powershell
Set-Location "C:\Users\abhyu\Desktop\projects\capstone project"
scp -i "C:\Users\abhyu\Downloads\interviewos-key.pem" Backend/controllers/codeExecution.js ubuntu@13.206.13.11:~/interviewos/Backend/controllers/
scp -i "C:\Users\abhyu\Downloads\interviewos-key.pem" Backend/utils/jdoodle.js Backend/utils/judge0Config.js ubuntu@13.206.13.11:~/interviewos/Backend/utils/
```

The destination folders must exist. Adjust the path/IP if your EC2 clone or Elastic IP changed. `judge0Config.js` is required because the controller imports both provider adapters even when JDoodle is selected. Keep these changes in your repository before pulling future updates.

## Configure the app server

SSH into your existing AWS application server:

```powershell
ssh -i "C:\Users\abhyu\Downloads\interviewos-key.pem" ubuntu@13.206.13.11
```

On EC2:

```bash
cd ~/interviewos/Backend
nano .env
```

Add or replace these entries, without duplicate keys:

```env
CODE_EXECUTION_PROVIDER=jdoodle
JDOODLE_CLIENT_ID=YOUR_CLIENT_ID
JDOODLE_CLIENT_SECRET=YOUR_CLIENT_SECRET
```

Keep all database, Redis, Groq, Brevo and S3 settings. Judge0 settings are ignored while JDoodle is selected. Do not put JDoodle credentials in `Forntend/.env.production`, screenshots or GitHub.

```bash
chmod 600 .env
node --check controllers/codeExecution.js
node --check utils/jdoodle.js
pm2 restart interviewos-backend --update-env
```

If the application has not been started yet, run `pm2 start app.js --name interviewos-backend` from Backend instead.

## Live verification

From a logged-in interview room, select Python and run:

```python
print("JDoodle is connected!")
```

Then test standard input (`print(input())`), a syntax error, and JavaScript or C++. Each execution uses your API allowance; do not use repeated live runs merely to test the integration.

JDoodle combines program output and compiler diagnostics in `output`. HTTP/statusCode 200 means the request worked, not that the submitted code passed. The editor therefore labels results `Execution finished (see output)` and preserves all diagnostics. The provider does not supply Judge0's detailed verdict IDs.

The free Compiler API documentation lists 20 credits per day, with one ordinary execution per credit. That allowance is shared by all users of this application. Both HTTP and JSON quota responses show a clear quota message. Invalid provider credentials produce a service error without returning the provider response or credentials.

The local test suite uses mocked API calls. Live Python execution was verified through the authenticated backend. Quotas and other language versions still depend on the provider account.

## Copy the matching tests when transferring runtime files

Old tests inherited CODE_EXECUTION_PROVIDER from the production .env and mocked Judge0 responses even when JDoodle was selected. Copy the updated tests too:

```powershell
scp -i "C:\Users\abhyu\Downloads\interviewos-key.pem" Backend/tests/codeExecution.test.js Backend/tests/jdoodle.test.js Backend/tests/judge0Config.test.js ubuntu@13.206.13.11:~/interviewos/Backend/tests/
```

Run `npm test` from Backend on EC2. Updated tests isolate provider configuration and do not consume live credits. Never change the production provider just to make old tests pass.

Sources:
- https://www.jdoodle.com/docs/api/rest
- https://www.jdoodle.com/docs/api/languages
- https://www.jdoodle.com/docs/api/errors
- https://www.jdoodle.com/docs/api/credits
