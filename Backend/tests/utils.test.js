import { test } from "node:test";
import assert from "node:assert/strict";
import ExpressError from "../ExpressError.js";
import { authCookieOptions } from "../utils/cookieOptions.js";
import { createToken, verfiyToken } from "../utils/jwt.js";

test("ExpressError accepts (status, message)", () => {
  const err = new ExpressError(404, "Job not found");
  assert.equal(err.statusCode, 404);
  assert.equal(err.message, "Job not found");
});

test("ExpressError accepts (message, status)", () => {
  const err = new ExpressError("Invalid status value", 400);
  assert.equal(err.statusCode, 400);
  assert.equal(err.message, "Invalid status value");
});

test("ExpressError defaults to 500", () => {
  assert.equal(new ExpressError("Something broke").statusCode, 500);
});

test("auth cookie is Secure + SameSite=None outside development", () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  assert.deepEqual(authCookieOptions(), { httpOnly: true, secure: true, sameSite: "none" });

  process.env.NODE_ENV = "development";
  assert.deepEqual(authCookieOptions(), { httpOnly: true, secure: false, sameSite: "lax" });
  process.env.NODE_ENV = previous;
});

test("JWT round-trips user id and role, and rejects tampered tokens", () => {
  process.env.JWT_SECRET = "test-secret";
  const token = createToken({ id: 7, role: "interviewer" });

  const decoded = verfiyToken(token);
  assert.equal(decoded.id, 7);
  assert.equal(decoded.role, "interviewer");

  assert.equal(verfiyToken(token.slice(0, -2) + "xx"), null);
});
