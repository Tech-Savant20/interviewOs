import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { runCode, JUDGE0_LANGUAGES } from "../controllers/codeExecution.js";

const realFetch = globalThis.fetch;
let fetchCalls;
let userCounter = 0;

const b64 = (s) => Buffer.from(s, "utf8").toString("base64");

// Calls the controller with a fake req/res and resolves with { status, body }
const call = (body, userId = `user-${++userCounter}`) =>
  new Promise((resolve) => {
    const res = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      json(data) { resolve({ status: this.statusCode, body: data }); },
    };
    runCode({ body, user: { id: userId } }, res);
  });

const judge0Replies = (payload, ok = true) => {
  globalThis.fetch = async (url, options) => {
    fetchCalls.push({ url, options });
    return { ok, status: ok ? 200 : 503, json: async () => payload, text: async () => "down" };
  };
};

beforeEach(() => { fetchCalls = []; });
afterEach(() => { globalThis.fetch = realFetch; });

test("runs code and decodes Judge0 output", async () => {
  judge0Replies({ stdout: b64("42\n"), stderr: null, compile_output: null, message: null,
    status: { id: 3, description: "Accepted" }, time: "0.01", memory: 1024 });

  const { status, body } = await call({ language: "python", code: "print(42)", stdin: "7" });

  assert.equal(status, 200);
  assert.equal(body.success, true);
  assert.equal(body.stdout, "42\n");
  assert.equal(body.status, "Accepted");

  const sent = JSON.parse(fetchCalls[0].options.body);
  assert.equal(sent.language_id, JUDGE0_LANGUAGES.python);
  assert.equal(Buffer.from(sent.source_code, "base64").toString(), "print(42)");
  assert.equal(Buffer.from(sent.stdin, "base64").toString(), "7");
});

test("returns compile errors from Judge0", async () => {
  judge0Replies({ compile_output: b64("error: expected ';'"),
    status: { id: 6, description: "Compilation Error" } });

  const { body } = await call({ language: "cpp", code: "int main() { return 0 }" });

  assert.equal(body.statusId, 6);
  assert.match(body.compileOutput, /expected ';'/);
});

test("rejects unsupported languages without calling Judge0", async () => {
  const { status, body } = await call({ language: "cobol", code: "DISPLAY 'HI'" });

  assert.equal(status, 400);
  assert.equal(body.success, false);
  assert.equal(fetchCalls.length, 0);
});

test("rejects empty and oversized code", async () => {
  assert.equal((await call({ language: "python", code: "   " })).status, 400);
  assert.equal((await call({ language: "python", code: "x".repeat(70 * 1024) })).status, 413);
});

test("rate limits a user after 10 runs per minute", async () => {
  judge0Replies({ stdout: null, status: { id: 3, description: "Accepted" } });

  const statuses = [];
  for (let i = 0; i < 11; i++) {
    statuses.push((await call({ language: "python", code: "pass" }, "busy-user")).status);
  }

  assert.deepEqual(statuses.slice(0, 10), Array(10).fill(200));
  assert.equal(statuses[10], 429);
});

test("reports 502 when Judge0 is unavailable", async () => {
  judge0Replies({}, false);

  const { status, body } = await call({ language: "javascript", code: "console.log(1)" });

  assert.equal(status, 502);
  assert.equal(body.success, false);
});
