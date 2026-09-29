import db from "../config/db.js";
import ExpressError from "../ExpressError.js";
import { createToken , verfiyToken } from "../utils/jwt.js";
import redis from "../Redis.js";
import sendEmail from "../utils/SendEmail.js";
import { authCookieOptions } from "../utils/cookieOptions.js";

import bcrypt from "bcryptjs";

export const Signup = async (req, res, next) => {
  console.log("api hit");
  try {
    const { username, email, password, role } = req.body;

    // Validation
    if (!username || !email || !password) {
      return next(new ExpressError(400, "Username, email and password are required"));
    }

    // Validate role (only 'user' and 'interviewer' allowed during signup)
    const allowedRoles = ["user", "interviewer"];
    const selectedRole = allowedRoles.includes(role) ? role : "user";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return next(new ExpressError(400, "Please provide a valid email address"));
    }
    if (password.length < 8) {
      return next(new ExpressError(400, "Password must be at least 8 characters"));
    }

    // ✅ Check BOTH username AND email before hashing — correct column names
    const [existing] = await db.execute(
      "SELECT user_id, username, email FROM users WHERE username = ? OR email = ?",
      [username.trim(), email.trim().toLowerCase()]
    );

    if (existing.length > 0) {
      const taken = existing[0];
      if (taken.username === username.trim()) {
        return next(new ExpressError(409, "Username already taken"));
      }
      return next(new ExpressError(409, "Email already exists"));
    }

    // ✅ Hash AFTER duplicate check
    const hashedPassword = await bcrypt.hash(password, 10);

    
    

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    console.log(otp);

    await redis.set(`otp:${email}`, otp , "EX", 600);
     // Expire after 10 minutes


      await sendEmail({
      to: email,
      subject: "Verify your email - interviewOS",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
          <h2>Welcome to interviewOS 🌍</h2>
          <p>Use the OTP below to verify your email address:</p>
          <h1 style="letter-spacing: 8px; color: #4F46E5;">${otp}</h1>
          <p>This OTP will expire in <strong>10 minutes</strong>.</p>
          <p>If you didn't sign up, ignore this email.</p>
        </div>
      `
    });

       const pendingUser = {
       username: username.trim(),
       email: email.trim().toLowerCase(),
       password: hashedPassword,
       role: selectedRole,
      };

    await redis.set(
    `pendingUser:${email}`,
     JSON.stringify(pendingUser),
     "EX",
     600
     );

    

    res.status(201).json({
      success: true,
      message: "User signed up successfully!",
    });

  } catch (err) {
    console.log(err); // ✅ Always log the actual error during development
    if (err.code === "ER_DUP_ENTRY") {
      return next(new ExpressError(409, "Username or email already exists"));
    }
    return next(new ExpressError(500, "Internal Server Error"));
  }
};

export const Login = async (req, res, next) => {
  console.log("Login API hit");

  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return next(
        new ExpressError(400, "Username and password are required")
      );
    }

    // Find user
    const [users] = await db.execute(
      `SELECT user_id, username, password, role, verify
       FROM users 
       WHERE username = ?`,
      [username]
    );

    if (users.length === 0) {
      return next(
        new ExpressError(401, "Invalid username or password")
      );
    }

    const user = users[0];

    // Check if email is verified
    if (!user.verify) {
      return next(
        new ExpressError(403, "Please verify your email before logging in")
      );
    }

    // Password verification
    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return next(
        new ExpressError(401, "Invalid username or password")
      );
    }

    // JWT Payload
    const payload = {
      id: user.user_id,
      role: user.role,
    };

    const token = createToken(payload);

    // Cookie
    res.cookie("token", token, {
      ...authCookieOptions(),
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

   

    return res.status(200).json({
      success: true,
      message: "User successfully logged in",
      jwtToken: token,
      role: user.role,
    });

  } catch (err) {
    console.error("Login Error:", err);

    return next(
      new ExpressError(
        500,
        "Internal server error while logging in"
      )
    );
  }
};

export const logout = (req, res) => {
  console.log("Logout api hit")
  res.clearCookie("token", authCookieOptions());

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return next(
        new ExpressError(400, "Email and OTP required")
      );
    }

    const formattedEmail = email.trim().toLowerCase();

    // Get OTP from Redis
    const storedOtp = await redis.get(
      `otp:${formattedEmail}`
    );

    if (!storedOtp) {
      return next(
        new ExpressError(400, "OTP expired")
      );
    }

    // Compare OTP
    if (otp !== storedOtp) {
      return next(
        new ExpressError(400, "Invalid OTP")
      );
    }

    // Get pending user from Redis
    const pendingUser = await redis.get(
      `pendingUser:${formattedEmail}`
    );

    if (!pendingUser) {
      return next(
        new ExpressError(400, "Signup session expired")
      );
    }

    const userData = JSON.parse(pendingUser);

    // Insert VERIFIED user into DB
    const [result] = await db.execute(
      `INSERT INTO users 
      (username, email, password, role, verify)
      VALUES (?, ?, ?, ?, ?)`,
      [
        userData.username,
        userData.email,
        userData.password,
        userData.role,
        true,
      ]
    );

    // Create token
    const user = {
      id: result.insertId,
      role: userData.role,
    };

    const token = createToken(user);

    // Save cookie
    res.cookie("token", token, {
      ...authCookieOptions(),
      maxAge: 24 * 60 * 60 * 1000,
    });
    

    // Delete Redis temp data
    await redis.del(`otp:${formattedEmail}`);
    await redis.del(`pendingUser:${formattedEmail}`);

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });

  } catch (err) {
    console.log(err);

    return next(
      new ExpressError(500, "Internal Server Error")
    );
  }
};