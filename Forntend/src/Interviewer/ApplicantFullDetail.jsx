import { API_URL } from "../config.js";
import { useNavigate, useParams } from "react-router-dom";

import {
  Box,
  Typography,
  Button,
  Avatar,
  Chip,
  Divider,
  Paper,
  TextField,
  InputAdornment,
} from "@mui/material";

import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

import { useEffect, useState } from "react";

export default function ApplicantFullDetail() {
  const navigate = useNavigate();

  const { applicantId } = useParams();

  const [applicantDetail, setApplicantDetail] = useState(null);

  const [error, setError] = useState("");

  const [interviewDate, setInterviewDate] = useState("");

  console.log(applicantDetail);

  useEffect(() => {
    const fetchApplicantDetail = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/applicantFullDetail/${applicantId}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        const res = await response.json();

        if (res.success) {
          setApplicantDetail(res.data);
        } else {
          setError(res.message || "Failed to fetch applicant details");
        }
      } catch (err) {
        setError("Something went wrong while fetching applicant details");
      }
    };

    fetchApplicantDetail();
  }, [applicantId]);

  const downloadResume = async () => {
  const res = await fetch(
    `${API_URL}/api/resume/${applicantDetail.app_id}`,
    {
      credentials: "include",
    }
  );

  const data = await res.json();
  console.log("resume data ",data)
  if (data.success) {
    window.open(data.url, "_blank");
  }
};

  const handleSelectionUpdate = async (status) => {
    try {
      const response = await fetch(
        `${API_URL}/api/updateSelectionStatus`,
        {
          method: "PUT",

          credentials: "include",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            application_id: applicantDetail?.app_id,
            status,
          }),
        }
      );

      const res = await response.json();

      if (res.success) {
        setApplicantDetail((prev) => ({
          ...prev,
          application_status: status,
        }));
      }
    } catch (err) {
      console.log("Failed to update selection status", err);
    }
  };

  const handleInterviewSchedule = async () => {
    try {
      if (!interviewDate) {
        return alert("Please select interview date and time");
      }

      const response = await fetch(`${API_URL}/api/schedule-interview`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          application_id: applicantDetail?.app_id,
          student_id: applicantDetail?.student_id,
          interview_date: interviewDate,
          status: "interview_scheduled"
        }),
      });

      const res = await response.json();

      if (res.success) {
        alert("Interview scheduled successfully");
      } else {
        alert("Failed to schedule interview");
      }
    } catch (err) {
      console.log("Failed to schedule interview", err);
    }
  };

  if (error) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          p: 4,
          bgcolor: "#f4f7fb",
        }}
      >
        <Button onClick={() => navigate(-1)}>
          ← Back
        </Button>

        <Typography
          color="error"
          fontWeight={800}
          mt={4}
        >
          {error}
        </Typography>
      </Box>
    );
  }

  if (!applicantDetail) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          p: 4,
          bgcolor: "#f4f7fb",
        }}
      >
        <Typography fontWeight={800}>
          Loading applicant details...
        </Typography>
      </Box>
    );
  }

  const firstLetter =
    applicantDetail.full_name?.charAt(0)?.toUpperCase() || "A";

  const skills = applicantDetail.skills
    ? applicantDetail.skills
      .split(",")
      .map((skill) => skill.trim())
    : [];

  const createdDate = applicantDetail.created_at
    ? new Date(
      applicantDetail.created_at
    ).toLocaleDateString("en-IN")
    : "N/A";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f4f7fb",
        p: { xs: 2, md: 4 },
      }}
    >
      <Button
        onClick={() => navigate(-1)}
        sx={{
          mb: 3,
          textTransform: "none",
          fontWeight: 700,
          color: "#1e293b",
        }}
      >
        ← Back to Applicants
      </Button>

      <Paper
        elevation={0}
        sx={{
          maxWidth: 1100,
          mx: "auto",
          borderRadius: 4,
          overflow: "hidden",
          border: "1px solid #e2e8f0",
          bgcolor: "#fff",
        }}
      >
        {/* HEADER */}

        <Box
          sx={{
            background:
              "linear-gradient(135deg, #1976d2, #0f172a)",

            color: "#fff",

            p: { xs: 3, md: 5 },

            display: "flex",

            alignItems: "center",

            gap: 3,

            flexWrap: "wrap",
          }}
        >
          <Avatar
            sx={{
              width: 90,
              height: 90,
              bgcolor: "#fff",
              color: "#1976d2",
              fontSize: 34,
              fontWeight: 900,
            }}
          >
            {firstLetter}
          </Avatar>

          <Box>
            <Typography
              variant="h4"
              fontWeight={900}
            >
              {applicantDetail.full_name ||
                "Applicant Details"}
            </Typography>

            <Typography
              sx={{
                opacity: 0.85,
                mt: 0.5,
              }}
            >
              Student ID:{" "}
              {applicantDetail.student_id || "N/A"}
            </Typography>

            <Chip
              label={
                applicantDetail?.application_status ||
                "N/A"
              }
              sx={{
                mt: 2,
                bgcolor: "#dbeafe",
                color: "#1d4ed8",
                fontWeight: 800,
              }}
            />
          </Box>
        </Box>

        {/* BODY */}

        <Box
          sx={{
            p: { xs: 3, md: 5 },

            display: "grid",

            gridTemplateColumns: {
              xs: "1fr",
              md: "2fr 1fr",
            },

            gap: 4,
          }}
        >
          {/* LEFT */}

          <Box>
            <Typography
              variant="h6"
              fontWeight={800}
              mb={2}
            >
              Personal Information
            </Typography>

            <Box
              sx={{
                display: "grid",
                gap: 2,
              }}
            >
              <Info
                label="Full Name"
                value={applicantDetail.full_name}
              />

              <Info
                label="Email"
                value={applicantDetail.email_address}
              />

              <Info
                label="Phone"
                value={applicantDetail.phone_number}
              />

              <Info
                label="LinkedIn"
                value={
                  applicantDetail.linkedin_profile ||
                  "N/A"
                }
              />
            </Box>

            <Divider sx={{ my: 4 }} />

            <Typography
              variant="h6"
              fontWeight={800}
              mb={2}
            >
              Education
            </Typography>

            <Box
              sx={{
                display: "grid",
                gap: 2,
              }}
            >
              <Info
                label="Degree / Branch"
                value={
                  applicantDetail.degree_branch
                }
              />

              <Info
                label="College / University"
                value={
                  applicantDetail.college_university
                }
              />

              <Info
                label="Graduation Year"
                value={
                  applicantDetail.graduation_year
                }
              />

              <Info
                label="CGPA"
                value={applicantDetail.cgpa}
              />
            </Box>

            <Divider sx={{ my: 4 }} />

            <Typography
              variant="h6"
              fontWeight={800}
              mb={2}
            >
              Skills
            </Typography>

            <Box
              sx={{
                display: "flex",
                gap: 1.2,
                flexWrap: "wrap",
              }}
            >
              {skills.length > 0 ? (
                skills.map((skill) => (
                  <Chip
                    key={skill}
                    label={skill}
                    sx={{
                      bgcolor: "#f1f5f9",
                      color: "#334155",
                      fontWeight: 700,
                    }}
                  />
                ))
              ) : (
                <Typography color="text.secondary">
                  No skills added
                </Typography>
              )}
            </Box>
          </Box>

          {/* RIGHT */}

          <Box>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                bgcolor: "#f8fafc",
              }}
            >
              <Typography
                variant="h6"
                fontWeight={800}
                mb={2}
              >
                Application Details
              </Typography>

              <Info
                label="Student Details ID"
                value={
                  applicantDetail.student_details_id
                }
              />

              <Info
                label="Student ID"
                value={applicantDetail.student_id}
              />

              <Info
                label="Profile Created"
                value={createdDate}
              />

              <Info
                label="Portfolio / Resume"
                value={
                  applicantDetail.resume_link_portfolio ||
                  "N/A"
                }
              />

              {/* BUTTONS */}

              <Button
                fullWidth
                variant="contained"
                sx={{
                  mt: 3,
                  py: 1.2,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 800,
                  bgcolor: "#1976d2",
                }}
              >
                Message Applicant
              </Button>

              <Button
               fullWidth
               variant="outlined"
               onClick={downloadResume}
              >
              Download Resume
             </Button>
              {/* STATUS */}

              <Box
                sx={{
                  mt: 3,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: "#0f172a",
                  }}
                >
                  Update Status
                </Typography>

                <Button
                  fullWidth
                  onClick={() =>
                    handleSelectionUpdate("selected")
                  }
                  sx={{
                    py: 1.2,
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 800,
                    bgcolor: "#dcfce7",
                    color: "#166534",

                    "&:hover": {
                      bgcolor: "#bbf7d0",
                    },
                  }}
                >
                  ✓ Select
                </Button>

                <Button
                  fullWidth
                  onClick={() =>
                    handleSelectionUpdate("rejected")
                  }
                  sx={{
                    py: 1.2,
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 800,
                    bgcolor: "#fee2e2",
                    color: "#991b1b",

                    "&:hover": {
                      bgcolor: "#fecaca",
                    },
                  }}
                >
                  ✕ Not Selected
                </Button>

                <Button
                  fullWidth
                  onClick={() =>
                    handleSelectionUpdate(
                      "shortlisted"
                    )
                  }
                  sx={{
                    py: 1.2,
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 800,
                    bgcolor: "#dbeafe",
                    color: "#1d4ed8",

                    "&:hover": {
                      bgcolor: "#bfdbfe",
                    },
                  }}
                >
                  💬 In Touch
                </Button>
              </Box>

              {/* INTERVIEW SCHEDULER */}

              <Box
                sx={{
                  mt: 3,
                  p: 2.5,
                  borderRadius: 3,
                  background:
                    "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                  border: "1px solid #e2e8f0",
                  boxShadow:
                    "0 4px 20px rgba(15,23,42,0.05)",
                }}
              >
                <Typography
                  sx={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: "#0f172a",
                    mb: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <CalendarMonthIcon
                    sx={{
                      fontSize: 20,
                      color: "#1976d2",
                    }}
                  />

                  Schedule Interview
                </Typography>

                <TextField
                  fullWidth
                  type="datetime-local"
                  value={interviewDate}
                  onChange={(e) =>
                    setInterviewDate(e.target.value)
                  }
                  InputLabelProps={{
                    shrink: true,
                  }}
                  sx={{
                    mb: 2,

                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      bgcolor: "#fff",
                      fontWeight: 700,
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarMonthIcon
                          sx={{
                            color: "#64748b",
                          }}
                        />
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  fullWidth
                  variant="contained"
                  onClick={
                    handleInterviewSchedule
                  }
                  sx={{
                    py: 1.3,
                    borderRadius: 2.5,
                    textTransform: "none",
                    fontWeight: 800,
                    fontSize: 15,
                    background:
                      "linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)",
                    boxShadow:
                      "0 8px 20px rgba(37,99,235,0.25)",

                    "&:hover": {
                      background:
                        "linear-gradient(135deg, #1d4ed8 0%, #172554 100%)",
                    },
                  }}
                >
                  Schedule Interview
                </Button>
              </Box>
            </Paper>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

function Info({ label, value }) {
  return (
    <Box>
      <Typography
        sx={{
          fontSize: 13,
          color: "#64748b",
          fontWeight: 700,
          mb: 0.3,
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          fontSize: 15,
          color: "#0f172a",
          fontWeight: 700,
          wordBreak: "break-word",
        }}
      >
        {value || "N/A"}
      </Typography>
    </Box>
  );
}
