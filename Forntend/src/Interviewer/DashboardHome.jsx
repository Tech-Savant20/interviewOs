import { API_URL } from "../config.js";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Button,
  Avatar,
} from "@mui/material";
import {
  Work,
  People,
  CheckCircle,
  Cancel,
  Add,
  ArrowForward,
  Person,
  CalendarToday,
} from "@mui/icons-material";
import { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";
export default function DashboardHome({ setActiveView }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [recentApplicants, setRecentApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ─────────────────────────────
     Fetch Dashboard Data
  ───────────────────────────── */
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch(`${API_URL}/api/dashboard`, {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();

        if (data.success) {
          setStats(data.stats);
          setRecentJobs(data.recent_jobs);
          setRecentApplicants(data.recent_applicants);
        } else {
          setError(data.message || "Failed to load dashboard");
        }
      } catch (err) {
        setError("Something went wrong while loading dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  /* ─────────────────────────────
     Stat Cards Config
  ───────────────────────────── */
  const statCards = stats
    ? [
      {
        label: "Total Jobs Posted",
        value: stats.total_jobs,
        icon: <Work sx={{ fontSize: 28 }} />,
        color: "#1976d2",
        bg: "#dbeafe",
      },
      {
        label: "Total Applicants",
        value: stats.total_applicants,
        icon: <People sx={{ fontSize: 28 }} />,
        color: "#d97706",
        bg: "#fef3c7",
      },
      {
        label: "Shortlisted",
        value: stats.shortlisted,
        icon: <CheckCircle sx={{ fontSize: 28 }} />,
        color: "#16a34a",
        bg: "#dcfce7",
      },
      {
        label: "Rejected",
        value: stats.rejected,
        icon: <Cancel sx={{ fontSize: 28 }} />,
        color: "#dc2626",
        bg: "#fee2e2",
      },
    ]
    : [];

  /* ─────────────────────────────
     Application Status Color
  ───────────────────────────── */
  const statusColor = (status) => {
    const map = {
      applied: { bg: "#dbeafe", color: "#1976d2" },
      shortlisted: { bg: "#dcfce7", color: "#16a34a" },
      rejected: { bg: "#fee2e2", color: "#dc2626" },
      selected: { bg: "#f3e8ff", color: "#7c3aed" },
    };
    return map[status] || { bg: "#f1f5f9", color: "#64748b" };
  };

  /* ─────────────────────────────
     Job Type Color
  ───────────────────────────── */
  const jobTypeColor = (type) => {
    const map = {
      "Full-time": "#16a34a",
      "Part-time": "#d97706",
      Internship: "#1976d2",
      Contract: "#7c3aed",
    };
    return map[type] || "#64748b";
  };

  /* ─────────────────────────────
     Loading / Error
  ───────────────────────────── */
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  /* ─────────────────────────────
     Main UI
  ───────────────────────────── */
  return (
    <Box sx={{ pb: 4 }}>

      {/* ── Welcome Header ── */}
      <Box
        sx={{
          mb: 4,
          p: 3,
          borderRadius: 4,
          background: "linear-gradient(135deg, #1976d2 0%, #0f172a 100%)",
          color: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={900}>
            Welcome back, {user?.username} 👋
          </Typography>
          <Typography sx={{ opacity: 0.8, mt: 0.5, fontSize: 14 }}>
            Here's what's happening with your job postings today.
          </Typography>
        </Box>

        {/* Quick Action Buttons */}
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate("/interviewer/addPost")}
            sx={{
              bgcolor: "#fff",
              color: "#1976d2",
              fontWeight: 700,
              textTransform: "none",
              borderRadius: 2,
              "&:hover": { bgcolor: "#e0f2fe" },
            }}
          >
            Post a Job
          </Button>

          <Button
            variant="outlined"
            startIcon={<People />}
            onClick={() => setActiveView("Applications")}
            sx={{
              borderColor: "rgba(255,255,255,0.5)",
              color: "#fff",
              fontWeight: 700,
              textTransform: "none",
              borderRadius: 2,
              "&:hover": {
                borderColor: "#fff",
                bgcolor: "rgba(255,255,255,0.1)",
              },
            }}
          >
            View Applicants
          </Button>
        </Box>
      </Box>

      {/* ── Stats Cards ── */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr 1fr",
            md: "1fr 1fr 1fr 1fr",
          },
          gap: 2.5,
          mb: 4,
        }}
      >
        {statCards.map((card, i) => (
          <Box
            key={i}
            sx={{
              bgcolor: "#fff",
              borderRadius: 3,
              border: "1px solid #e2e8f0",
              p: 2.5,
              display: "flex",
              alignItems: "center",
              gap: 2,
              transition: "box-shadow 0.2s",
              "&:hover": {
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              },
            }}
          >
            <Box
              sx={{
                bgcolor: card.bg,
                color: card.color,
                borderRadius: 2.5,
                p: 1.2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {card.icon}
            </Box>
            <Box>
              <Typography fontSize={26} fontWeight={900} color="#0f172a" lineHeight={1}>
                {card.value}
              </Typography>
              <Typography fontSize={12} color="#64748b" mt={0.3}>
                {card.label}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* ── Bottom Section: Recent Jobs + Recent Applicants ── */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 3,
        }}
      >

        {/* ── Recent Jobs ── */}
        <Box
          sx={{
            bgcolor: "#fff",
            borderRadius: 4,
            border: "1px solid #e2e8f0",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <Box
            sx={{
              px: 3,
              py: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            <Typography fontWeight={800} color="#0f172a">
              Recent Jobs
            </Typography>
            <Button
              size="small"
              endIcon={<ArrowForward />}
              onClick={() => setActiveView("Jobs")}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                color: "#1976d2",
                fontSize: 12,
              }}
            >
              View All
            </Button>
          </Box>

          {/* List */}
          <Box
            sx={{
              maxHeight: 340,
              overflowY: "auto",
              "&::-webkit-scrollbar": { width: "5px" },
              "&::-webkit-scrollbar-thumb": {
                bgcolor: "#cbd5e1",
                borderRadius: "10px",
              },
            }}
          >
            {recentJobs.length === 0 ? (
              <Box sx={{ p: 4, textAlign: "center" }}>
                <Work sx={{ fontSize: 40, color: "#cbd5e1", mb: 1 }} />
                <Typography fontSize={13} color="#94a3b8">
                  No jobs posted yet
                </Typography>
              </Box>
            ) : (
              recentJobs.map((job, i) => (
                <Box key={job.job_id}>
                  <Box
                    sx={{
                      px: 3,
                      py: 2,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      "&:hover": { bgcolor: "#f8fafc" },
                    }}
                  >
                    <Box>
                      <Typography fontWeight={700} fontSize={14} color="#0f172a">
                        {job.job_name}
                      </Typography>
                      <Typography fontSize={12} color="#64748b" mt={0.3}>
                        {job.company}
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          mt: 0.5,
                        }}
                      >
                        <CalendarToday sx={{ fontSize: 11, color: "#94a3b8" }} />
                        <Typography fontSize={11} color="#94a3b8">
                          {new Date(job.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label={job.job_type}
                      size="small"
                      sx={{
                        bgcolor: jobTypeColor(job.job_type),
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: 10,
                      }}
                    />
                  </Box>
                  {i < recentJobs.length - 1 && <Divider />}
                </Box>
              ))
            )}
          </Box>
        </Box>

        {/* ── Recent Applicants ── */}
        <Box
          sx={{
            bgcolor: "#fff",
            borderRadius: 4,
            border: "1px solid #e2e8f0",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <Box
            sx={{
              px: 3,
              py: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            <Typography fontWeight={800} color="#0f172a">
              Recent Applicants
            </Typography>
            <Button
              size="small"
              endIcon={<ArrowForward />}
              onClick={() => setActiveView("Applications")}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                color: "#1976d2",
                fontSize: 12,
              }}
            >
              View All
            </Button>
          </Box>

          {/* List */}
          <Box
            sx={{
              maxHeight: 340,
              overflowY: "auto",
              "&::-webkit-scrollbar": { width: "5px" },
              "&::-webkit-scrollbar-thumb": {
                bgcolor: "#cbd5e1",
                borderRadius: "10px",
              },
            }}
          >
            {recentApplicants.length === 0 ? (
              <Box sx={{ p: 4, textAlign: "center" }}>
                <People sx={{ fontSize: 40, color: "#cbd5e1", mb: 1 }} />
                <Typography fontSize={13} color="#94a3b8">
                  No applicants yet
                </Typography>
              </Box>
            ) : (
              recentApplicants.map((applicant, i) => (
                <Box key={applicant.app_id}>
                  <Box
                    sx={{
                      px: 3,
                      py: 2,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      "&:hover": { bgcolor: "#f8fafc" },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          bgcolor: "#dbeafe",
                          color: "#1976d2",
                          fontSize: 14,
                          fontWeight: 700,
                        }}
                      >
                        {applicant.name?.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography fontWeight={700} fontSize={14} color="#0f172a">
                          {applicant.name}
                        </Typography>
                        <Typography fontSize={12} color="#64748b">
                          {applicant.job_name}
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            mt: 0.3,
                          }}
                        >
                          <CalendarToday sx={{ fontSize: 11, color: "#94a3b8" }} />
                          <Typography fontSize={11} color="#94a3b8">
                            {new Date(applicant.applied_at).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    <Chip
                      label={applicant.status}
                      size="small"
                      sx={{
                        bgcolor: statusColor(applicant.status).bg,
                        color: statusColor(applicant.status).color,
                        fontWeight: 700,
                        fontSize: 10,
                        textTransform: "capitalize",
                      }}
                    />
                  </Box>
                  {i < recentApplicants.length - 1 && <Divider />}
                </Box>
              ))
            )}
          </Box>
        </Box>

      </Box>
    </Box>
  );
}
