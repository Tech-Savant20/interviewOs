import { API_URL } from "../config.js";
import {
  Box,
  TextField,
  Button,
  Typography,
  MenuItem,
  Paper,
  InputAdornment,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Business,
  Work,
  Description,
  CurrencyRupee,
  AccessTime,
  Person,
  Psychology,
} from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function EditJob() {
  const navigate = useNavigate();
  const { job_id } = useParams();

  const [form, setForm] = useState({
    company: "",
    job_name: "",
    experience: "",
    job_type: "",
    description: "",
    role: "",
    min_salary: "",
    max_salary: "",
  });

  const [skillsRaw, setSkillsRaw] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);   // ← for prefetch
  const [submitting, setSubmitting] = useState(false);

  /* ─────────────────────────────
     Prefetch Existing Job Data
  ───────────────────────────── */
  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/get-job/${job_id}`,
          { credentials: "include" }
        );
        const data = await res.json();

        if (data.success && data.job) {
          const j = data.job;
          setForm({
            company:     j.company     ?? "",
            job_name:    j.job_name    ?? "",
            experience:  j.experience  ?? "",
            job_type:    j.job_type    ?? "",
            description: j.description ?? "",
            role:        j.role        ?? "",
            min_salary:  j.min_salary  ?? "",
            max_salary:  j.max_salary  ?? "",
          });

          // skills may come as array or comma string — handle both
          if (Array.isArray(j.required_skills)) {
            setSkillsRaw(j.required_skills.join(", "));
          } else if (typeof j.required_skills === "string") {
            setSkillsRaw(j.required_skills);
          }
        } else {
          setError(data.message || "Failed to load job details.");
        }
      } catch {
        setError("Could not fetch job details.");
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [job_id]);

  /* ─────────────────────────────
     Handle Input Change
  ───────────────────────────── */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* ─────────────────────────────
     Handle Submit  (PUT)
  ───────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const skillsArray = skillsRaw
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s !== "");

    if (skillsArray.length === 0) {
      setError("Please enter at least one required skill.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(
        `${API_URL}/api/edit-job/${job_id}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company:         form.company,
            job_name:        form.job_name,
            experience:      Number(form.experience),
            job_type:        form.job_type,
            description:     form.description,
            role:            form.role,
            min_salary:      form.min_salary  ? Number(form.min_salary)  : null,
            max_salary:      form.max_salary  ? Number(form.max_salary)  : null,
            required_skills: skillsArray,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message || "Job updated successfully!");
        setTimeout(() => navigate("/interviewer/dashboard"), 1200);
      } else {
        setError(data.message || "Failed to update job.");
      }
    } catch {
      setError("Something went wrong while updating the job.");
    } finally {
      setSubmitting(false);
    }
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

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f4f7fb",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        p: { xs: 2, md: 4 },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 850,
          borderRadius: 4,
          overflow: "hidden",
          border: "1px solid #e2e8f0",
          bgcolor: "#fff",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: { xs: 3, md: 4 },
            background: "linear-gradient(135deg, #1976d2, #0f172a)",
            color: "#fff",
          }}
        >
          <Typography variant="h4" fontWeight={900}>
            Edit Job
          </Typography>
          <Typography sx={{ mt: 1, opacity: 0.85 }}>
            Update the job details below and save your changes.
          </Typography>
        </Box>

        {/* Form */}
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ p: { xs: 3, md: 4 } }}
        >
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
              {success}
            </Alert>
          )}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2.5,
            }}
          >
            <TextField
              label="Company Name"
              name="company"
              fullWidth
              required
              value={form.company}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Business />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Job Name"
              name="job_name"
              fullWidth
              required
              value={form.job_name}
              onChange={handleChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Work />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Experience Required"
              name="experience"
              type="number"
              fullWidth
              required
              value={form.experience}
              onChange={handleChange}
              inputProps={{ min: 0 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">Years</InputAdornment>
                ),
              }}
            />

            <TextField
              select
              label="Job Type"
              name="job_type"
              fullWidth
              required
              value={form.job_type}
              onChange={handleChange}
            >
              <MenuItem value="Full-time">Full-time</MenuItem>
              <MenuItem value="Part-time">Part-time</MenuItem>
              <MenuItem value="Internship">Internship</MenuItem>
              <MenuItem value="Contract">Contract</MenuItem>
            </TextField>

            <TextField
              label="Role"
              name="role"
              fullWidth
              required
              value={form.role}
              onChange={handleChange}
              placeholder="Frontend Developer, Backend Developer..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Minimum Salary"
              name="min_salary"
              type="number"
              fullWidth
              value={form.min_salary}
              onChange={handleChange}
              inputProps={{ min: 0 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CurrencyRupee />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Maximum Salary"
              name="max_salary"
              type="number"
              fullWidth
              value={form.max_salary}
              onChange={handleChange}
              inputProps={{ min: 0 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CurrencyRupee />
                  </InputAdornment>
                ),
              }}
            />

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                bgcolor: "#f8fafc",
                border: "1px dashed #cbd5e1",
                borderRadius: 2,
                px: 2,
                color: "#64748b",
              }}
            >
              <AccessTime sx={{ mr: 1 }} />
              <Typography fontWeight={700} fontSize={14}>
                Created time will be added automatically
              </Typography>
            </Box>
          </Box>

          {/* Skills */}
          <TextField
            label="Required Skills"
            name="skills"
            fullWidth
            required
            value={skillsRaw}
            onChange={(e) => setSkillsRaw(e.target.value)}
            placeholder="React, Node.js, Python, MySQL..."
            helperText="Separate skills with commas  —  e.g. React, Node.js, Python"
            sx={{ mt: 2.5 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Psychology />
                </InputAdornment>
              ),
            }}
          />

          {/* Description */}
          <TextField
            label="Job Description"
            name="description"
            fullWidth
            multiline
            rows={5}
            required
            value={form.description}
            onChange={handleChange}
            sx={{ mt: 2.5 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Description />
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={submitting}
            sx={{
              mt: 4,
              py: 1.5,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 900,
              fontSize: 16,
              bgcolor: "#1976d2",
              "&:hover": { bgcolor: "#1259a7" },
            }}
          >
            {submitting ? "Saving…" : "Update Job"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
