import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

// Judge0 CE (RapidAPI) language ids, keyed by the Monaco language name used in the editor
export const JUDGE0_LANGUAGES = {
  javascript: 93, // Node.js 18.15.0
  typescript: 94, // TypeScript 5.0.3
  python: 92,     // Python 3.11.2
  java: 91,       // JDK 17.0.6
  cpp: 54,        // GCC 9.2.0
  c: 50,          // GCC 9.2.0
  csharp: 51,     // Mono 6.6.0
  go: 95,         // Go 1.18.5
  rust: 73,       // Rust 1.40.0
  kotlin: 78,     // Kotlin 1.3.70
  ruby: 72,       // Ruby 2.7.0
  php: 68,        // PHP 7.4.1
};

const JUDGE0_URL = process.env.JUDGE0_API_URL || "https://judge0-ce.p.rapidapi.com";
const MAX_SOURCE_BYTES = 64 * 1024;
const MAX_STDIN_BYTES = 16 * 1024;
const RUNS_PER_MINUTE = 10;

const runLog = new Map(); // userId -> timestamps of recent runs

const isRateLimited = (userId) => {
  const now = Date.now();
  const recent = (runLog.get(userId) || []).filter((t) => now - t < 60_000);
  if (recent.length >= RUNS_PER_MINUTE) {
    runLog.set(userId, recent);
    return true;
  }
  recent.push(now);
  runLog.set(userId, recent);
  return false;
};

const toBase64 = (text) => Buffer.from(text, "utf8").toString("base64");
const fromBase64 = (text) => (text ? Buffer.from(text, "base64").toString("utf8") : "");

const judge0Headers = () => {
  const headers = { "Content-Type": "application/json" };
  if (process.env.JUDGE0_API_KEY) {
    headers["X-RapidAPI-Key"] = process.env.JUDGE0_API_KEY;
    headers["X-RapidAPI-Host"] = new URL(JUDGE0_URL).host;
  }
  return headers;
};

export const runCode = async (req, res) => {
  try {
    const { language, code, stdin = "" } = req.body;
    const languageId = JUDGE0_LANGUAGES[language];

    if (!languageId) {
      return res.status(400).json({ success: false, message: `Unsupported language: ${language}` });
    }
    if (typeof code !== "string" || !code.trim()) {
      return res.status(400).json({ success: false, message: "Code is required" });
    }
    if (typeof stdin !== "string") {
      return res.status(400).json({ success: false, message: "stdin must be a string" });
    }
    if (Buffer.byteLength(code) > MAX_SOURCE_BYTES || Buffer.byteLength(stdin) > MAX_STDIN_BYTES) {
      return res.status(413).json({ success: false, message: "Code or input is too large" });
    }
    if (isRateLimited(String(req.user.id))) {
      return res.status(429).json({ success: false, message: "Too many runs. Wait a minute and try again." });
    }

    const response = await fetch(
      `${JUDGE0_URL}/submissions?base64_encoded=true&wait=true&fields=stdout,stderr,compile_output,message,status,time,memory`,
      {
        method: "POST",
        headers: judge0Headers(),
        body: JSON.stringify({
          language_id: languageId,
          source_code: toBase64(code),
          stdin: toBase64(stdin),
        }),
        signal: AbortSignal.timeout(20_000),
      }
    );

    if (!response.ok) {
      console.log("Judge0 error:", response.status, await response.text());
      return res.status(502).json({ success: false, message: "Code execution service is unavailable" });
    }

    const result = await response.json();

    res.status(200).json({
      success: true,
      status: result.status?.description || "Unknown",
      statusId: result.status?.id,
      stdout: fromBase64(result.stdout),
      stderr: fromBase64(result.stderr),
      compileOutput: fromBase64(result.compile_output),
      message: fromBase64(result.message),
      time: result.time,
      memory: result.memory,
    });
  } catch (err) {
    console.log("Run code error:", err);
    const timedOut = err.name === "TimeoutError";
    res.status(timedOut ? 504 : 500).json({
      success: false,
      message: timedOut ? "Code execution timed out" : "Failed to run code",
    });
  }
};
