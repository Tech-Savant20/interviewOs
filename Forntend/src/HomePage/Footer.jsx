import React from "react";
import { Box, Typography, Link, Stack } from "@mui/material";

export default function Footer() {
  return (
    <Box
      sx={{
         bgcolor: "#FEE2E2",   // 👈 light red background
        color: "#7F1D1D", 
        mt: 5,
        py: 3,
      }}
    >
      {/* Container */}
      <Box
        sx={{
          maxWidth: "1100px",
          mx: "auto",
          px: 2,
        }}
      >
        {/* Top Section */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={3}
          justifyContent="space-between"
        >
          {/* Logo / About */}
          <Box>
            <Typography variant="h6" fontWeight="bold">
              InterviewOS
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              A platform for real-time interviews, coding, and hiring.
            </Typography>
          </Box>

          {/* Links */}
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              Quick Links
            </Typography>
            <Stack spacing={1} sx={{ mt: 1 }}>
              <Link href="/" underline="none" color="inherit">
                Home
              </Link>
              <Link href="#" underline="none" color="inherit">
                Jobs
              </Link>
              <Link href="#" underline="none" color="inherit">
                Dashboard
              </Link>
              <Link href="/privacy" underline="none" color="inherit">
                Privacy Policy
              </Link>
              <Link href="/terms" underline="none" color="inherit">
                Terms of Service
              </Link>
            </Stack>
          </Box>

          {/* Contact */}
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              Contact
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Email: abhyudaytomar1@gmail.com
            </Typography>
          </Box>
        </Stack>

        {/* Bottom Section */}
        <Box
          sx={{
            textAlign: "center",
            mt: 3,
            borderTop: "1px solid rgba(255,255,255,0.3)",
            pt: 2,
          }}
        >
          <Typography variant="body2">
            © {new Date().getFullYear()} InterviewOS. All rights reserved.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
