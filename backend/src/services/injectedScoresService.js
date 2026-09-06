const fs = require('fs');
const path = require('path');

const INJECTED_FILE_PATH = path.join(__dirname, '../data/injected_scores.json');

/**
 * Safely load injected scores from JSON file
 */
function loadInjectedScoresData() {
  try {
    if (!fs.existsSync(INJECTED_FILE_PATH)) {
      return [];
    }
    const raw = fs.readFileSync(INJECTED_FILE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Could not load injected scores JSON:', err.message);
    return [];
  }
}

/**
 * Find injected participant scores for a specific quiz by ID or Title
 * @param {string} quizId
 * @param {string} quizTitle
 * @returns {Array} List of participant attempt-like records
 */
function getInjectedScoresForQuiz(quizId, quizTitle = '') {
  const data = loadInjectedScoresData();
  const qId = String(quizId || '').trim();
  const titleLower = String(quizTitle || '').toLowerCase().trim();

  // Find matching quiz entry
  const matchedEntry = data.find((entry) => {
    if (entry.quiz_id && String(entry.quiz_id).trim() === qId) return true;
    if (entry.quiz_title && entry.quiz_title.toLowerCase().trim() === titleLower) return true;
    // Match common aliases (e.g. "Week 1" or "VisionX Season 2 — Week 1")
    if (titleLower.includes('week 1') && entry.quiz_title && entry.quiz_title.toLowerCase().includes('week 1')) return true;
    return false;
  });

  if (!matchedEntry || !Array.isArray(matchedEntry.participants)) {
    return [];
  }

  const effectiveQuizId = matchedEntry.quiz_id || qId;

  return matchedEntry.participants.map((p) => {
    const score = Number(p.score) || 0;
    const timeSeconds = Number(p.time_taken_seconds) || 0;
    const correctCount = score; // 1 pt per correct answer
    const totalQ = matchedEntry.total_questions || 20;
    const incorrectCount = Math.max(0, totalQ - correctCount);

    return {
      id: `injected_${effectiveQuizId}_${(p.email || p.name).replace(/[^a-zA-Z0-9]/g, '_')}`,
      quiz_id: effectiveQuizId,
      participant_name: p.name,
      participant_email: (p.email || '').toLowerCase().trim(),
      sso_user_id: null,
      score,
      correct_count: correctCount,
      incorrect_count: incorrectCount,
      unanswered_count: 0,
      time_taken_seconds: timeSeconds,
      status: p.status || 'completed',
      violations: p.violations || 0,
      submitted_at: '2026-02-15T12:00:00.000Z',
      createdAt: '2026-02-15T12:00:00.000Z',
      isInjected: true
    };
  });
}

/**
 * Get all injected participants mapped by quiz_id
 */
function getAllInjectedScoresMap() {
  const data = loadInjectedScoresData();
  const map = new Map();
  for (const entry of data) {
    if (entry.quiz_id && Array.isArray(entry.participants)) {
      map.set(String(entry.quiz_id).trim(), getInjectedScoresForQuiz(entry.quiz_id, entry.quiz_title));
    }
  }
  return map;
}

module.exports = {
  loadInjectedScoresData,
  getInjectedScoresForQuiz,
  getAllInjectedScoresMap
};
