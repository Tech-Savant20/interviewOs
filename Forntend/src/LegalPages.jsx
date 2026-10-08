import { Box, Link, Stack, Typography } from "@mui/material";

const contact = "abhyudaytomar1@gmail.com";

function PolicyPage({ title, sections }) {
  return (
    <Box component="main" sx={{ maxWidth: 860, mx: "auto", p: { xs: 3, md: 5 }, color: "#172033", bgcolor: "#fff" }}>
      <Link href="/">InterviewOS home</Link>
      <Typography component="h1" variant="h3" sx={{ mt: 3, mb: 1 }}>{title}</Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>Last updated: 9 October 2026</Typography>
      {sections.map(([heading, paragraphs]) => (
        <Box component="section" key={heading} sx={{ mb: 3 }}>
          <Typography component="h2" variant="h5" sx={{ mb: 1 }}>{heading}</Typography>
          {paragraphs.map(text => <Typography component="p" key={text} sx={{ mb: 1.5, lineHeight: 1.8 }}>{text}</Typography>)}
        </Box>
      ))}
      <Typography>Questions or requests: <Link href={`mailto:${contact}`}>{contact}</Link></Typography>
      <Stack component="nav" direction="row" spacing={3} sx={{ mt: 4 }}>
        <Link href="/privacy">Privacy policy</Link>
        <Link href="/terms">Terms of service</Link>
      </Stack>
    </Box>
  );
}

export function PrivacyPolicy() {
  return <PolicyPage title="Privacy Policy" sections={[
    ["About InterviewOS", ["InterviewOS is operated by Abhyuday Tomar as an interview practice and hiring project. This policy explains how the service handles information when you use interviewos.duckdns.org."]],
    ["Information we collect", ["Account information includes your username, email address, account role and verification status. Passwords entered during registration are stored as hashes.", "If you sign in with Google, we request basic identity information using the openid, email and profile scopes. We use your verified email address to create or match your InterviewOS account. We do not request access to Gmail, Google Drive or Google Calendar.", "You may provide profile details, education, skills, phone number, professional links, resumes, job listings, applications, interview schedules and chat messages. Practice answers, scores and AI feedback may be saved to show your progress. Technical information may appear in server and service logs, including request information and errors."]],
    ["How we use information", ["We use this information to authenticate accounts, verify email addresses, display profiles and opportunities, process applications, support interviews and messaging, generate AI questions and feedback, deliver service emails and troubleshoot the service."]],
    ["Who receives information", ["Recruiters and interviewers can receive information you submit through job applications, including your contact details and resume. Chat recipients receive messages you send them.", "AWS hosts the application and database and stores uploaded resumes. Brevo processes service emails. Groq processes prompts, practice answers and code submitted for AI review. JDoodle processes code and standard input submitted for execution. Google processes Google sign-in. These services may process information outside your country under their own policies. Do not submit passwords, API keys or other secrets in code, prompts or messages."]],
    ["Camera, microphone and voice features", ["Interview features may request camera or microphone permission. Video interviews use WebRTC to transmit media to the other participant. This version does not implement server-side recording of interview audio or video. Browser speech recognition, when enabled, may process audio through the browser provider's service. You can revoke permissions in your browser or device settings."]],
    ["Cookies and temporary storage", ["We use an authentication cookie to maintain your login and a temporary cookie to protect Google sign-in. Redis stores temporary email-verification data, job-listing caches and background email tasks. Browser storage may hold information needed for the signup flow. Authentication cookies are required for signed-in features."]],
    ["Retention and your requests", ["Account and activity records remain stored until removed through maintenance or a request we can fulfill. We have not implemented a fixed automatic deletion period for all records. Contact us to request access, correction or deletion of your account information. We may need to verify your identity. Copies may remain in backups or with recipients who already received your information."]],
    ["Security and updates", ["The service uses HTTPS, hashed passwords and access controls. No service can guarantee absolute security. We may update this policy as the project changes; the date above identifies the current version."]],
  ]} />;
}

export function TermsOfService() {
  return <PolicyPage title="Terms of Service" sections={[
    ["Using InterviewOS", ["InterviewOS is an interview practice and hiring project operated by Abhyuday Tomar. By using the service, you agree to these terms. If you do not agree, stop using the service."]],
    ["Accounts and responsibility", ["Provide accurate account information and keep your credentials private. You are responsible for activity under your account. Use the service only if you can agree to these terms under the rules that apply to you."]],
    ["Profiles, applications and demo listings", ["You are responsible for the information, resumes, listings and messages you submit and for having permission to share them. Applying to a job shares your application with its recruiter. Listings labeled Demo are fictional examples, not real vacancies. Salary amounts on demo listings are illustrative."]],
    ["Acceptable use", ["Do not harass others, impersonate people, upload malicious files, submit malware for execution, attempt unauthorized access or abuse service limits. Do not use the service to share content you have no right to distribute. Access may be restricted to address abuse or operational problems."]],
    ["AI and code execution", ["AI questions, feedback and scores may be inaccurate and are practice aids. They are not a guarantee of skill, employment or a hiring outcome. You should review outputs before relying on them. Code execution and AI services have provider limits and may be unavailable or change over time."]],
    ["Interviews and communication", ["Participants must obtain any consent required for sharing personal information or capturing an interview. The current service does not provide server-side video recording. Camera and microphone access depend on browser permissions and network conditions."]],
    ["Availability and third-party services", ["This project is provided as available without a promise of uninterrupted service. Features may change, fail or be discontinued. Google, AWS, Brevo, Groq and JDoodle provide parts of the service and may have their own terms. To the extent permitted by applicable law, we do not guarantee the accuracy of listings, AI outputs or user content. Nothing here excludes rights that cannot lawfully be excluded."]],
    ["Privacy, requests and changes", ["Our Privacy Policy describes the information used by the service. Contact us about account deletion, problems or questions. We may update these terms as the project changes; continued use after an update means you accept the updated terms."]],
  ]} />;
}
