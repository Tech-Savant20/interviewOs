import { API_URL } from "../config.js";
import { Box, Typography, Chip, Avatar } from "@mui/material";
import { useEffect, useState } from "react";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import BusinessIcon from "@mui/icons-material/Business";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";

const statusColors = {
  "Under Review": "warning",
  Shortlisted: "success",
  Rejected: "error",
  Applied: "info",
};

export default function MyApplications() {
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await fetch(`${API_URL}/api/my-applications`, {
          method: "GET",
          credentials: "include",
        });

        const data = await res.json();
        console.log(data);

        setApplications(
          Array.isArray(data.applications) ? data.applications : []
        );
      } catch (err) {
        console.log("Error fetching applications:", err);
        setApplications([]);
      }
    };

    fetchApplications();
  }, []);

  return (
    <Box sx={{ maxWidth: 750, mx: "auto", mt: 5, px: 2 }}>
      <Typography variant="h5" fontWeight="bold" mb={1}>
        My Applications
      </Typography>

      <Typography variant="body2" color="text.secondary" mb={4}>
        {applications.length} application
        {applications.length !== 1 ? "s" : ""} submitted
      </Typography>

      {applications.length === 0 ? (
        <Box
          sx={{
            textAlign: "center",
            py: 8,
            border: "2px dashed #ddd",
            borderRadius: 3,
          }}
        >
          <WorkOutlineIcon sx={{ fontSize: 48, color: "#ccc", mb: 1 }} />
          <Typography color="text.secondary">No applications yet</Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {applications.map((app) => (
            <Box
              key={app.id}
              sx={{
                border: "1px solid #e0e0e0",
                borderRadius: 3,
                p: 3,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 2,
                transition: "box-shadow 0.2s",
                "&:hover": {
                  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                },
                bgcolor: "background.paper",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: "#c62828",
                    width: 48,
                    height: 48,
                    fontSize: 20,
                  }}
                >
                  {app.company?.[0] || "?"}
                </Avatar>

                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.8,
                      mb: 0.4,
                    }}
                  >
                    <WorkOutlineIcon
                      sx={{ fontSize: 15, color: "text.secondary" }}
                    />
                    <Typography fontWeight="bold" fontSize={16}>
                      {app.jobTitle || "Job Title Not Available"}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.8,
                      mb: 0.4,
                    }}
                  >
                    <PersonOutlineIcon
                      sx={{ fontSize: 14, color: "text.secondary" }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {app.applicantName || app.name || "Applicant"}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.8,
                      mb: 0.4,
                    }}
                  >
                    <BusinessIcon
                      sx={{ fontSize: 14, color: "text.secondary" }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {app.company || "Company Not Available"}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                    <CalendarTodayIcon
                      sx={{ fontSize: 13, color: "text.secondary" }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Applied on{" "}
                      {app.date
                        ? new Date(app.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                        : "Date not available"}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Chip
                label={app.status || "Applied"}
                color={statusColors[app.status] || "info"}
                size="small"
                sx={{ fontWeight: 600, px: 1 }}
              />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
