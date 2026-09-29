import { API_URL } from "../config.js";
import {
  Box,
  Typography,
  Paper,
  Chip,
  Avatar,
  Button,
  Divider,
  TextField,
  InputAdornment,
} from "@mui/material";

import {
  CalendarMonth,
  AccessTime,
  Business,
  VideoCall,
  CheckCircle,
  Cancel,
} from "@mui/icons-material";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const BASE = API_URL;

export default function ScheduledInterview({ setActiveView }) {
  const [interviews, setInterviews] = useState([]);
  const navigate = useNavigate();

  const fetchInterviews = async () => {
    try {
      const res  = await fetch(`${BASE}/api/getScheduledInterviews`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      setInterviews(data.interviews || []);
    } catch (error) {
      console.error("Error fetching interviews:", error);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  /* ── Join ── */
  const handleJoinInterview = (student_id) => {  // ← fixed: removed stray }; below
    navigate(`/video-meet/${student_id}`);
  };

  /* ── Reschedule ── */
  const handleReschedule = async (app_id, student_id, interviewDate) => {
    try {
      const response = await fetch(`${BASE}/api/schedule-interview`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          application_id: app_id,
          student_id:student_id,
          interview_date: interviewDate,
          status: "interview_scheduled",
        }),
      });
      const res = await response.json();
      if (res.success) {
        alert("Interview rescheduled successfully");
        fetchInterviews();
      } else {
        alert(res.message || "Failed to reschedule");
      }
    } catch (err) {
      console.log("Reschedule error:", err);
      alert("Something went wrong");
    }
  };

  /* ── Cancel ── */
  const handleCancel = async (interview_id) => {
    if (!window.confirm("Cancel this interview?")) return;
    try {
      const res  = await fetch(`${BASE}/api/cancel-interview/${interview_id}`, {
        method: "PUT",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setInterviews((prev) =>
          prev.map((i) =>
            i.interview_id === interview_id ? { ...i, status: "cancelled" } : i
          )
        );
      } else {
        alert(data.message || "Failed to cancel");
      }
    } catch (err) {
      alert("Something went wrong");
    }
  };

  /* ── Mark Complete ── */
  const handleMarkComplete = async (interview_id) => {
    try {
      const res  = await fetch(`${BASE}/api/complete-interview/${interview_id}`, {
        method: "PUT",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setInterviews((prev) =>
          prev.map((i) =>
            i.interview_id === interview_id ? { ...i, status: "completed" } : i
          )
        );
      } else {
        alert(data.message || "Failed to mark complete");
      }
    } catch (err) {
      alert("Something went wrong");
    }
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "scheduled": return { bgcolor: "#dbeafe", color: "#1d4ed8" };
      case "completed": return { bgcolor: "#dcfce7", color: "#166534" };
      case "cancelled": return { bgcolor: "#fee2e2", color: "#991b1b" };
      default:          return {};
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });

  const formatTime = (d) =>
    new Date(d).toLocaleTimeString("en-IN", {
      hour: "2-digit", minute: "2-digit",
    });

  const totalInterviews = interviews.length;
  const scheduledCount  = interviews.filter((i) => i.status === "scheduled").length;
  const completedCount  = interviews.filter((i) => i.status === "completed").length;
  const cancelledCount  = interviews.filter((i) => i.status === "cancelled").length;

  return (
    <Box
      sx={{
        height: "100vh",
        bgcolor: "#f0f4fa",
        p: { xs: 2, md: 4 },
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* ── HEADER ── */}
      <Paper
        elevation={0}
        sx={{
          flexShrink: 0,
          p: { xs: 3, md: 4 },
          borderRadius: 5,
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #2563eb 100%)",
          color: "#fff",
          position: "relative",
          overflow: "hidden",
          mb: 3,
        }}
      >
        <Box sx={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
        <Box sx={{ position: "absolute", bottom: -60, right: 80, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

        <Typography variant="h4" fontWeight={800} letterSpacing={-0.5} sx={{ position: "relative" }}>
          Scheduled Interviews
        </Typography>
        <Typography sx={{ mt: 1, maxWidth: 680, opacity: 0.75, lineHeight: 1.7, fontSize: 14.5, position: "relative" }}>
          Manage all your candidate interviews in one place. Track schedules,
          monitor status, and stay organized with your hiring process.
        </Typography>

        <Box sx={{ mt: 3, display: "flex", gap: 2, flexWrap: "wrap", position: "relative" }}>
          <StatCard title="Total"     value={totalInterviews} accent="#60a5fa" />
          <StatCard title="Scheduled" value={scheduledCount}  accent="#93c5fd" />
          <StatCard title="Completed" value={completedCount}  accent="#34d399" />
          <StatCard title="Cancelled" value={cancelledCount}  accent="#f87171" />
        </Box>
      </Paper>

      {/* ── LIST ── */}
      <Box
        sx={{
          flex: "1 1 0",
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          pr: 1,
          "&::-webkit-scrollbar": { width: "6px" },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": { background: "#93c5fd", borderRadius: "999px" },
          "&::-webkit-scrollbar-thumb:hover": { background: "#2563eb" },
          scrollbarWidth: "thin",
          scrollbarColor: "#93c5fd transparent",
        }}
      >
        {interviews.length === 0 ? (
          <Paper
            elevation={0}
            sx={{ p: 6, textAlign: "center", borderRadius: 4, border: "1.5px dashed #cbd5e1", bgcolor: "#fff" }}
          >
            <Typography variant="h6" fontWeight={700} color="text.secondary">
              No interviews scheduled yet.
            </Typography>
            <Typography variant="body2" color="text.disabled" mt={1}>
              Scheduled interviews will appear here once created.
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pb: 3 }}>
            {interviews.map((item) => (
              <InterviewCard
                key={item.interview_id}
                item={item}
                onJoin={handleJoinInterview}   // ← pass function reference
                onReschedule={handleReschedule}
                onCancel={handleCancel}
                onMarkComplete={handleMarkComplete}
                getStatusStyle={getStatusStyle}
                formatDate={formatDate}
                formatTime={formatTime}
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}

/* ─────────────────────────────
   InterviewCard
───────────────────────────── */
function InterviewCard({ item, onJoin, onReschedule, onCancel, onMarkComplete, getStatusStyle, formatDate, formatTime }) {
  const [interviewDate, setInterviewDate] = useState("");
  const [loading, setLoading]             = useState(false);

  const handleReschedule = async () => {
    if (!interviewDate) return alert("Please select a date and time");
    setLoading(true);
    await onReschedule(item.app_id, item.student_id, interviewDate);
    setLoading(false);
    setInterviewDate("");
  };

  const isDone = item.status === "cancelled" || item.status === "completed";

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 4,
        border: "1px solid #e2e8f0",
        overflow: "hidden",
        bgcolor: "#fff",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: "0 8px 24px rgba(37,99,235,0.10)",
          borderColor: "#bfdbfe",
        },
      }}
    >
      {/* accent bar */}
      <Box
        sx={{
          height: 4,
          bgcolor:
            item.status === "completed" ? "#22c55e"
            : item.status === "cancelled" ? "#ef4444"
            : "#2563eb",
        }}
      />

      {/* main row */}
      <Box
        sx={{
          p: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 3,
          flexWrap: "wrap",
        }}
      >
        {/* LEFT */}
        <Box sx={{ display: "flex", gap: 2.5, alignItems: "center", flex: 1, minWidth: 200 }}>
          <Avatar
            sx={{
              width: 58, height: 58,
              bgcolor: "#eff6ff", color: "#2563eb",
              fontSize: 22, fontWeight: 800,
              border: "2px solid #bfdbfe", flexShrink: 0,
            }}
          >
            {item.student_name?.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={800} lineHeight={1.2}>
              {item.student_name}
            </Typography>
            <Typography sx={{ color: "#64748b", fontSize: 13.5, mt: 0.4 }}>
              {item.job_name}
            </Typography>
            <Chip
              label={item.status}
              size="small"
              sx={{
                mt: 1, fontWeight: 700, fontSize: 12,
                textTransform: "capitalize", borderRadius: "8px",
                ...getStatusStyle(item.status),
              }}
            />
          </Box>
        </Box>

        {/* RIGHT */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 220 }}>
          <InfoRow icon={<Business sx={{ fontSize: 18 }} />}      text={item.company} />
          <InfoRow icon={<CalendarMonth sx={{ fontSize: 18 }} />} text={formatDate(item.scheduled_at)} />
          <InfoRow icon={<AccessTime sx={{ fontSize: 18 }} />}    text={formatTime(item.scheduled_at)} />
        </Box>
      </Box>

      <Divider sx={{ borderColor: "#f1f5f9" }} />

      {/* IDs + meeting link */}
      <Box
        sx={{
          px: 3, py: 1.5, bgcolor: "#f8fafc",
          display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center",
        }}
      >
        <Typography variant="caption" color="text.disabled" fontWeight={600}>
          App ID: <span style={{ color: "#94a3b8" }}>{item.app_id}</span>
        </Typography>
        <Typography variant="caption" color="text.disabled" fontWeight={600}>
          Student ID: <span style={{ color: "#94a3b8" }}>{item.student_id}</span>
        </Typography>
        {item.meeting_link && (
          <Typography variant="caption" sx={{ color: "#2563eb", fontWeight: 600, wordBreak: "break-all" }}>
            🔗 {item.meeting_link}
          </Typography>
        )}
      </Box>

      <Divider sx={{ borderColor: "#f1f5f9" }} />

      {/* ── RESCHEDULE BOX ── */}
      <Box
        sx={{
          m: 2.5, p: 2.5, borderRadius: 3,
          background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 20px rgba(15,23,42,0.05)",
        }}
      >
        <Typography
          sx={{
            fontSize: 15, fontWeight: 800, color: "#0f172a", mb: 2,
            display: "flex", alignItems: "center", gap: 1,
          }}
        >
          <CalendarMonth sx={{ fontSize: 20, color: "#1976d2" }} />
          Reschedule Interview
        </Typography>

        <TextField
          fullWidth
          type="datetime-local"
          value={interviewDate}
          onChange={(e) => setInterviewDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{
            mb: 2,
            "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#fff", fontWeight: 700 },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <CalendarMonth sx={{ color: "#64748b" }} />
              </InputAdornment>
            ),
          }}
        />

        <Button
          fullWidth
          variant="contained"
          disabled={loading || !interviewDate || isDone}
          onClick={handleReschedule}
          sx={{
            py: 1.3, borderRadius: 2.5,
            textTransform: "none", fontWeight: 800, fontSize: 15,
            background: "linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)",
            boxShadow: "0 8px 20px rgba(37,99,235,0.25)",
            "&:hover": {
              background: "linear-gradient(135deg, #1d4ed8 0%, #172554 100%)",
            },
          }}
        >
          {loading ? "Rescheduling..." : "Reschedule Interview"}
        </Button>
      </Box>

      <Divider sx={{ borderColor: "#f1f5f9" }} />

      {/* ── ACTION BUTTONS ── */}
      <Box sx={{ px: 3, py: 2, display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
        <Button
          variant="outlined"
          color="error"
          size="small"
          startIcon={<Cancel sx={{ fontSize: 17 }} />}
          disabled={isDone}
          onClick={() => onCancel(item.interview_id)}
          sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, fontSize: 13 }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          startIcon={<VideoCall sx={{ fontSize: 17 }} />}
          size="small"
          disabled={isDone}
          onClick={() => onJoin(item.student_id)}  // ← fixed: wrapped in arrow function
          sx={{
            borderRadius: "10px", textTransform: "none",
            fontWeight: 700, fontSize: 13,
            bgcolor: "#2563eb", boxShadow: "none",
            "&:hover": { bgcolor: "#1d4ed8", boxShadow: "0 2px 8px rgba(37,99,235,0.25)" },
          }}
        >
          Join Interview
        </Button>

        <Button
          variant="contained"
          color="success"
          startIcon={<CheckCircle sx={{ fontSize: 17 }} />}
          size="small"
          disabled={isDone}
          onClick={() => onMarkComplete(item.interview_id)}
          sx={{
            borderRadius: "10px", textTransform: "none",
            fontWeight: 700, fontSize: 13, boxShadow: "none",
            "&:hover": { boxShadow: "0 2px 8px rgba(34,197,94,0.25)" },
          }}
        >
          Mark Complete
        </Button>
      </Box>

    </Paper>
  );
}

/* ── Helpers ── */
function StatCard({ title, value, accent }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2, borderRadius: 3,
        bgcolor: "rgba(255,255,255,0.10)",
        border: "1px solid rgba(255,255,255,0.15)",
        backdropFilter: "blur(10px)",
        minWidth: 120, display: "flex", flexDirection: "column", gap: 0.5,
      }}
    >
      <Typography sx={{ fontSize: 12, fontWeight: 600, opacity: 0.7, textTransform: "uppercase", letterSpacing: 0.6 }}>
        {title}
      </Typography>
      <Typography variant="h4" fontWeight={800} sx={{ color: accent || "#fff" }}>
        {value}
      </Typography>
    </Paper>
  );
}

function InfoRow({ icon, text }) {
  return (
    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
      <Box sx={{ color: "#94a3b8", display: "flex", alignItems: "center" }}>{icon}</Box>
      <Typography sx={{ fontWeight: 600, fontSize: 13.5, color: "#334155" }}>{text}</Typography>
    </Box>
  );
}
