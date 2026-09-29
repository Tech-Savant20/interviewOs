import { API_URL } from "../config.js";
import {
  Box,
  Button,
  TextField,
  Typography,
  Card,
  CardContent,
  Chip,
} from "@mui/material";

import { useParams } from "react-router-dom";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ApplyJob() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFile = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      setFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const profileExist = await fetch(`${API_URL}/api/profileExist`, {
      method: "GET",
      credentials: "include",
    });

    const profileData = await profileExist.json();
    if (profileData.success === false) {
      alert("Please create your profile before applying");
      navigate("/profileSetup");
      return;
    }
    if (!file) {
      alert("Please upload your resume");
      return;
    }

    setLoading(true);
    setSuccess("");

    try {
      const formData = new FormData();

      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("phone", form.phone);
      formData.append("resume", file);
      formData.append("jobId", jobId);

      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }
      console.log("Submitting application with data:", formData);
      const res = await fetch(`${API_URL}/api/applyJob`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();
      console.log("Response from server:", data);

      if (!res.ok) {
        alert(data.message || "Application failed");
        return;
      }
      if (data.message === "You cannot apply to your own job") {
        alert(data.message);
        return;
      }
      if (data.message === "Application submitted successfully") {
        setSuccess("Application submitted successfully!");
        setForm({ name: "", email: "", phone: "" });
        setFile(null);
        setFileName("");
      }

    } catch (err) {
      console.log(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", mt: 5, px: 2 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" fontWeight="bold" mb={3}>
            Apply for Job #{jobId}
          </Typography>

          {success && (
            <Typography color="green" mb={2}>
              {success}
            </Typography>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              label="Full Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              fullWidth
              required
              sx={{ mb: 2 }}
            />

            <TextField
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              fullWidth
              required
              sx={{ mb: 2 }}
            />

            <TextField
              label="Phone Number"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              fullWidth
              required
              sx={{ mb: 2 }}
            />

            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ mb: 2 }}
            >
              Upload Resume
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                hidden
                onChange={handleFile}
              />
            </Button>

            {fileName && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" mb={1}>
                  Uploaded Resume:
                </Typography>

                <Chip label={fileName} color="success" />
              </Box>
            )}

            <Button
              type="submit"
              variant="contained"
              color="error"
              fullWidth
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Application"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
