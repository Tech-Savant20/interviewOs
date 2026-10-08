import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import Signup from './Auth/Signup.jsx'

import Login from './Auth/Login.jsx'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainPage } from './HomePage/MainPage.jsx'
import ProfileSetup from './ProfileSetup/ProfileSetup.jsx'
import Dashboard from './Interviewer/Dashboard.jsx'
import AddPost from './Interviewer/AddPost.jsx'
import ApplyJob from './JobDetails/ApplyJob.jsx'
import Hero3D from './Interviewer/Hero3D.jsx'
import Profile from './Student/Profile.jsx'
import MyApplications from './Student/MyApplications.jsx'
import InterviewRoom from './Student/AiMockInterview.jsx'
import StudentMessageInbox from './Student/StudentMessageInbox.jsx'
import Lobby from './Interviewer/lobbyPage.jsx'
import VideoCall from './Interviewer/VideoCall.jsx'
import ApplicantFullDetail from './Interviewer/ApplicantFullDetail.jsx'
import OTPVerification from './Auth/OTPVerification.jsx'
import EditJob from './Interviewer/JobEdit.jsx';
import { PrivacyPolicy, TermsOfService } from './LegalPages.jsx';

function App() {
  const [count, setCount] = useState(0)

  return (
    <Routes>
      <Route path="/privacy" element={<PrivacyPolicy/>} />
      <Route path="/terms" element={<TermsOfService/>} />
      <Route path="/Signup" element={<Signup/>} />
      <Route path="/login" element={<Login/>} />
      <Route path="/profileSetup" element={<ProfileSetup/>}/>
      <Route path ="/" element={<MainPage/>}/>
      <Route path="/interviewer/dashboard" element={<Dashboard/>}/>
      <Route path="/interviewer/addPost" element={<AddPost/>}/>
      <Route path="/interviewer/hero3d" element={<Hero3D/>}/>
      <Route path="/job/apply/:jobId" element={<ApplyJob/>}/>
      <Route path="/profile/:Id" element={<Profile/>}/>
      <Route path ="/my-applications" element = {<MyApplications/>}/>
      <Route path="/interview-room/:userId" element={<InterviewRoom/>}/>
      <Route path="/student/messages/:userId" element={<StudentMessageInbox/>}/>
      <Route path="/video-meet/:student_id" element={<Lobby/>}/>
      <Route path="/call/:roomId" element={<VideoCall />} />
      <Route path="/applicant/:applicantId" element={<ApplicantFullDetail/>}/>
      <Route path="/otp-verification" element={<OTPVerification/>}/>
      <Route path="/interviewer/edit-job/:job_id" element={<EditJob/>}/>
    </Routes>
)
}

export default App
