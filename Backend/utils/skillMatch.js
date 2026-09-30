// Pure helpers behind job-targeted AI prep and the recruiter's readiness view

const normalize = (skill) => String(skill).trim().toLowerCase();

// Which of the job's required skills the candidate already lists, and which are missing
export const skillGap = (jobSkills, candidateSkills) => {
  const have = new Set(candidateSkills.map(normalize));
  const seen = new Set();
  const matched = [];
  const missing = [];

  for (const skill of jobSkills) {
    const key = normalize(skill);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    (have.has(key) ? matched : missing).push(skill.trim());
  }

  const total = matched.length + missing.length;
  return {
    matched,
    missing,
    matchPercent: total === 0 ? 0 : Math.round((matched.length / total) * 100),
  };
};

// Map a job's required experience (years) to the mock-interview difficulty
export const levelForExperience = (years) => {
  const y = Number(years) || 0;
  if (y >= 3) return "Hard";
  if (y >= 1) return "Medium";
  return "Easy";
};

// Average of the scored mock-interview answers, 1 decimal place
export const summarizeScores = (scores) => {
  const valid = scores.map(Number).filter((s) => Number.isFinite(s));
  if (valid.length === 0) return { attempts: 0, averageScore: null };
  const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
  return { attempts: valid.length, averageScore: Math.round(avg * 10) / 10 };
};
