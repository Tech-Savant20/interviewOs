import { test } from "node:test";
import assert from "node:assert/strict";
import { skillGap, levelForExperience, summarizeScores } from "../utils/skillMatch.js";
import { parseJSONReply, clampScore, normalizeScorecard } from "../utils/aiParse.js";

test("skillGap splits job skills into matched and missing, case-insensitively", () => {
  const gap = skillGap(["React", "Node.js", "Redis", "react"], ["node.js", " REACT ", "Python"]);
  assert.deepEqual(gap.matched, ["React", "Node.js"]);
  assert.deepEqual(gap.missing, ["Redis"]);
  assert.equal(gap.matchPercent, 67);
});

test("skillGap with no job skills is 0% and empty", () => {
  assert.deepEqual(skillGap([], ["React"]), { matched: [], missing: [], matchPercent: 0 });
});

test("levelForExperience maps years to difficulty", () => {
  assert.equal(levelForExperience(0), "Easy");
  assert.equal(levelForExperience(2), "Medium");
  assert.equal(levelForExperience(5), "Hard");
  assert.equal(levelForExperience(null), "Easy");
});

test("summarizeScores averages to one decimal", () => {
  assert.deepEqual(summarizeScores([8, 7, 7]), { attempts: 3, averageScore: 7.3 });
  assert.deepEqual(summarizeScores([]), { attempts: 0, averageScore: null });
});

test("parseJSONReply handles fenced and chatty replies", () => {
  assert.deepEqual(parseJSONReply('```json\n{"score": 7}\n```'), { score: 7 });
  assert.deepEqual(parseJSONReply('Sure! {"feedback":"ok","score":5} Hope that helps'), { feedback: "ok", score: 5 });
  assert.equal(parseJSONReply("no json here"), null);
  assert.equal(parseJSONReply("{broken"), null);
});

test("clampScore keeps whole numbers from 0 to 10", () => {
  assert.equal(clampScore(7.6), 8);
  assert.equal(clampScore("12"), 10);
  assert.equal(clampScore(-3), 0);
  assert.equal(clampScore("seven"), null);
  assert.equal(clampScore(null), null);
});

test("normalizeScorecard validates the live-coding review", () => {
  const card = normalizeScorecard({
    correctness: 9, efficiency: "6", readability: 8, edgeCases: 15,
    timeComplexity: "O(n)", summary: "Solid.", strengths: ["Clear names", 42], improvements: [],
  });
  assert.deepEqual(card.scores, { correctness: 9, efficiency: 6, readability: 8, edgeCases: 10 });
  assert.equal(card.overall, 8.3);
  assert.deepEqual(card.strengths, ["Clear names"]);
  assert.equal(card.spaceComplexity, "");

  assert.equal(normalizeScorecard({ summary: "no scores" }), null);
  assert.equal(normalizeScorecard(null), null);
});
