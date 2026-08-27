/**
 * Utilities for normalizing quiz answers, scoring comparisons, and question types.
 */

/**
 * Normalizes any answer representation into a sorted, comma-separated string of option keys (e.g., 'A,C', 'A', 'B').
 * Handles arrays (['A', 'C']), comma/space separated strings ('A, C', 'AC', 'A;C'), and True/False aliases.
 * 
 * @param {string|string[]|number|boolean|null|undefined} raw
 * @returns {string} e.g. "A", "B", "A,C", "A,B,D"
 */
function normalizeAnswers(raw) {
  if (raw === null || raw === undefined) return '';

  // Boolean or True/False text
  if (typeof raw === 'boolean') {
    return raw ? 'A' : 'B';
  }

  let str = '';
  if (Array.isArray(raw)) {
    str = raw.map(x => String(x || '').trim()).join(',');
  } else {
    str = String(raw).trim();
  }

  // Handle word aliases for True/False
  const upperTrimmed = str.toUpperCase().trim();
  if (upperTrimmed === 'TRUE' || upperTrimmed === 'T' || upperTrimmed === 'CORRECT') {
    return 'A';
  }
  if (upperTrimmed === 'FALSE' || upperTrimmed === 'F' || upperTrimmed === 'INCORRECT') {
    return 'B';
  }

  // Extract all valid uppercase option letters A, B, C, D
  // Handles strings like "A, B, C", "A,C", "A and C", "A; C", "AC", "Option A, Option C"
  const tokens = upperTrimmed
    .replace(/OPTION\s*/gi, '')
    .split(/[^A-D]+/)
    .filter(t => t.length > 0 && /^[A-D]+$/.test(t));

  const letters = new Set();
  tokens.forEach(token => {
    for (const char of token) {
      if (['A', 'B', 'C', 'D'].includes(char)) {
        letters.add(char);
      }
    }
  });

  return Array.from(letters).sort().join(',');
}

/**
 * Checks if a candidate's answer is correct compared to the question's correct answer.
 * 
 * @param {string|string[]|any} candidateAnswer
 * @param {string|string[]|any} correctAnswer
 * @returns {boolean}
 */
function isAnswerCorrect(candidateAnswer, correctAnswer) {
  const normCandidate = normalizeAnswers(candidateAnswer);
  const normCorrect = normalizeAnswers(correctAnswer);

  if (!normCandidate || !normCorrect) return false;
  return normCandidate === normCorrect;
}

/**
 * Determines the question type: 'true_false', 'multiple', or 'single'.
 * 
 * @param {object} question
 * @returns {'true_false'|'multiple'|'single'}
 */
function determineQuestionType(question) {
  if (!question) return 'single';

  // Explicit question_type property if provided
  if (question.question_type) {
    const qt = String(question.question_type).toLowerCase().trim();
    if (qt === 'true_false' || qt === 'tf' || qt === 'truefalse' || qt === 'boolean') {
      return 'true_false';
    }
    if (qt === 'multiple' || qt === 'multi' || qt === 'multiple_choice') {
      return 'multiple';
    }
    if (qt === 'single') {
      return 'single';
    }
  }

  // Check if options suggest True/False (Option A="True", Option B="False" and C/D empty)
  const optA = String(question.option_a || '').trim().toLowerCase();
  const optB = String(question.option_b || '').trim().toLowerCase();
  const optC = String(question.option_c || '').trim();
  const optD = String(question.option_d || '').trim();

  const isTFOpts = (optA === 'true' || optA === 't') && (optB === 'false' || optB === 'f') && (!optC || optC === '-') && (!optD || optD === '-');
  if (isTFOpts) {
    return 'true_false';
  }

  // Check if correct_answer has multiple comma-separated keys (e.g. 'A,C')
  const normCorrect = normalizeAnswers(question.correct_answer);
  if (normCorrect.includes(',')) {
    return 'multiple';
  }

  return 'single';
}

/**
 * Formats a normalized correct answer for human display (e.g., 'A, C' or 'True').
 * 
 * @param {string} normalizedAns
 * @param {'true_false'|'multiple'|'single'} qType
 * @returns {string}
 */
function formatDisplayAnswer(normalizedAns, qType) {
  if (!normalizedAns) return '';
  if (qType === 'true_false') {
    return normalizedAns === 'A' ? 'True' : 'False';
  }
  return normalizedAns.split(',').join(', ');
}

module.exports = {
  normalizeAnswers,
  isAnswerCorrect,
  determineQuestionType,
  formatDisplayAnswer
};
