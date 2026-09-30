import { API_URL } from "../config.js";
import React, { useEffect, useRef, useState } from "react";

import { useNavigate, useSearchParams } from "react-router-dom";

export default function InterviewRoom() {
  // Set when the candidate starts from "Prepare with AI" on one of their applications
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get("jobId");
  const [prep, setPrep] = useState(null);
  const [started, setStarted] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState("React");
  const [selectedLevel, setSelectedLevel] = useState("Easy");

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const debounceRef = useRef(null);
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const questionRef = useRef("");
  const askedQuestionsRef = useRef([]);

  const navigate = useNavigate();

  // Job-targeted prep: topics come from the job's skills (gaps first), difficulty from its experience
  useEffect(() => {
    if (!jobId) return;
    const loadPrep = async () => {
      try {
        const res = await fetch(`${API_URL}/api/prep/job/${jobId}`, { credentials: "include" });
        const data = await res.json();
        if (!data.success) return;
        setPrep(data);
        if (data.suggestedTopics.length > 0) setSelectedTopic(data.suggestedTopics[0]);
        setSelectedLevel(data.level);
      } catch (err) {
        console.log("Prep load error:", err);
      }
    };
    loadPrep();
  }, [jobId]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      clearTimeout(debounceRef.current);
      if (recognitionRef.current) {
        isListeningRef.current = false;
        recognitionRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const speakText = (text, onEndCallback) => {
    if (!text) return;
    const synth = window.speechSynthesis;
    if (!synth) { alert("Text to speech is not supported in this browser."); return; }
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    const setVoiceAndSpeak = () => {
      const voices = synth.getVoices();
      const englishVoice = voices.find((v) => v.lang === "en-US") || voices.find((v) => v.lang.startsWith("en"));
      if (englishVoice) utterance.voice = englishVoice;
      utterance.onstart = () => console.log("🔊 Speaking started");
      utterance.onend = () => { console.log("✅ Speaking ended"); if (onEndCallback) onEndCallback(); };
      utterance.onerror = (e) => { console.log("❌ Speech error:", e); if (onEndCallback) onEndCallback(); };
      synth.speak(utterance);
    };
    if (synth.getVoices().length > 0) setVoiceAndSpeak();
    else synth.onvoiceschanged = setVoiceAndSpeak;
  };

  const setupRecognition = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Speech recognition is not supported. Please use Chrome or Edge."); return null; }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onresult = (event) => {
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalText += event.results[i][0].transcript;
      }
      if (finalText.trim()) {
        setAnswer((prev) => {
          const updatedAnswer = `${prev} ${finalText.trim()}`.trim();
          clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => { submitAnswer(updatedAnswer); }, 10000);
          return updatedAnswer;
        });
      }
    };
    rec.onerror = (e) => { console.log("Speech recognition error:", e.error); };
    rec.onend = () => {
      if (isListeningRef.current) {
        try { rec.start(); } catch (err) { console.log("Recognition restart error:", err); }
      }
    };
    return rec;
  };

  const toggleMic = () => {
    if (!isListeningRef.current) {
      if (!recognitionRef.current) recognitionRef.current = setupRecognition();
      if (!recognitionRef.current) return;
      try { isListeningRef.current = true; setIsListening(true); recognitionRef.current.start(); }
      catch (err) { console.log("Mic start error:", err); }
    } else {
      isListeningRef.current = false;
      setIsListening(false);
      recognitionRef.current?.stop();
    }
  };

  const getQuestion = async () => {
    try {
      setLoading(true);
      setFeedback("");
      setScore(null);
      setAnswer("");
      const res = await fetch(`${API_URL}/api/ai/interview-questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          topic: selectedTopic,
          level: selectedLevel,
          previousQuestions: askedQuestionsRef.current,
          role: prep ? `${prep.job.job_name} at ${prep.job.company}` : undefined,
        }),
      });
      const data = await res.json();

      console.log("Question API response:", data);

      if (data.success) {
        const aiQuestion = data.question || data.answer || data.message || "";
        if (!aiQuestion) { alert("Question not found in backend response."); return; }
        setQuestion(aiQuestion);
        questionRef.current = aiQuestion;
        askedQuestionsRef.current.push(aiQuestion);
        setTimeout(() => { speakText(aiQuestion); }, 300);
      } else {
        alert("Please log in to take the mock interview.");
        navigate("/login");
      }
    } catch (err) { console.log("Question error:", err); alert("Failed to fetch question from backend."); }
    finally { setLoading(false); }
  };

  const submitAnswer = async (studentAnswer) => {
    if (!studentAnswer.trim()) return;
    if (!questionRef.current) return;
    try {
      setLoading(true);
      if (recognitionRef.current) { isListeningRef.current = false; setIsListening(false); recognitionRef.current.stop(); }
      const res = await fetch(`${API_URL}/api/ai/evaluate-answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          question: questionRef.current,
          answer: studentAnswer,
          topic: selectedTopic,
          level: selectedLevel,
          jobId: prep ? prep.job.job_id : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const aiFeedback = data.feedback || data.answer || data.message || "";
        const aiScore = data.score ?? null;
        setFeedback(aiFeedback);
        setScore(aiScore);
        const textToSpeak = `Your answer evaluation is: ${aiFeedback}. ${aiScore !== null ? `Your score is ${aiScore} out of 10.` : ""} Now moving to the next question.`;
        speakText(textToSpeak, () => { setTimeout(() => { getQuestion(); }, 800); });
      } else { alert(data.message || "Failed to evaluate answer."); }
    } catch (err) { console.log("Answer submit error:", err); alert("Failed to submit answer."); }
    finally { setLoading(false); }
  };

  const handleAnswerChange = (e) => {
    const value = e.target.value;
    setAnswer(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { submitAnswer(value); }, 10000);
  };

  const startInterview = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      setStarted(true);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
      getQuestion();
    } catch (err) { alert(`${err.name}: ${err.message}`); }
  };

  const endInterview = () => {
    window.speechSynthesis?.cancel();
    if (recognitionRef.current) { isListeningRef.current = false; recognitionRef.current.stop(); recognitionRef.current = null; }
    clearTimeout(debounceRef.current);
    setIsListening(false);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStarted(false);
    setQuestion("");
    setAnswer("");
    setFeedback("");
    setScore(null);
    questionRef.current = "";
    askedQuestionsRef.current = [];
  };

  // ── TOPICS & LEVELS DATA ────────────────────────────────
  const topics = [
    { id: "React", icon: "⚛️", desc: "Hooks, state, lifecycle" },
    { id: "JavaScript", icon: "🟨", desc: "ES6+, async, closures" },
    { id: "Node.js", icon: "🟩", desc: "APIs, streams, modules" },
    { id: "System Design", icon: "🏗️", desc: "Scale & architecture" },
    { id: "DSA", icon: "🧩", desc: "Arrays, trees, graphs" },
    { id: "Database", icon: "🗄️", desc: "SQL, NoSQL, queries" },
  ];

  const jobTopics = prep
    ? prep.suggestedTopics.map((skill) => {
      const gap = prep.missing.includes(skill);
      return { id: skill, icon: gap ? "🎯" : "✅", desc: gap ? "Skill gap: not on your profile" : "Already on your profile" };
    })
    : [];
  const shownTopics = jobTopics.length > 0 ? jobTopics : topics;

  const levels = [
    { id: "Easy", color: "#16a34a", bg: "rgba(22,163,74,0.12)", border: "rgba(22,163,74,0.4)" },
    { id: "Medium", color: "#d97706", bg: "rgba(217,119,6,0.12)", border: "rgba(217,119,6,0.4)" },
    { id: "Hard", color: "#dc2626", bg: "rgba(220,38,38,0.12)", border: "rgba(220,38,38,0.4)" },
  ];

  // ── RENDER ──────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@600&display=swap');

        .ir-wrap * { box-sizing: border-box; }

        .ir-wrap {
          min-height: 100vh;
          background: #0f1117;
          font-family: 'DM Sans', sans-serif;
          color: #f1f5f9;
          padding: 24px 20px;
        }

        /* ── LANDING ── */
        .ir-landing {
          max-width: 680px;
          margin: 0 auto;
          padding-top: 32px;
        }

        .ir-badge {
          display: inline-block;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #ef4444;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 20px;
          padding: 4px 12px;
          margin-bottom: 20px;
        }

        .ir-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(26px, 5vw, 38px);
          font-weight: 600;
          color: #f1f5f9;
          margin-bottom: 8px;
          line-height: 1.2;
        }

        .ir-subtitle {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 36px;
          line-height: 1.6;
        }

        /* ── JOB PREP CARD ── */
        .ir-prep-card {
          display: flex;
          flex-wrap: wrap;
          gap: 16px 28px;
          background: #1a1d27;
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 14px;
          padding: 16px 18px;
          margin: -12px 0 28px;
        }
        .ir-prep-stat { display: flex; flex-direction: column; }
        .ir-prep-value { font-size: 24px; font-weight: 600; color: #f1f5f9; }
        .ir-prep-value small { font-size: 13px; color: #64748b; }
        .ir-prep-label { font-size: 12px; color: #64748b; }
        .ir-prep-gap { flex-basis: 100%; font-size: 13px; color: #94a3b8; }
        .ir-prep-gap strong { color: #fca5a5; }

        /* ── SECTION LABEL ── */
        .ir-section-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #475569;
          margin-bottom: 12px;
        }

        /* ── TOPIC GRID ── */
        .ir-topic-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 28px;
        }

        @media (max-width: 480px) {
          .ir-topic-grid { grid-template-columns: repeat(2, 1fr); }
        }

        .ir-topic-card {
          background: #1a1d27;
          border: 1.5px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          padding: 14px 12px;
          cursor: pointer;
          transition: all 0.18s ease;
          position: relative;
          overflow: hidden;
          text-align: left;
        }

        .ir-topic-card:hover {
          border-color: rgba(239,68,68,0.35);
          background: #1e2130;
          transform: translateY(-2px);
        }

        .ir-topic-card.active {
          border-color: #ef4444;
          background: rgba(239,68,68,0.08);
        }

        .ir-topic-card.active::after {
          content: '✓';
          position: absolute;
          top: 8px;
          right: 10px;
          font-size: 12px;
          color: #ef4444;
          font-weight: 700;
        }

        .ir-topic-icon { font-size: 20px; margin-bottom: 8px; display: block; }
        .ir-topic-name { font-size: 13px; font-weight: 600; color: #f1f5f9; display: block; margin-bottom: 2px; }
        .ir-topic-desc { font-size: 11px; color: #64748b; display: block; }

        /* ── LEVEL PILLS ── */
        .ir-level-row {
          display: flex;
          gap: 8px;
          margin-bottom: 36px;
          flex-wrap: wrap;
        }

        .ir-level-btn {
          padding: 7px 20px;
          border-radius: 20px;
          border: 1.5px solid rgba(255,255,255,0.1);
          background: transparent;
          color: #94a3b8;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }

        /* ── START BUTTON ── */
        .ir-start-btn {
          width: 100%;
          padding: 16px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          letter-spacing: 0.01em;
          box-shadow: 0 4px 24px rgba(239,68,68,0.3);
        }

        .ir-start-btn:hover {
          background: #dc2626;
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(239,68,68,0.4);
        }

        .ir-start-btn:active { transform: translateY(0); }

        .ir-start-meta {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          margin-top: 16px;
        }

        .ir-meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #475569;
        }

        /* ── INTERVIEW ROOM ── */
        .ir-room { max-width: 900px; margin: 0 auto; }

        .ir-room-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .ir-room-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ir-rec-dot {
          width: 8px; height: 8px;
          background: #ef4444;
          border-radius: 50%;
          animation: ir-pulse 1.4s infinite;
        }

        @keyframes ir-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }

        .ir-room-badge {
          font-size: 11px;
          padding: 3px 10px;
          background: rgba(239,68,68,0.1);
          color: #ef4444;
          border-radius: 20px;
          font-weight: 600;
          border: 1px solid rgba(239,68,68,0.2);
        }

        .ir-end-btn {
          padding: 8px 18px;
          background: transparent;
          border: 1.5px solid rgba(239,68,68,0.35);
          color: #ef4444;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.15s;
        }

        .ir-end-btn:hover { background: rgba(239,68,68,0.08); }

        /* ── VIDEO GRID ── */
        .ir-video-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 16px;
        }

        @media (max-width: 580px) {
          .ir-video-grid { grid-template-columns: 1fr; }
        }

        .ir-ai-panel {
          background: linear-gradient(135deg, #0f1117 0%, #1a1d27 100%);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 28px 20px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 12px;
          min-height: 220px;
          position: relative;
        }

        .ir-ai-avatar {
          width: 52px; height: 52px;
          border-radius: 50%;
          background: rgba(239,68,68,0.1);
          border: 2px solid #ef4444;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          margin-bottom: 4px;
        }

        .ir-ai-name { font-size: 11px; color: #475569; font-weight: 500; }

        .ir-question-text {
          color: #94a3b8;
          text-align: center;
          font-size: 14px;
          line-height: 1.7;
          max-width: 300px;
        }

        .ir-speak-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          background: rgba(37,99,235,0.15);
          border: 1px solid rgba(37,99,235,0.3);
          color: #60a5fa;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.15s;
          margin-top: 4px;
        }

        .ir-speak-btn:hover { background: rgba(37,99,235,0.25); }

        .ir-student-panel {
          background: #111827;
          border-radius: 16px;
          overflow: hidden;
          position: relative;
          min-height: 220px;
          border: 1px solid rgba(255,255,255,0.07);
        }

        .ir-student-panel video {
          width: 100%; height: 100%; object-fit: cover; display: block;
        }

        .ir-video-label {
          position: absolute;
          bottom: 10px;
          left: 10px;
          background: rgba(0,0,0,0.65);
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          color: white;
          backdrop-filter: blur(4px);
        }

        /* ── ANSWER BOX ── */
        .ir-answer-box {
          background: #1a1d27;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 20px;
          color: white;
        }

        .ir-answer-label {
          font-size: 13px;
          font-weight: 600;
          color: #94a3b8;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: 11px;
        }

        .ir-mic-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border: none;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.15s;
          margin-bottom: 12px;
        }

        .ir-mic-btn.off { background: #22263a; color: #94a3b8; }
        .ir-mic-btn.on { background: rgba(22,163,74,0.15); color: #4ade80; border: 1px solid rgba(22,163,74,0.3); }

        .ir-textarea {
          width: 100%;
          min-height: 110px;
          padding: 12px 14px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.08);
          outline: none;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          background: #0f1117;
          color: white;
          resize: vertical;
          line-height: 1.6;
          transition: border-color 0.15s;
        }

        .ir-textarea:focus { border-color: rgba(239,68,68,0.35); }
        .ir-textarea::placeholder { color: #374151; }

        /* ── FEEDBACK ── */
        .ir-feedback-box {
          margin-top: 16px;
          background: #0f1117;
          border: 1px solid rgba(255,255,255,0.06);
          padding: 16px;
          border-radius: 12px;
        }

        .ir-feedback-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #ef4444;
          margin-bottom: 8px;
        }

        .ir-feedback-text {
          color: #94a3b8;
          line-height: 1.7;
          margin-bottom: 12px;
          font-size: 14px;
        }

        .ir-score-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
        }

        .ir-score-badge {
          font-size: 18px;
          font-weight: 700;
          color: #f1f5f9;
        }

        .ir-score-label { font-size: 13px; color: #475569; }

        .ir-next-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.15s;
        }

        .ir-next-btn:hover { background: #dc2626; }
      `}</style>

      <div className="ir-wrap">
        {!started ? (
          /* ══ LANDING PAGE ══════════════════════════════════ */
          <div className="ir-landing">
            <div className="ir-badge">🎙️ AI Interview Suite</div>
            {prep ? (
              <>
                <h1 className="ir-title">Prepare for<br />{prep.job.job_name}</h1>
                <p className="ir-subtitle">
                  Questions are tailored to {prep.job.company}'s required skills, starting with the ones
                  missing from your profile. Your scores are shared with the recruiter as a readiness signal.
                </p>
                <div className="ir-prep-card">
                  <div className="ir-prep-stat">
                    <span className="ir-prep-value">{prep.matchPercent}%</span>
                    <span className="ir-prep-label">skill match</span>
                  </div>
                  <div className="ir-prep-stat">
                    <span className="ir-prep-value">
                      {prep.readiness.averageScore ?? "–"}{prep.readiness.averageScore !== null && <small>/10</small>}
                    </span>
                    <span className="ir-prep-label">practice score · {prep.readiness.attempts} answers</span>
                  </div>
                  <div className="ir-prep-gap">
                    {prep.missing.length > 0
                      ? <>Skill gaps: <strong>{prep.missing.join(", ")}</strong></>
                      : "You list every skill this job asks for."}
                  </div>
                </div>
              </>
            ) : (
              <>
                <h1 className="ir-title">Practice your next<br />technical interview</h1>
                <p className="ir-subtitle">
                  Choose a topic and difficulty — the AI will ask questions,<br />
                  listen to your answers, and give real-time feedback.
                </p>
              </>
            )}

            {/* Topic */}
            <div className="ir-section-label">{prep ? "Job skills to practise" : "Choose Topic"}</div>
            <div className="ir-topic-grid">
              {shownTopics.map((t) => (
                <div
                  key={t.id}
                  className={`ir-topic-card ${selectedTopic === t.id ? "active" : ""}`}
                  onClick={() => setSelectedTopic(t.id)}
                >
                  <span className="ir-topic-icon">{t.icon}</span>
                  <span className="ir-topic-name">{t.id}</span>
                  <span className="ir-topic-desc">{t.desc}</span>
                </div>
              ))}
            </div>

            {/* Level */}
            <div className="ir-section-label">Difficulty</div>
            <div className="ir-level-row">
              {levels.map((l) => (
                <button
                  key={l.id}
                  className="ir-level-btn"
                  onClick={() => setSelectedLevel(l.id)}
                  style={
                    selectedLevel === l.id
                      ? { background: l.bg, borderColor: l.border, color: l.color }
                      : {}
                  }
                >
                  {l.id}
                </button>
              ))}
            </div>

            {/* Start */}
            <button className="ir-start-btn" onClick={startInterview}>
              <span>🎙️</span>
              Start Interview — {selectedTopic} · {selectedLevel}
            </button>

            <div className="ir-start-meta">
              <div className="ir-meta-item"><span>📷</span> Camera required</div>
              <div className="ir-meta-item"><span>🎤</span> Mic optional</div>
              <div className="ir-meta-item"><span>🔊</span> Audio feedback</div>
            </div>
          </div>
        ) : (
          /* ══ INTERVIEW ROOM ════════════════════════════════ */
          <div className="ir-room">
            {/* Header */}
            <div className="ir-room-header">
              <div className="ir-room-title-row">
                <div className="ir-rec-dot" />
                <span style={{ fontSize: 14, fontWeight: 500 }}>Live Interview</span>
                <span className="ir-room-badge">{selectedTopic} · {selectedLevel}</span>
              </div>
              <button className="ir-end-btn" onClick={endInterview}>
                End Session
              </button>
            </div>

            {/* Videos */}
            <div className="ir-video-grid">
              <div className="ir-ai-panel">
                <div className="ir-ai-avatar">🤖</div>
                <span className="ir-ai-name">AI INTERVIEWER</span>
                <p className="ir-question-text">
                  {loading && !question ? "Thinking..." : question || "Question loading..."}
                </p>
                {question && (
                  <button className="ir-speak-btn" onClick={() => speakText(question)}>
                    🔊 Repeat Question
                  </button>
                )}
              </div>

              <div className="ir-student-panel">
                <video ref={videoRef} autoPlay muted playsInline />
                <div className="ir-video-label">You</div>
              </div>
            </div>

            {/* Answer */}
            <div className="ir-answer-box">
              <div className="ir-answer-label">Your Answer</div>

              <button
                className={`ir-mic-btn ${isListening ? "on" : "off"}`}
                onClick={toggleMic}
              >
                <span>{isListening ? "🔴" : "🎤"}</span>
                {isListening ? "Listening… tap to stop" : "Speak Answer"}
              </button>

              <textarea
                className="ir-textarea"
                value={answer}
                onChange={handleAnswerChange}
                placeholder="Type your answer, or tap 'Speak Answer' to use your mic…"
              />

              {feedback && (
                <div className="ir-feedback-box">
                  <div className="ir-feedback-label">Feedback</div>
                  <p className="ir-feedback-text">{feedback}</p>
                  {score !== null && (
                    <div className="ir-score-row">
                      <span className="ir-score-badge">{score}/10</span>
                      <span className="ir-score-label">Score</span>
                    </div>
                  )}
                  <button className="ir-next-btn" onClick={getQuestion}>
                    Next Question →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
