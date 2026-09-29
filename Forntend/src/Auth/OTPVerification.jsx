import { API_URL } from "../config.js";
import React, { useState } from "react";
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useLocation, useNavigate } from "react-router-dom";

const OTPVerification = () => {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const email = location?.state?.email;

  // Handle OTP input
  const handleChange = (value, index) => {
    // Allow only single digit
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;

    setOtp(newOtp);

    // Move to next input automatically
    if (value && index < 3) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  // Handle Backspace
  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  // Submit OTP
  const handleSubmit = async () => {
    try {
      const enteredOtp = otp.join("");

      // Validation
      if (enteredOtp.length !== 4) {
        alert("Please enter complete 4-digit OTP");
        return;
      }

      if (!email) {
        alert("Email not found. Please signup again.");
        navigate("/signup");
        return;
      }

      setLoading(true);

      console.log("Entered OTP:", enteredOtp);

      const response = await fetch(
        `${API_URL}/api/verify-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            email,
            otp: enteredOtp,
          }),
        }
      );

      const res = await response.json();

      console.log(res);

      if (response.ok && res.success) {
        alert("OTP Verified Successfully!");

        navigate("/login");
      } else {
        alert(res.message || "Invalid OTP");
      }
    } catch (err) {
      console.log(err);

      alert("Cannot connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background:
          "linear-gradient(135deg, #141E30 0%, #243B55 100%)",
        p: 2,
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={10}
          sx={{
            p: 5,
            borderRadius: "24px",
            textAlign: "center",
            backdropFilter: "blur(10px)",
          }}
        >
          {/* Icon */}
          <Box
            sx={{
              width: 70,
              height: 70,
              borderRadius: "50%",
              background:
                "linear-gradient(135deg,#1976d2,#42a5f5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              margin: "0 auto 20px",
              boxShadow:
                "0 8px 20px rgba(25,118,210,0.4)",
            }}
          >
            <LockOutlinedIcon
              sx={{ color: "#fff", fontSize: 35 }}
            />
          </Box>

          {/* Heading */}
          <Typography
            variant="h4"
            fontWeight="bold"
            color="primary"
            gutterBottom
          >
            Verify OTP
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 4 }}
          >
            Enter the 4-digit verification code sent to your
            email.
          </Typography>

          {/* OTP Inputs */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              gap: 2,
              mb: 4,
            }}
          >
            {otp.map((digit, index) => (
              <TextField
                key={index}
                id={`otp-${index}`}
                value={digit}
                onChange={(e) =>
                  handleChange(e.target.value, index)
                }
                onKeyDown={(e) => handleKeyDown(e, index)}
                inputProps={{
                  maxLength: 1,
                  style: {
                    textAlign: "center",
                    fontSize: "24px",
                    fontWeight: "bold",
                  },
                }}
                sx={{
                  width: "65px",
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "14px",
                    backgroundColor: "#f8fafc",
                    transition: "0.3s",

                    "& fieldset": {
                      borderColor: "#cbd5e1",
                    },

                    "&:hover fieldset": {
                      borderColor: "#1976d2",
                    },

                    "&.Mui-focused fieldset": {
                      borderColor: "#1976d2",
                      borderWidth: "2px",
                    },
                  },
                }}
              />
            ))}
          </Box>

          {/* Verify Button */}
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleSubmit}
            disabled={loading}
            sx={{
              py: 1.5,
              borderRadius: "14px",
              fontWeight: "bold",
              fontSize: "16px",
              textTransform: "none",
              background:
                "linear-gradient(135deg,#1976d2,#42a5f5)",
              boxShadow:
                "0 8px 20px rgba(25,118,210,0.3)",

              "&:hover": {
                background:
                  "linear-gradient(135deg,#1565c0,#1e88e5)",
              },
            }}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </Button>

          {/* Resend */}
          <Typography
            variant="body2"
            sx={{
              mt: 3,
              color: "text.secondary",
            }}
          >
            Didn’t receive code?{" "}
            <span
              style={{
                color: "#1976d2",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Resend
            </span>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default OTPVerification;
