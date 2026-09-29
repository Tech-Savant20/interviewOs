import { API_URL } from "../config.js";
import {
  Typography,
  Box,
  Chip,
  Avatar,
  Button,
  CircularProgress,
} from "@mui/material";
import {
  EmailOutlined,
  BusinessOutlined,
  WorkOutlined,
  CalendarMonthOutlined,
  PeopleAltOutlined,
  MessageOutlined,
} from "@mui/icons-material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const statusConfig = {
  selected: { color: "#22c55e", bg: "#dcfce7", label: "Selected" },
  rejected: { color: "#ef4444", bg: "#fee2e2", label: "Rejected" },
  shortlisted: { color: "#f59e0b", bg: "#fef3c7", label: "Shortlisted" },
  applied: { color: "#64748b", bg: "#e2e8f0", label: "Applied" },
};

function ApplicantCard({ app, onMessageClick, handleSelectedUser }) {
  const navigate = useNavigate();
  const status = statusConfig[app.status] || statusConfig.applied;

  const handleApplicantFullDetail = () => {
    navigate(`/applicant/${app.user_id}`);
  };

  const handleMessage = (e) => {
    e.stopPropagation();

    onMessageClick(app);
    handleSelectedUser(app);
  };

  return (
    <Box
      onClick={handleApplicantFullDetail}
      sx={{
        bgcolor: "#fff",
        borderRadius: 3,
        p: 2,
        border: "1px solid #e5e7eb",
        boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1.5fr 1.5fr 1fr auto" },
        gap: 2,
        alignItems: "center",
        cursor: "pointer",
        transition: "all 0.2s ease",

        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
          borderColor: "#1976d2",
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Avatar sx={{ bgcolor: "#1976d2" }}>
          {app.username?.[0]?.toUpperCase() ||
            app.name?.[0]?.toUpperCase() ||
            "U"}
        </Avatar>

        <Box>
          <Typography fontWeight={700}>
            {app.username || app.name || "Unknown User"}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <EmailOutlined sx={{ fontSize: 15, color: "gray" }} />

            <Typography variant="body2" color="text.secondary">
              {app.email || "No email"}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <WorkOutlined sx={{ fontSize: 17, color: "#d32f2f" }} />

          <Typography fontWeight={600}>
            {app.job_name || app.job_title || "No job name"}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <BusinessOutlined sx={{ fontSize: 17, color: "gray" }} />

          <Typography variant="body2" color="text.secondary">
            {app.company || "No company"}
          </Typography>
        </Box>
      </Box>

      <Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
          <CalendarMonthOutlined sx={{ fontSize: 16, color: "gray" }} />

          <Typography variant="body2" color="text.secondary">
            {app.applied_at
              ? new Date(app.applied_at).toLocaleDateString("en-IN")
              : "No date"}
          </Typography>
        </Box>

        <Chip
          label={status.label}
          size="small"
          sx={{
            bgcolor: status.bg,
            color: status.color,
            fontWeight: 700,
          }}
        />
      </Box>

      <Button
        variant="contained"
        startIcon={<MessageOutlined />}
        onClick={handleMessage}
        sx={{
          bgcolor: "#1976d2",
          borderRadius: 2,
          textTransform: "none",
          fontWeight: 700,

          "&:hover": {
            bgcolor: "#1259a7",
          },
        }}
      >
        Message
      </Button>
    </Box>
  );
}

export default function Applicants({ onMessageClick, handleSelectedUser }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        const res = await fetch(`${API_URL}/api/applicants`, {
          method: "GET",
          credentials: "include",
        });

        const data = await res.json();
        console.log("Applicants data:", data.data);

        if (data.success) {
          setApplications(Array.isArray(data.data) ? data.data : []);
        } else {
          setError(data.message || "Failed to fetch applicants");
        }
      } catch (err) {
        setError("Failed to fetch applicants");
      } finally {
        setLoading(false);
      }
    };

    fetchApplicants();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography color="error" fontWeight={700}>
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc", p: { xs: 2, md: 4 } }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <PeopleAltOutlined sx={{ color: "#1976d2", fontSize: 30 }} />

          <Typography variant="h5" fontWeight={800}>
            Applicants Dashboard
          </Typography>
        </Box>

        <Typography color="text.secondary">
          {applications.length} total applications
        </Typography>
      </Box>

      {applications.length === 0 ? (
        <Box
          sx={{
            textAlign: "center",
            py: 8,
            bgcolor: "#fff",
            borderRadius: 3,
            border: "1px dashed #cbd5e1",
          }}
        >
          <Typography fontWeight={700}>No applicants yet</Typography>
        </Box>
      ) : (
        <Box
          sx={{
            maxHeight: "72vh",
            overflowY: "auto",
            pr: 1,
            display: "flex",
            flexDirection: "column",
            gap: 2,

            "&::-webkit-scrollbar": {
              width: "7px",
            },
            "&::-webkit-scrollbar-track": {
              bgcolor: "#e5e7eb",
              borderRadius: "10px",
            },
            "&::-webkit-scrollbar-thumb": {
              bgcolor: "#94a3b8",
              borderRadius: "10px",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              bgcolor: "#64748b",
            },
          }}
        >
          {applications.map((app) => (
            <ApplicantCard
              key={app.app_id}
              app={app}
              onMessageClick={onMessageClick}
              handleSelectedUser={handleSelectedUser}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
