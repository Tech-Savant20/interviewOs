import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import express from "express";
import db from "./config/db.js";
import { createServer } from "http";
import { Server } from "socket.io";
import ExpressError from "./ExpressError.js";
import cors from "cors"
import { authMiddleware } from "./middleware/authValidate.js";
import { createToken } from "./utils/jwt.js";
import authRoutes from "./routes/auth.js";
import applicantRoutes from "./routes/Applicant.js";
import jobRoutes  from  "./routes/jobs.js"
import cookieParser from "cookie-parser";
import { chatSocket } from "./scokets/chatSocket.js";
import messageRoutes from "./routes/messages.js";
import aiInterviewRoutes from "./routes/aiInterview.js";
import interviewerDashboardRoutes from "./routes/interviewerDashboard.js";
import codeExecutionRoutes from "./routes/codeExecution.js";
import { LOCAL_RESUME_DIR } from "./controllers/jobs.js";
import googleAuthRouter from './googleAuth.js';
const app = express();
app.use(express.json());
app.use(cookieParser());


const allowedOrigins = [
  "http://interviewos.online",
  "https://interviewos.online",
  "http://www.interviewos.online",
  "https://www.interviewos.online",
  "http://ec2-13-126-64-8.ap-south-1.compute.amazonaws.com",
  // extra origins for local development, e.g. CLIENT_ORIGINS=http://localhost:5173
  ...(process.env.CLIENT_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean),
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

app.get("/api/me", authMiddleware, async (req, res,next) => {
  console.log("/me api hit")
  try {
    console.log("user:---",req.user)
    
    const userId = req.user.id;
    console.log("userId in /me",userId)

    
    const [rows] = await db.execute(
      "SELECT user_id, username , role FROM users WHERE user_id = ?",
      [userId]
    );

    console.log(rows)

    const user = rows[0];

    res.status(200).json({
      user
    });

  } catch (err) {
    console.log(err);
    next(new ExpressError("Failed to fetch user", 500));
  }
});

app.use("/api",authRoutes)
app.use("/api",applicantRoutes)
app.use("/api",jobRoutes)
app.use("/api",messageRoutes)
app.use("/api",aiInterviewRoutes)
app.use("/api",interviewerDashboardRoutes)
app.use("/api",codeExecutionRoutes)
app.use('/auth', googleAuthRouter);

if (process.env.RESUME_STORAGE === "local") {
  app.use("/uploads/resumes", express.static(LOCAL_RESUME_DIR));
}

// ✅ SOCKET
chatSocket(io);
export { io };

app.get("/test", (req, res) => {
  res.json({ message: "API is working!" });
});

app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something went wrong" } = err;

  res.status(statusCode).json({
    success: false,
    message: message
  });
});

// ✅ SERVER
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});