import { API_URL } from "../config.js";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Divider,
  Stack,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import { useEffect, useState } from "react";
import Pagination from "./Pagination.jsx";
import { useNavigate } from "react-router-dom";

const BASE = API_URL;

export default function AllJobs({ filterParams = {} }) {
  const navigate = useNavigate();

  const [jobs, setJobs]               = useState([]);
  const [error, setError]             = useState("");
  const [totalPages, setTotalPages]   = useState(1);
  const [page, setPage]               = useState(1);
  const [openDialog, setOpenDialog]   = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => {
    setPage(1);
  }, [filterParams]);

 useEffect(() => {
  const fetchJobs = async () => {
    try {
      const hasFilters = Object.keys(filterParams).length > 0;
      const endpoint   = hasFilters ? "allJobs/filter" : "allJobs";

      const query = new URLSearchParams({
        page,
        limit: 5,
        ...(hasFilters ? filterParams : {}),
      }).toString();

      const res  = await fetch(`${BASE}/api/${endpoint}?${query}`, {
        credentials: "include",
      });

      const data = await res.json();

      if (data.success) {
        setJobs(data.jobs ?? []);           // ← never undefined
        setTotalPages(data.totalPages ?? 1);
      } else {
        setError(data.message || "Failed to fetch jobs");
        setJobs([]);                        // ← clear jobs on error
      }
    } catch (err) {
      setError("Something went wrong");
      setJobs([]);                          // ← clear jobs on network error
    }
  };

  fetchJobs();
}, [page, filterParams]);

  const handleOpenDialog  = (job) => { setSelectedJob(job); setOpenDialog(true);  };
  const handleCloseDialog = ()    => { setSelectedJob(null); setOpenDialog(false); };
  const ApplyJOb          = ()    => { navigate(`/job/apply/${selectedJob.job_id}`); };

  // ← normalize skills to always be an array
  const getSkills = (skills) => {
    if (Array.isArray(skills))                    return skills;
    if (typeof skills === "string" && skills)     return skills.split(", ");
    return [];
  };

  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <>
      <Box sx={{ flexWrap: "wrap", width: "100%", ml: 2, mb: 2, gap: 2 }}>
        {jobs.length === 0 ? (
          <Typography sx={{ mt: 4, color: "#6B7280" }}>
            No jobs found for the selected filters.
          </Typography>
        ) : (
          jobs.map((job) => (
            <Card
              key={job.job_id}
              sx={{
                borderRadius: "16px",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
                mb: 2.5,
                border: "1px solid rgba(226, 232, 240, 0.8)",
                transition: "all 0.25s ease-in-out",
                "&:hover": {
                  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.08)",
                  transform: "translateY(-2px)",
                  borderColor: "rgba(239, 68, 68, 0.3)",
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    justifyContent: "space-between",
                    gap: 2,
                  }}
                >
                  {/* LEFT */}
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Avatar
                      sx={{
                        width: 52,
                        height: 52,
                        background: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
                        color: "#ef4444",
                        fontWeight: 700,
                        fontSize: "1.2rem",
                        borderRadius: "14px",
                      }}
                    >
                      {job.job_name?.[0]}
                    </Avatar>

                    <Box>
                      <Typography variant="h6" fontWeight="700" sx={{ color: "#0f172a", fontSize: "1.1rem" }}>
                        {job.job_name}
                      </Typography>

                      <Typography variant="body2" sx={{ color: "#64748b", fontWeight: 500, mt: 0.2 }}>
                        {job.company}
                      </Typography>

                      <Box sx={{ mt: 1.5, display: "flex", gap: 1, alignItems: "center" }}>
                        <Chip
                          label={job.job_type}
                          size="small"
                          sx={{
                            bgcolor: "#f1f5f9",
                            color: "#334155",
                            fontWeight: 600,
                            borderRadius: "6px",
                          }}
                        />
                        <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 500 }}>
                          {job.experience} Yrs Exp
                        </Typography>
                      </Box>

                      {/* ← show skills on card too */}
                      <Box sx={{ mt: 1.5, display: "flex", gap: 0.8, flexWrap: "wrap" }}>
                        {getSkills(job.skills).slice(0, 3).map((skill, i) => (
                          <Chip
                            key={i}
                            label={skill}
                            size="small"
                            variant="outlined"
                            sx={{
                              borderColor: "#e2e8f0",
                              color: "#475569",
                              fontSize: "12px",
                              borderRadius: "6px",
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  </Box>

                  {/* RIGHT */}
                  <Box
                    sx={{
                      textAlign: { xs: "left", md: "right" },
                      width: { xs: "100%", md: "auto" },
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      alignItems: { xs: "flex-start", md: "flex-end" },
                    }}
                  >
                    <Typography fontWeight="800" sx={{ color: "#ef4444", fontSize: "1.1rem" }}>
                      ₹{job.min_salary} – ₹{job.max_salary}
                    </Typography>

                    <Button
                      variant="contained"
                      fullWidth={{ xs: true, md: false }}
                      onClick={() => handleOpenDialog(job)}
                      sx={{
                        mt: 2,
                        background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                        borderRadius: "10px",
                        textTransform: "none",
                        fontWeight: 700,
                        px: 3,
                        py: 1,
                        boxShadow: "0 4px 12px rgba(239, 68, 68, 0.25)",
                        "&:hover": {
                          background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                          boxShadow: "0 6px 16px rgba(239, 68, 68, 0.4)",
                        },
                      }}
                    >
                      Apply Now
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))
        )}

        <Pagination page={page} totalPages={totalPages} setPage={setPage} />
      </Box>

      {/* JOB DETAILS POPUP */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 4, width: "500px", maxWidth: "95%" },
        }}
      >
        {selectedJob && (
          <>
            <DialogTitle sx={{ pr: 6 }}>
              <Box>
                <Typography component="div" variant="h6" fontWeight="bold">
                  {selectedJob.job_name}
                </Typography>
                <Typography component="div" variant="body2" color="text.secondary">
                  {selectedJob.company}
                </Typography>
              </Box>

              <IconButton
                onClick={handleCloseDialog}
                sx={{ position: "absolute", right: 12, top: 12 }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent dividers>
              <Stack spacing={2}>
                <Box>
                  <Typography fontWeight="bold">Job Type</Typography>
                  <Chip label={selectedJob.job_type} size="small" />
                </Box>

                <Box>
                  <Typography fontWeight="bold">Experience</Typography>
                  <Typography color="text.secondary">
                    {selectedJob.experience} Years
                  </Typography>
                </Box>

                <Box>
                  <Typography fontWeight="bold">Salary</Typography>
                  <Typography color="error" fontWeight="bold">
                    ₹{selectedJob.min_salary} – ₹{selectedJob.max_salary}
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography fontWeight="bold">Job Role</Typography>
                  <Typography color="text.secondary">
                    {selectedJob.role || "Not mentioned"}
                  </Typography>
                </Box>

                <Box>
                  <Typography fontWeight="bold">Description</Typography>
                  <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    {selectedJob.description || "No description available"}
                  </Typography>
                </Box>

                <Box>
                  <Typography fontWeight="bold">Skills Required</Typography>
                  <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {/* ← safe for array, string, or undefined */}
                    {getSkills(selectedJob.skills).length > 0 ? (
                      getSkills(selectedJob.skills).map((skill, index) => (
                        <Chip key={index} label={skill} size="small" />
                      ))
                    ) : (
                      <Typography color="text.secondary">
                        No skills mentioned
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Stack>
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
              <Button onClick={handleCloseDialog} color="inherit">
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={ApplyJOb}
                sx={{
                  backgroundColor: "#d32f2f",
                  "&:hover": { backgroundColor: "#b71c1c" },
                }}
              >
                Confirm Apply
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
}
