import db from "../config/db.js";

import Groq from "groq-sdk";
import dotenv from "dotenv";
import { parseJSONReply, clampScore, normalizeScorecard } from "../utils/aiParse.js";
dotenv.config({ path: "./.env" });

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = "llama-3.3-70b-versatile";

const cleanText = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : "");

export const getInterviewQuestions = async (req, res,next) => {
  try {
    const { topic, level , previousQuestions} = req.body;
    // Set when the practice session comes from a job application ("Prepare with AI")
    const role = cleanText(req.body.role, 100);

    const response = await groq.chat.completions.create({
      model:       MODEL,
      temperature: 0.7,
      max_tokens:  500,
      messages: [
        {
          role:    "user",
          content: `
            Generate a ${level} level interview question on the topic of ${topic}.
            ${role ? `The candidate is preparing for a ${role} role, so make it relevant to that job.` : ""}
            Provide only the question without any additional explanation or formatting.
            and previous question asked: ${previousQuestions ? previousQuestions.join(", ") : "None"}
          `
        },
      ],
    });

    console.log("Groq response:", response.choices[0].message.content);

    res.json({
        success: true,
        question: response.choices[0].message.content });
  }catch(err){
    console.log("Get questions error:", err);
    next(err);
  }
}

export const evaluateAnswer = async (req, res, next) => {
  try {
    const { question, answer } = req.body;

    if (!question || !answer) {
      return res.status(400).json({
        success: false,
        message: "Question and answer are required",
      });
    }

    const response = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0.7,
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content: `
You are an interview evaluator as well as teacher.

Evaluate the student's answer based on the given interview question and give feedback like you are a teacher and after evaluting like you are teaching.

Return only valid JSON in this format:
{
  "feedback": "short feedback here",
  "score": 7
}

Score should be from 0 to 10.
Do not include markdown.
Do not include extra text.
          `,
        },
        {
          role: "user",
          content: `
Question: ${question}

Student Answer: ${answer}
          `,
        },
      ],
    });

    const aiText = response.choices[0].message.content;
    console.log("AI Evaluate Response:", aiText);

    const parsed = parseJSONReply(aiText);
    const feedback = parsed?.feedback || aiText;
    const score = clampScore(parsed?.score);

    // Keep every scored answer: it becomes the candidate's readiness for that job
    if (score !== null) {
      const jobId = Number.parseInt(req.body.jobId, 10);
      try {
        await db.execute(
          `INSERT INTO mock_interviews (user_id, job_id, topic, level, question, answer, score, feedback)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            req.user.id,
            Number.isInteger(jobId) ? jobId : null,
            cleanText(req.body.topic, 100) || null,
            cleanText(req.body.level, 20) || null,
            cleanText(question, 2000),
            cleanText(answer, 5000),
            score,
            cleanText(feedback, 2000),
          ]
        );
      } catch (saveErr) {
        console.log("Save mock interview error:", saveErr.message);
      }
    }

    res.status(200).json({
      success: true,
      feedback,
      score,
    });
  } catch (err) {
    console.log("Evaluate Answer Error:", err);

    res.status(500).json({
      success: false,
      message: "Failed to evaluate answer",
      error: err.message,
    });
  }
};

// Interviewer-only: an AI scorecard for the live coding round, grounded in the real run output
export const reviewCode = async (req, res) => {
  try {
    const code = cleanText(req.body.code, 20000);
    const language = cleanText(req.body.language, 30);
    const output = cleanText(req.body.output, 4000);
    const problem = cleanText(req.body.problem, 2000);

    if (!code) {
      return res.status(400).json({ success: false, message: "Code is required" });
    }

    const response = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      max_tokens: 800,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `
You are a senior engineer helping an interviewer assess a candidate's code from a live coding interview.
Judge the code as written, using the actual execution output provided (it came from really running the code).
Do not assume behaviour that the output contradicts.

Return only a JSON object with exactly these keys:
{
  "correctness": 0-10,
  "efficiency": 0-10,
  "readability": 0-10,
  "edgeCases": 0-10,
  "timeComplexity": "Big-O, e.g. O(n log n)",
  "spaceComplexity": "Big-O",
  "summary": "2-3 sentences for the interviewer",
  "strengths": ["up to 3 short points"],
  "improvements": ["up to 3 short points"]
}
          `,
        },
        {
          role: "user",
          content: `
Problem (may be empty): ${problem || "Not provided; infer it from the code."}
Language: ${language || "unknown"}

Code:
${code}

Execution output:
${output || "The code has not been run yet."}
          `,
        },
      ],
    });

    const scorecard = normalizeScorecard(parseJSONReply(response.choices[0].message.content));

    if (!scorecard) {
      return res.status(502).json({ success: false, message: "The AI returned an unreadable review. Try again." });
    }

    res.status(200).json({ success: true, scorecard });
  } catch (err) {
    console.log("Review Code Error:", err);
    res.status(500).json({ success: false, message: "Failed to review code" });
  }
};
