import { API_URL } from "../config.js";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { v4 as uuidv4 } from "uuid";

export default function Lobby() {
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const {student_id}= useParams()

  

  const [username, setUsername] = useState("");
  const [videoAvailable, setVideoAvailable] = useState(null);
  const [audioAvailable, setAudioAvailable] = useState(null);
  const [error, setError] = useState("");
  const [connecting, setConnecting] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    getPermissions();
    return () => {
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  

  const getPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      const hasVideo = stream.getVideoTracks().length > 0;
      const hasAudio = stream.getAudioTracks().length > 0;
      setVideoAvailable(hasVideo);
      setAudioAvailable(hasAudio);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch {
      setVideoAvailable(false);
      setAudioAvailable(false);
      setError("Camera or microphone permission denied. Please allow access and refresh.");
    }
  };

  const handleConnect = async () => {
  if (!username.trim()) {
    setError("Please enter your name before joining.");
    return;
  }

  try {
    setConnecting(true);

    const response = await fetch(
      `${API_URL}/api/getMeetingUrl`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          student_id,
        }),
      }
    );

    const data = await response.json();

    if (!data.success) {
      setError(data.message || "Meeting link not found");
      setConnecting(false);
      return;
    }

    setError("");

    localStreamRef.current?.getTracks().forEach((track) =>
      track.stop()
    );

    
    // meeting_link is a full URL; route to its path inside this app
    navigate(new URL(data.url, window.location.origin).pathname, {
      replace: true,
    });

  } catch (err) {
    console.error(err);
    setError("Failed to connect to meeting");
  } finally {
    setConnecting(false);
  }
};

  const getCheckState = (available) => {
    if (available === null) return "pending";
    return available ? "ok" : "fail";
  };

  const nameCheckState = username.trim() ? "ok" : "pending";

  return (
    <Box sx={styles.page}>

      {/* Header */}
      <Box sx={styles.header}>
        <Box sx={styles.statusDot} />
        <Typography sx={styles.headerTitle}>Interview lobby</Typography>
        <Typography sx={styles.clock}>
          {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Typography>
      </Box>

      {/* Main grid */}
      <Box sx={styles.grid}>

        {/* Camera panel */}
        <Box sx={styles.cameraPanel}>
          <Box sx={styles.videoWrapper}>
            {/* Always rendered so ref attaches before stream is ready */}
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              style={{ ...styles.video, display: videoAvailable ? "block" : "none" }}
            />

            {!videoAvailable && (
              <Box sx={styles.videoPlaceholder}>
                <Typography sx={{ fontSize: "28px" }}>📷</Typography>
                <Typography sx={{ fontSize: "12px", color: "#555" }}>
                  {videoAvailable === null ? "Camera loading…" : "No camera found"}
                </Typography>
              </Box>
            )}

            {videoAvailable && (
              <Box sx={styles.previewBadge}>
                <Box sx={styles.recDot} />
                PREVIEW
              </Box>
            )}
          </Box>

          <Box sx={styles.cameraFooter}>
            <DevicePill
              icon="🎥"
              label={videoAvailable === null ? "Checking…" : videoAvailable ? "Camera on" : "No camera"}
              active={!!videoAvailable}
            />
            <DevicePill
              icon="🎙"
              label={audioAvailable === null ? "Checking…" : audioAvailable ? "Mic on" : "No mic"}
              active={!!audioAvailable}
            />
          </Box>
        </Box>

        {/* Right panel */}
        <Box sx={styles.formPanel}>

          {/* Name input */}
          <Box sx={styles.card}>
            <Typography sx={styles.fieldLabel}>Your name</Typography>
            <input
              style={styles.input}
              type="text"
              placeholder="e.g. Priya Sharma"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) setError("");
              }}
              autoComplete="off"
            />
          </Box>

          {/* Room ID */}
          <Box sx={styles.card}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography sx={styles.fieldLabel}>Room</Typography>
              <Box sx={styles.roomBadge}>{student_id}</Box>
            </Box>
          </Box>

          {/* Pre-flight checks */}
          <Box sx={styles.card}>
            <Typography sx={{ ...styles.fieldLabel, marginBottom: "10px" }}>
              Pre-flight checks
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <CheckItem state={getCheckState(videoAvailable)} label="Camera access" />
              <CheckItem state={getCheckState(audioAvailable)} label="Microphone access" />
              <CheckItem state={nameCheckState} label="Name entered" />
            </Box>
          </Box>

          {/* Error */}
          {error && (
            <Box sx={styles.errorBox}>
              <Typography sx={{ fontSize: "13px" }}>⚠ {error}</Typography>
            </Box>
          )}

          {/* Connect button */}
          <Box
            component="button"
            onClick={handleConnect}
            disabled={connecting}
            sx={styles.connectBtn}
          >
            {connecting ? "Connecting…" : "→ Join interview"}
          </Box>

        </Box>
      </Box>
    </Box>
  );
}

function DevicePill({ icon, label, active }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: "5px" }}>
      <Typography sx={{ fontSize: "14px" }}>{icon}</Typography>
      <Typography
        sx={{
          fontSize: "12px",
          color: active ? "#1D9E75" : "text.secondary",
          fontWeight: active ? 500 : 400,
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

function CheckItem({ state, label }) {
  const iconMap = { ok: "✓", fail: "✕", pending: "·" };
  const colorMap = {
    ok: { bg: "#E1F5EE", color: "#0F6E56" },
    fail: { bg: "#FCEBEB", color: "#A32D2D" },
    pending: { bg: "#F1EFE8", color: "#5F5E5A" },
  };
  const { bg, color } = colorMap[state];
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <Box
        sx={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: bg,
          color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "13px",
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        {iconMap[state]}
      </Box>
      <Typography sx={{ fontSize: "13px", color: "text.secondary" }}>{label}</Typography>
    </Box>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "2rem 1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
    fontFamily: "inherit",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    paddingBottom: "1.25rem",
    borderBottom: "0.5px solid",
    borderColor: "divider",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#1D9E75",
    boxShadow: "0 0 0 3px rgba(29,158,117,0.15)",
  },
  headerTitle: {
    fontSize: "15px",
    fontWeight: 500,
    letterSpacing: "0.02em",
  },
  clock: {
    fontSize: "13px",
    color: "text.secondary",
    marginLeft: "auto",
    fontVariantNumeric: "tabular-nums",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
    gap: "1.5rem",
    alignItems: "start",
  },
  cameraPanel: {
    border: "0.5px solid",
    borderColor: "divider",
    borderRadius: "12px",
    overflow: "hidden",
    background: "background.paper",
  },
  videoWrapper: {
    position: "relative",
    width: "100%",
    aspectRatio: "16/10",
    background: "#0a0a0a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  videoPlaceholder: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
  },
  previewBadge: {
    position: "absolute",
    top: "10px",
    left: "10px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(0,0,0,0.55)",
    borderRadius: "20px",
    padding: "4px 10px",
    fontSize: "11px",
    fontWeight: 500,
    color: "#fff",
    letterSpacing: "0.05em",
  },
  recDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#E24B4A",
    animation: "pulse 1.4s ease-in-out infinite",
    "@keyframes pulse": {
      "0%, 100%": { opacity: 1 },
      "50%": { opacity: 0.3 },
    },
  },
  cameraFooter: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "10px 16px",
    borderTop: "0.5px solid",
    borderColor: "divider",
  },
  formPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  card: {
    background: "background.paper",
    border: "0.5px solid",
    borderColor: "divider",
    borderRadius: "12px",
    padding: "1rem 1.25rem",
  },
  fieldLabel: {
    fontSize: "11px",
    fontWeight: 500,
    color: "text.secondary",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: "8px",
  },
  input: {
    width: "100%",
    height: "40px",
    padding: "0 12px",
    fontSize: "14px",
    border: "0.5px solid rgba(0,0,0,0.2)",
    borderRadius: "8px",
    background: "rgba(0,0,0,0.03)",
    outline: "none",
    fontFamily: "inherit",
    color: "inherit",
    boxSizing: "border-box",
  },
  roomBadge: {
    fontFamily: "monospace",
    fontSize: "13px",
    color: "text.secondary",
    background: "rgba(0,0,0,0.05)",
    padding: "4px 10px",
    borderRadius: "8px",
    border: "0.5px solid",
    borderColor: "divider",
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#A32D2D",
    background: "#FCEBEB",
    border: "0.5px solid #F09595",
    borderRadius: "8px",
    padding: "10px 12px",
  },
  connectBtn: {
    width: "100%",
    height: "44px",
    border: "none",
    borderRadius: "8px",
    background: "#111",
    color: "#fff",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "inherit",
    letterSpacing: "0.01em",
    transition: "opacity 0.15s, transform 0.1s",
    "&:hover": { opacity: 0.85 },
    "&:active": { transform: "scale(0.98)" },
    "&:disabled": { opacity: 0.5, cursor: "not-allowed" },
  },
};
