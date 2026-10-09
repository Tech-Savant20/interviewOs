import { Box, Container, Typography, Stack, Button, Card, CardContent, Chip, Accordion, AccordionSummary, AccordionDetails, CircularProgress } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Link as RouterLink, Navigate, useParams } from 'react-router-dom';
import Header from './HomePage/Header.jsx';
import Footer from './HomePage/Footer.jsx';
import { useAuth } from './AuthContext';

const articles = [
  { slug: 'prepare-for-your-first-technical-interview', category: 'Interview preparation', title: 'Prepare for your first technical interview', description: 'A practical plan for explaining your skills, solving problems and asking useful questions.', sections: [
    ['Start with the role', 'Read the job description and list its core skills. Choose two or three areas where you need practice. For a frontend role, that might include JavaScript fundamentals, React state and accessible interfaces.'],
    ['Practice explaining your thinking', 'Pick a small coding problem. Explain the inputs, expected output and approach before writing code. Test a normal case, an empty input and a boundary case. If you get stuck, describe what you know and the next thing you would check.'],
    ['Prepare a project story', 'Choose a project you understand well. Describe the problem, your own contribution, one difficult decision and how you tested the result. Be clear about team contributions and tools you used.'],
    ['Finish with a review', 'Write down what went well and what needs another attempt. AI feedback can suggest practice topics, but review its advice yourself. Improvement comes from repeated, focused practice.'],
  ] },
  { slug: 'turn-a-skill-gap-into-a-practice-plan', category: 'Skill building', title: 'Turn a skill gap into a practice plan', description: 'Use a target job to choose smaller, achievable practice goals.', sections: [
    ['Compare skills honestly', 'Keep your profile skills up to date and compare them with a target role. A matching label is a starting point, not proof of proficiency. Pick one missing skill that matters to the role.'],
    ['Make the goal concrete', 'Replace “learn SQL” with “write a JOIN across users and applications, explain the result and handle missing records.” A small task makes it easier to see progress.'],
    ['Combine reading and doing', 'Read a short explanation, implement an example, then explain it without looking at the reference. Use a mock question to check whether you can reason about the same idea in a different situation.'],
    ['Check progress over time', 'Keep notes on mistakes and revisit them after a few days. Practice scores are useful signals for preparation; they do not guarantee interview success or a hiring outcome.'],
  ] },
  { slug: 'check-camera-and-microphone-before-an-interview', category: 'Interview setup', title: 'Check your camera and microphone before an interview', description: 'A short browser and network checklist for a smoother video session.', sections: [
    ['Use the secure website', 'Open InterviewOS through its HTTPS address. Check camera and microphone permissions in your browser’s site settings. Permission names and settings vary between browsers and devices.'],
    ['Check your device', 'Close other apps using the camera, select the intended microphone and test your audio. On mobile, dismiss floating overlays if the browser says the site cannot ask for permission.'],
    ['Check network access', 'Some campus and office networks restrict websites or real-time connections. Test access before the interview and use an approved alternative connection if your network blocks the service.'],
    ['Have a backup plan', 'Agree with the other participant on how to reconnect or reschedule. Media reliability depends on both devices, browser permissions and network conditions.'],
  ] },
  { slug: 'write-a-clear-internship-application', category: 'Applications', title: 'Write a clear internship application', description: 'Show relevant project experience without overstating what you have done.', sections: [
    ['Match the opportunity', 'Read the role and highlight relevant coursework, projects and skills. Prefer one concrete example of your work over a long list of unrelated technologies.'],
    ['Describe your contribution', 'State what you implemented, why it mattered and how you checked it. For a team project, identify your responsibility and credit the other contributors.'],
    ['Review your resume', 'Check contact details, dates and links. Upload the intended version of your resume and avoid including unnecessary sensitive information.'],
    ['Use demo listings for practice', 'Listings marked Demo on this capstone website are fictional examples. Treat them as a way to explore the application workflow, rather than real employment opportunities.'],
  ] },
];

function PublicLayout({ title, subtitle, children }) {
  return <><Header/><Container component="main" maxWidth="lg" sx={{ py: { xs: 4, md: 7 }, minHeight: '65vh' }}>
    <Typography component="h1" variant="h3" fontWeight={800} sx={{ fontSize: { xs: '2rem', md: '3rem' }, mb: 2 }}>{title}</Typography>
    <Typography color="text.secondary" sx={{ maxWidth: 780, mb: 4, lineHeight: 1.8 }}>{subtitle}</Typography>
    {children}
  </Container><Footer/></>;
}

export function ProductsPage() {
  const { user } = useAuth();
  const features = [
    ['Find opportunities', 'Browse jobs and internships, filter results and explore role requirements.', '/jobs', 'Browse jobs'],
    ['Build your profile', 'Add your education, skills and resume so your application tells your story.', user ? '/profileSetup' : '/signup', user ? 'Set up profile' : 'Create an account'],
    ['Practice for a role', 'Use job-specific skill gaps and AI-assisted questions to focus your preparation.', user?.user?.user_id ? `/interview-room/${user.user.user_id}` : '/login', 'Start practicing'],
    ['Manage hiring', 'Recruiter accounts can post jobs, review applications and organize interviews.', '/dashboard', 'Open dashboard'],
    ['Explore interview tools', 'The project includes messaging, a shared code editor, execution and video interview tools.', '/help', 'Read the interview guide'],
    ['Learn and prepare', 'Read sample articles on applications, skill building and interview setup.', '/blog', 'Explore the blog'],
  ];
  return <PublicLayout title="Tools for your next interview" subtitle="InterviewOS brings applications, preparation and interview tools into one capstone project.">
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
      {features.map(([title, description, to, label]) => <Card key={title} variant="outlined"><CardContent sx={{ p: 3 }}>
        <Typography component="h2" variant="h5" fontWeight={700} gutterBottom>{title}</Typography><Typography sx={{ mb: 3, lineHeight: 1.7 }}>{description}</Typography>
        <Button component={RouterLink} to={to} variant="outlined">{label}</Button>
      </CardContent></Card>)}
    </Box>
  </PublicLayout>;
}

export function PricingPage() {
  return <PublicLayout title="Explore the capstone demo" subtitle="InterviewOS is an academic demonstration. There is currently no paid subscription or checkout on this website.">
    <Card variant="outlined" sx={{ maxWidth: 720 }}><CardContent sx={{ p: { xs: 3, md: 4 } }}>
      <Chip label="Academic demo" color="primary" sx={{ mb: 2 }}/><Typography component="h2" variant="h4" fontWeight={700}>No subscription fee</Typography>
      <Stack spacing={2} sx={{ my: 3 }}><Typography>Explore sample listings, build a profile and try interview preparation.</Typography><Typography>AI and code execution depend on shared provider allowances. Availability may vary, and usage limits apply.</Typography><Typography>Jobs marked Demo are fictional. This project does not guarantee employment or uninterrupted service.</Typography></Stack>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}><Button component={RouterLink} to="/signup" variant="contained">Create an account</Button><Button component={RouterLink} to="/jobs" variant="outlined">Browse demo jobs</Button></Stack>
    </CardContent></Card>
  </PublicLayout>;
}

export function BlogPage() {
  return <PublicLayout title="The InterviewOS blog" subtitle="Sample articles for the capstone demonstration: practical ideas for preparing, applying and getting your interview setup ready.">
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
      {articles.map(article => <Card component="article" variant="outlined" key={article.slug}><CardContent sx={{ p: 3 }}>
        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}><Chip label={article.category} size="small"/><Chip label="Sample article" size="small" variant="outlined"/></Stack>
        <Typography component="h2" variant="h5" fontWeight={700} gutterBottom>{article.title}</Typography><Typography sx={{ mb: 3, lineHeight: 1.7 }}>{article.description}</Typography>
        <Button component={RouterLink} to={`/blog/${article.slug}`} aria-label={`Read ${article.title}`}>Read article</Button>
      </CardContent></Card>)}
    </Box>
  </PublicLayout>;
}

export function BlogArticle() {
  const { slug } = useParams();
  const article = articles.find(item => item.slug === slug);
  if (!article) return <PublicLayout title="Article not found" subtitle="This article is unavailable. Explore the sample articles in our blog."><Button component={RouterLink} to="/blog" variant="contained">Back to the blog</Button></PublicLayout>;
  return <PublicLayout title={article.title} subtitle={article.description}>
    <Chip label="Sample article · InterviewOS capstone" variant="outlined" sx={{ mb: 3 }}/>
    <Box component="article" sx={{ maxWidth: 780 }}>{article.sections.map(([heading, body]) => <Box component="section" key={heading} sx={{ mb: 4 }}>
      <Typography component="h2" variant="h5" fontWeight={700} gutterBottom>{heading}</Typography><Typography sx={{ lineHeight: 1.9 }}>{body}</Typography>
    </Box>)}</Box><Button component={RouterLink} to="/blog" variant="outlined">Back to the blog</Button>
  </PublicLayout>;
}

export function HelpPage() {
  const faqs = [
    ['How do I get started?', 'Create an account or sign in with Google. Complete your profile, add your skills and browse the job listings. Jobs labeled Demo are fictional examples.'],
    ['Where is my verification email?', 'Check your spam folder and confirm that you entered the correct address. Email delivery depends on the mail provider. If it still does not arrive, contact the project operator using the email below.'],
    ['Why does my profile say it is missing?', 'A new account may not have a completed profile yet. Use the profile setup page to add your details before applying.'],
    ['How do mock interviews work?', 'Sign in and select Start Mock Interview. Choose a topic or job context, answer a generated question and review the feedback. AI output may be inaccurate; use it as a practice aid.'],
    ['Why did code execution or an AI request fail?', 'These features rely on external services with shared quotas. Check your connection, review the error message and try again later if the provider is unavailable. Compiler errors in the output mean your program needs attention.'],
    ['How do I allow my camera and microphone?', 'Use the HTTPS website and review camera and microphone permissions in your browser’s site settings. Close apps already using the camera. On mobile, dismiss overlays if they block the permission prompt.'],
    ['Why can’t I access the site on a college network?', 'Some networks restrict websites or real-time traffic. Check with your network administrator or use an approved alternative connection.'],
    ['Where do I find my dashboard?', 'The dashboard link opens the recruiter dashboard for interviewer accounts and the profile page for candidate accounts. You must sign in first.'],
  ];
  return <PublicLayout title="Help & frequently asked questions" subtitle="Find your way around the project and troubleshoot common account and interview issues.">
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}><Button component={RouterLink} to="/profileSetup" variant="outlined">Complete profile</Button><Button component={RouterLink} to="/jobs" variant="outlined">Browse jobs</Button><Button component={RouterLink} to="/dashboard" variant="outlined">Open dashboard</Button></Stack>
    {faqs.map(([question, answer]) => <Accordion key={question} disableGutters elevation={0} sx={{ border: '1px solid #e2e8f0', mb: 1 }}><AccordionSummary expandIcon={<ExpandMoreIcon/>}><Typography component="h2" fontWeight={600}>{question}</Typography></AccordionSummary><AccordionDetails><Typography sx={{ lineHeight: 1.8 }}>{answer}</Typography></AccordionDetails></Accordion>)}
    <Typography sx={{ mt: 4 }}>Still need help? <Box component="a" href="mailto:abhyudaytomar1@gmail.com">Email the project operator</Box>.</Typography>
  </PublicLayout>;
}

export function DashboardEntry() {
  const { user, loading } = useAuth();
  if (loading) return <Box sx={{ p: 5, textAlign: 'center' }}><CircularProgress aria-label="Loading account"/></Box>;
  if (!user?.user?.user_id) return <Navigate to="/login" replace/>;
  return <Navigate to={user.user.role === 'interviewer' ? '/interviewer/dashboard' : `/profile/${user.user.user_id}`} replace/>;
}
