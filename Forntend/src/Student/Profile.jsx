import { API_URL } from "../config.js";
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Divider,
  CircularProgress,
  Alert,
  Avatar,
} from "@mui/material";
import {
  Person,
  Email,
  Phone,
  School,
  CalendarToday,
  Grade,
  Psychology,
  LinkedIn,
  Download,
  Edit,
} from "@mui/icons-material";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ─────────────────────────────
     Fetch Profile
  ───────────────────────────── */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/api/profile`, {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();

        if (data.success) {
          setProfile(data.profile);
          setSkills(data.skills || []);
        } else {
          setError(data.message || "Failed to load profile");
        }
      } catch (err) {
        setError("Something went wrong while fetching profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  /* ─────────────────────────────
     Loading State
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

  /* ─────────────────────────────
     Error State
  ───────────────────────────── */
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  /* ─────────────────────────────
     Main UI
  ───────────────────────────── */
  return (
    <Box sx={{ maxWidth: 900, mx: "auto", pb: 6 }}>

      {/* ── Profile Hero Banner ── */}
      <Box
        sx={{
          borderRadius: 4,
          overflow: "hidden",
          mb: 3,
          border: "1px solid #e2e8f0",
        }}
      >
        {/* Gradient Header */}
        <Box
          sx={{
            background: "linear-gradient(135deg, #1976d2 0%, #0f172a 100%)",
            px: 4,
            pt: 4,
            pb: 7,
            position: "relative",
          }}
        >
          <Typography variant="h5" fontWeight={900} color="#fff">
            My Profile
          </Typography>
          <Typography fontSize={13} color="rgba(255,255,255,0.7)" mt={0.5}>
            Your personal and academic information
          </Typography>
        </Box>

        {/* Avatar + Name Row */}
        <Box
          sx={{
            bgcolor: "#fff",
            px: 4,
            pb: 3,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
            mt: -5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "flex-end", gap: 2 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: "#1976d2",
                fontSize: 32,
                fontWeight: 900,
                border: "4px solid #fff",
                boxShadow: "0 4px 16px rgba(25,118,210,0.25)",
              }}
            >
              {profile?.full_name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ mb: 1 }}>
              <Typography fontWeight={900} fontSize={20} color="#0f172a">
                {profile?.full_name}
              </Typography>
              <Typography fontSize={13} color="#64748b">
                {profile?.degree_branch} · {profile?.college_university}
              </Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            startIcon={<Edit />}
            sx={{
              mb: 1,
              bgcolor: "#1976d2",
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 2,
              "&:hover": { bgcolor: "#1259a7" },
            }}
          >
            Edit Profile
          </Button>
        </Box>
      </Box>

      {/* ── Cards ── */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>

        {/* ── Basic Information ── */}
        <Card
          elevation={0}
          sx={{ borderRadius: 4, border: "1px solid #e2e8f0" }}
        >
          <CardContent sx={{ p: 3 }}>

            <Typography
              fontWeight={800}
              fontSize={15}
              color="#0f172a"
              mb={2.5}
            >
              Basic Information
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
              }}
            >
              {/* Name */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                  sx={{
                    bgcolor: "#dbeafe",
                    borderRadius: 2,
                    p: 1,
                    display: "flex",
                  }}
                >
                  <Person sx={{ fontSize: 18, color: "#1976d2" }} />
                </Box>
                <Box>
                  <Typography fontSize={11} color="#94a3b8" fontWeight={600}>
                    FULL NAME
                  </Typography>
                  <Typography fontSize={14} fontWeight={700} color="#1e293b">
                    {profile?.full_name || "—"}
                  </Typography>
                </Box>
              </Box>

              {/* Email */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                  sx={{
                    bgcolor: "#dbeafe",
                    borderRadius: 2,
                    p: 1,
                    display: "flex",
                  }}
                >
                  <Email sx={{ fontSize: 18, color: "#1976d2" }} />
                </Box>
                <Box>
                  <Typography fontSize={11} color="#94a3b8" fontWeight={600}>
                    EMAIL
                  </Typography>
                  <Typography fontSize={14} fontWeight={700} color="#1e293b">
                    {profile?.email_address || "—"}
                  </Typography>
                </Box>
              </Box>

              {/* Phone */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                  sx={{
                    bgcolor: "#dbeafe",
                    borderRadius: 2,
                    p: 1,
                    display: "flex",
                  }}
                >
                  <Phone sx={{ fontSize: 18, color: "#1976d2" }} />
                </Box>
                <Box>
                  <Typography fontSize={11} color="#94a3b8" fontWeight={600}>
                    PHONE
                  </Typography>
                  <Typography fontSize={14} fontWeight={700} color="#1e293b">
                    {profile?.phone_number || "—"}
                  </Typography>
                </Box>
              </Box>

              {/* LinkedIn */}
              {profile?.linkedin_profile && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box
                    sx={{
                      bgcolor: "#dbeafe",
                      borderRadius: 2,
                      p: 1,
                      display: "flex",
                    }}
                  >
                    <LinkedIn sx={{ fontSize: 18, color: "#1976d2" }} />
                  </Box>
                  <Box>
                    <Typography fontSize={11} color="#94a3b8" fontWeight={600}>
                      LINKEDIN
                    </Typography>
                    <Typography
                      fontSize={14}
                      fontWeight={700}
                      color="#1976d2"
                      component="a"
                      href={profile.linkedin_profile}
                      target="_blank"
                      sx={{ textDecoration: "none" }}
                    >
                      View Profile →
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* ── Education ── */}
        <Card
          elevation={0}
          sx={{ borderRadius: 4, border: "1px solid #e2e8f0" }}
        >
          <CardContent sx={{ p: 3 }}>

            <Typography
              fontWeight={800}
              fontSize={15}
              color="#0f172a"
              mb={2.5}
            >
              Education
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
              }}
            >
              {/* College */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                  sx={{
                    bgcolor: "#dcfce7",
                    borderRadius: 2,
                    p: 1,
                    display: "flex",
                  }}
                >
                  <School sx={{ fontSize: 18, color: "#16a34a" }} />
                </Box>
                <Box>
                  <Typography fontSize={11} color="#94a3b8" fontWeight={600}>
                    COLLEGE / UNIVERSITY
                  </Typography>
                  <Typography fontSize={14} fontWeight={700} color="#1e293b">
                    {profile?.college_university || "—"}
                  </Typography>
                </Box>
              </Box>

              {/* Degree */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                  sx={{
                    bgcolor: "#dcfce7",
                    borderRadius: 2,
                    p: 1,
                    display: "flex",
                  }}
                >
                  <School sx={{ fontSize: 18, color: "#16a34a" }} />
                </Box>
                <Box>
                  <Typography fontSize={11} color="#94a3b8" fontWeight={600}>
                    DEGREE / BRANCH
                  </Typography>
                  <Typography fontSize={14} fontWeight={700} color="#1e293b">
                    {profile?.degree_branch || "—"}
                  </Typography>
                </Box>
              </Box>

              {/* Graduation Year */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                  sx={{
                    bgcolor: "#dcfce7",
                    borderRadius: 2,
                    p: 1,
                    display: "flex",
                  }}
                >
                  <CalendarToday sx={{ fontSize: 18, color: "#16a34a" }} />
                </Box>
                <Box>
                  <Typography fontSize={11} color="#94a3b8" fontWeight={600}>
                    GRADUATION YEAR
                  </Typography>
                  <Typography fontSize={14} fontWeight={700} color="#1e293b">
                    {profile?.graduation_year || "—"}
                  </Typography>
                </Box>
              </Box>

              {/* CGPA */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                  sx={{
                    bgcolor: "#dcfce7",
                    borderRadius: 2,
                    p: 1,
                    display: "flex",
                  }}
                >
                  <Grade sx={{ fontSize: 18, color: "#16a34a" }} />
                </Box>
                <Box>
                  <Typography fontSize={11} color="#94a3b8" fontWeight={600}>
                    CGPA
                  </Typography>
                  <Typography fontSize={14} fontWeight={700} color="#1e293b">
                    {profile?.cgpa || "—"}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* ── Skills ── */}
        <Card
          elevation={0}
          sx={{ borderRadius: 4, border: "1px solid #e2e8f0" }}
        >
          <CardContent sx={{ p: 3 }}>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 2,
              }}
            >
              <Psychology sx={{ color: "#1976d2" }} />
              <Typography fontWeight={800} fontSize={15} color="#0f172a">
                Skills
              </Typography>
            </Box>

            {skills.length === 0 ? (
              <Typography fontSize={13} color="#94a3b8">
                No skills added yet.
              </Typography>
            ) : (
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {skills.map((skill, i) => (
                  <Chip
                    key={i}
                    label={skill}
                    sx={{
                      bgcolor: "#dbeafe",
                      color: "#1976d2",
                      fontWeight: 700,
                      fontSize: 12,
                    }}
                  />
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>

        {/* ── Resume ── */}
        {profile?.resume_link_portfolio && (
          <Card
            elevation={0}
            sx={{ borderRadius: 4, border: "1px solid #e2e8f0" }}
          >
            <CardContent
              sx={{
                p: 3,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Box>
                <Typography fontWeight={800} fontSize={15} color="#0f172a">
                  Resume / Portfolio
                </Typography>
                <Typography fontSize={13} color="#64748b" mt={0.3}>
                  Your uploaded resume or portfolio link
                </Typography>
              </Box>

              <Button
                variant="contained"
                startIcon={<Download />}
                href={profile.resume_link_portfolio}
                target="_blank"
                sx={{
                  bgcolor: "#1976d2",
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 2,
                  "&:hover": { bgcolor: "#1259a7" },
                }}
              >
                Download Resume
              </Button>
            </CardContent>
          </Card>
        )}

      </Box>
    </Box>
  );
}
