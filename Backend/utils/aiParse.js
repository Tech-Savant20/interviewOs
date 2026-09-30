// Turning LLM replies into safe, predictable values

// Parse the first JSON object in a reply (tolerates ```json fences and extra text)
export const parseJSONReply = (text) => {
  if (typeof text !== "string") return null;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
};

// A whole number from 0 to 10, or null if the model gave something else
export const clampScore = (value) => {
  const n = Number(value);
  if (value === null || value === undefined || value === "" || !Number.isFinite(n)) return null;
  return Math.min(10, Math.max(0, Math.round(n)));
};

const shortText = (value, max) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

const shortList = (value, maxItems, maxLen) =>
  Array.isArray(value)
    ? value.filter((v) => typeof v === "string" && v.trim()).slice(0, maxItems).map((v) => v.trim().slice(0, maxLen))
    : [];

export const SCORECARD_CRITERIA = ["correctness", "efficiency", "readability", "edgeCases"];

// Validate the live-coding scorecard the model returns; anything malformed becomes null/empty
export const normalizeScorecard = (raw) => {
  if (!raw || typeof raw !== "object") return null;

  const scores = {};
  for (const key of SCORECARD_CRITERIA) scores[key] = clampScore(raw[key]);

  const numeric = Object.values(scores).filter((s) => s !== null);
  if (numeric.length === 0) return null;

  return {
    scores,
    overall: Math.round((numeric.reduce((a, b) => a + b, 0) / numeric.length) * 10) / 10,
    timeComplexity: shortText(raw.timeComplexity, 40),
    spaceComplexity: shortText(raw.spaceComplexity, 40),
    summary: shortText(raw.summary, 600),
    strengths: shortList(raw.strengths, 4, 200),
    improvements: shortList(raw.improvements, 4, 200),
  };
};
