import { API_URL } from "../config.js";
import {
  Box,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
  Tooltip,
} from "@mui/material";
import {
  Work,
  AccessTime,
  CurrencyRupee,
  Person,
  Edit,
  Delete,
  Psychology,
  CalendarToday,
} from "@mui/icons-material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Jobs() {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ─────────────────────────────
     Fetch Recruiter's Own Jobs
  ───────────────────────────── */
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch(`${API_URL}/api/my-jobs`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) {
          setJobs(data.jobs);
        } else {
          setError(data.message || "Failed to fetch jobs");
        }
      } catch (err) {
        setError("Something went wrong while fetching jobs");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  /* ─────────────────────────────
     Delete Job
  ───────────────────────────── */
    const handleDelete = async (job_id) => {
  if (!window.confirm("Are you sure you want to delete this job?")) {
    return;
  }

  try {
    const res = await fetch(
      `${API_URL}/api/delete-job/${job_id}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to delete job");
    }

    // Remove deleted job from UI
    setJobs((prev) => prev.filter((job) => job.job_id !== job_id));

    alert(data.message || "Job deleted successfully");

  } catch (err) {
    console.error("Delete Job Error:", err);

    alert(
      err.message || "Something went wrong while deleting the job"
    );
  }
};

  /* ─────────────────────────────
     Salary Display Helper
  ───────────────────────────── */
  const formatSalary = (min, max) => {
    if (min && max)
      return `₹${Number(min).toLocaleString("en-IN")} – ₹${Number(max).toLocaleString("en-IN")}`;
    if (min) return `From ₹${Number(min).toLocaleString("en-IN")}`;
    if (max) return `Up to ₹${Number(max).toLocaleString("en-IN")}`;
    return "Not disclosed";
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
     Loading State
  ───────────────────────────── */
  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          bgcolor: "#f4f7fb",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  /* ─────────────────────────────
     Error State
  ───────────────────────────── */
  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  /* ─────────────────────────────
     Main UI
  ───────────────────────────── */
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f4f7fb", p: { xs: 2, md: 4 } }}>

      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={900} color="#0f172a">
          My Posted Jobs
        </Typography>
        <Typography sx={{ color: "#64748b", mt: 0.5 }}>
          Manage all jobs you have posted
        </Typography>
      </Box>

      {/* Empty State */}
      {jobs.length === 0 && (
        <Box
          sx={{
            textAlign: "center",
            py: 10,
            bgcolor: "#fff",
            borderRadius: 4,
            border: "1px dashed #cbd5e1",
          }}
        >
          <Work sx={{ fontSize: 56, color: "#cbd5e1", mb: 2 }} />
          <Typography fontWeight={700} color="#64748b" fontSize={18}>
            No jobs posted yet
          </Typography>
          <Typography color="#94a3b8" mt={1}>
            Go ahead and post your first job!
          </Typography>
        </Box>
      )}

      {/* Job Cards Grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "1fr 1fr",
            xl: "1fr 1fr 1fr",
          },
          gap: 3,
          maxHeight: "75vh",        // ← limits the height
          overflowY: "auto",        // ← enables vertical scroll
          pr: 1,
        }}
      >
        {jobs.map((job) => (
          <Box
            key={job.job_id}
            sx={{
              bgcolor: "#fff",
              borderRadius: 4,
              border: "1px solid #e2e8f0",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              transition: "box-shadow 0.2s",
              "&:hover": {
                boxShadow: "0 8px 32px rgba(25,118,210,0.10)",
              },
            }}
          >
            {/* Card Header */}
            <Box
              sx={{
                px: 3,
                pt: 3,
                pb: 2,
                background:
                  "linear-gradient(135deg, #1976d2 0%, #0f172a 100%)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <Box>
                  <Typography
                    fontWeight={800}
                    fontSize={18}
                    color="#fff"
                    lineHeight={1.2}
                  >
                    {job.job_name}
                  </Typography>
                  <Typography
                    fontSize={13}
                    color="rgba(255,255,255,0.75)"
                    mt={0.5}
                  >
                    {job.company}
                  </Typography>
                </Box>

                {/* Edit & Delete Buttons */}
                <Box sx={{ display: "flex", gap: 0.5 }}>

                  {/* ── Edit navigates to edit page ── */}
                  <Tooltip title="Edit Job">
                    <IconButton
                      size="small"
                      onClick={() =>
                        navigate(`/interviewer/edit-job/${job.job_id}`)
                      }
                      sx={{
                        bgcolor: "rgba(255,255,255,0.15)",
                        color: "#fff",
                        "&:hover": { bgcolor: "rgba(255,255,255,0.28)" },
                      }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Delete Job">
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(job.job_id)}
                      sx={{
                        bgcolor: "rgba(239,68,68,0.18)",
                        color: "#fca5a5",
                        "&:hover": { bgcolor: "rgba(239,68,68,0.35)" },
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>

                </Box>
              </Box>

              {/* Job Type Badge */}
              <Chip
                label={job.job_type}
                size="small"
                sx={{
                  mt: 1.5,
                  bgcolor: jobTypeColor(job.job_type),
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 11,
                }}
              />
            </Box>

            {/* Card Body */}
            <Box sx={{ px: 3, py: 2, flexGrow: 1 }}>

              {/* Role */}
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}
              >
                <Person sx={{ fontSize: 16, color: "#94a3b8" }} />
                <Typography fontSize={13} color="#475569">
                  <strong>Role:</strong> {job.role}
                </Typography>
              </Box>

              {/* Experience */}
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}
              >
                <AccessTime sx={{ fontSize: 16, color: "#94a3b8" }} />
                <Typography fontSize={13} color="#475569">
                  <strong>Experience:</strong> {job.experience} Year(s)
                </Typography>
              </Box>

              {/* Salary */}
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}
              >
                <CurrencyRupee sx={{ fontSize: 16, color: "#94a3b8" }} />
                <Typography fontSize={13} color="#475569">
                  <strong>Salary:</strong>{" "}
                  {formatSalary(job.min_salary, job.max_salary)}
                </Typography>
              </Box>

              {/* Posted Date */}
              {job.created_at && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 1.5,
                  }}
                >
                  <CalendarToday sx={{ fontSize: 16, color: "#94a3b8" }} />
                  <Typography fontSize={13} color="#475569">
                    <strong>Posted:</strong>{" "}
                    {new Date(job.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 1.5 }} />

              {/* Skills */}
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                <Psychology sx={{ fontSize: 16, color: "#94a3b8", mt: 0.3 }} />
                <Box>
                  <Typography
                    fontSize={12}
                    color="#94a3b8"
                    fontWeight={600}
                    mb={0.5}
                  >
                    REQUIRED SKILLS
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {(Array.isArray(job.skills) ? job.skills : []).map(
                      (skill, i) => (
                        <Chip
                          key={i}
                          label={skill}
                          size="small"
                          sx={{
                            bgcolor: "#dbeafe",
                            color: "#1976d2",
                            fontWeight: 600,
                            fontSize: 11,
                          }}
                        />
                      )
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Card Footer — Description Preview */}
            <Box
              sx={{
                px: 3,
                py: 2,
                bgcolor: "#f8fafc",
                borderTop: "1px solid #e2e8f0",
              }}
            >
              <Typography
                fontSize={12}
                color="#64748b"
                sx={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {job.description}
              </Typography>
            </Box>

          </Box>
        ))}
      </Box>
    </Box>
  );
}
