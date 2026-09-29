import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import db from './config/db.js';
import { createToken } from './utils/jwt.js';
import { authCookieOptions } from './utils/cookieOptions.js';

const router = express.Router();
const googleClient = new OAuth2Client();

const clientUrl = () => process.env.CLIENT_URL || 'https://interviewos.online';

// Turn "Jane.Doe+x@gmail.com" into a free username like "jane_doe_x" / "jane_doe_x2"
const uniqueUsername = async (email) => {
  const base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 40) || 'user';
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? base : `${base}${i + 1}`;
    const [rows] = await db.execute('SELECT user_id FROM users WHERE username = ?', [candidate]);
    if (rows.length === 0) return candidate;
  }
  return `${base}_${crypto.randomBytes(3).toString('hex')}`;
};

// Existing account with the same email → log into it; otherwise create a verified candidate account
export const findOrCreateGoogleUser = async ({ email }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const [existing] = await db.execute(
    'SELECT user_id, role, profileExist FROM users WHERE email = ?',
    [normalizedEmail]
  );
  if (existing.length > 0) return existing[0];

  const username = await uniqueUsername(normalizedEmail);
  // Google users never type a password; store an unusable random one
  const password = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);

  const [result] = await db.execute(
    `INSERT INTO users (username, email, password, role, verify)
     VALUES (?, ?, ?, ?, ?)`,
    [username, normalizedEmail, password, 'user', true]
  );

  return { user_id: result.insertId, role: 'user', profileExist: 0 };
};

// ---- Step 1: Redirect user to Google's consent screen ----
router.get('/google', (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'select_account',
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

// ---- Step 2: Handle Google's callback ----
router.get('/google/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.redirect(`${clientUrl()}/login?error=oauth_failed`);

  try {
    // Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenRes.json();
    if (tokens.error) {
      throw new Error(tokens.error_description || tokens.error);
    }

    // Verify id_token before trusting it
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload.email || !payload.email_verified) {
      throw new Error('Google account email is not verified');
    }

    const user = await findOrCreateGoogleUser({ email: payload.email });

    // Same token + cookie as the username/password login
    const token = createToken({ id: user.user_id, role: user.role });
    res.cookie('token', token, {
      ...authCookieOptions(),
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    let next = '/';
    if (!user.profileExist) next = '/profileSetup';
    else if (user.role === 'interviewer') next = '/interviewer/dashboard';

    res.redirect(`${clientUrl()}${next}`);
  } catch (err) {
    console.error('Google OAuth error:', err.message);
    res.redirect(`${clientUrl()}/login?error=oauth_failed`);
  }
});

export default router;
