const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const { Event, Quiz, Question, Participant, Answer, Violation, AttemptViolation, QuizAttempt, ScheduledOccurrence, User, EventRegistration } = require('../models');
const { rankLeaderboard } = require('./scoringService');

// Load static events fallback if exists
let staticEvents = [];
try {
  const jsonPath = path.join(__dirname, '../data/events.json');
  if (fs.existsSync(jsonPath)) {
    staticEvents = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  }
} catch (e) {
  console.warn('Could not read static events.json in eventLeaderboardService:', e.message);
}

const isValidUUID = (val) => {
  return typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
};

const getQuizPlatformBaseUrl = () => {
  return (process.env.PUBLIC_QUIZ_URL || process.env.FRONTEND_URL || 'https://quiz.mscprpcem.tech').replace(/\/+$/, '');
};

/**
 * Resolves an Event from DB or static JSON by UUID, slug, or name
 */
async function resolveEvent(idOrSlug) {
  if (!idOrSlug) return null;
  const rawTarget = String(idOrSlug).trim();

  let event = null;
  if (isValidUUID(rawTarget)) {
    event = await Event.findByPk(rawTarget).catch(() => null);
  }

  if (!event) {
    const cleanSlug = rawTarget.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const rawName = rawTarget.replace(/-/g, ' ');

    event = await Event.findOne({
      where: {
        [Op.or]: [
          { slug: rawTarget },
          { slug: cleanSlug },
          { name: rawTarget },
          { name: rawName }
        ]
      }
    }).catch(() => null);
  }

  if (!event) {
    const allEvents = await Event.findAll().catch(() => []);
    const cleanTarget = rawTarget.toLowerCase().replace(/[^a-z0-9]+/g, '');
    event = allEvents.find(e => {
      const eSlug = (e.slug || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
      const eName = (e.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
      return eSlug === cleanTarget || eName === cleanTarget;
    });

    if (!event) {
      // Partial substring fallback
      event = allEvents.find(e => {
        const eSlug = (e.slug || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
        const eName = (e.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
        return (cleanTarget && (eSlug.includes(cleanTarget) || cleanTarget.includes(eSlug) || eName.includes(cleanTarget) || cleanTarget.includes(eName)));
      });
    }
  }

  if (!event) {
    // Check static events fallback
    const cleanTarget = rawTarget.toLowerCase().replace(/[^a-z0-9]+/g, '');
    const staticMatch = staticEvents.find(s => {
      const sId = (s.id || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
      const sTitle = (s.title || s.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
      return sId === cleanTarget || sTitle === cleanTarget;
    });

    if (staticMatch) {
      return {
        id: staticMatch.id,
        name: staticMatch.title || staticMatch.name,
        slug: staticMatch.id,
        description: staticMatch.description || '',
        poster_url: staticMatch.poster || 'https://mscprpcem.blob.core.windows.net/events/VisionX.png',
        category: staticMatch.category || 'Innovation Challenge',
        mode: staticMatch.mode || 'Offline',
        venue: staticMatch.venue || 'PRPCEM Campus',
        start_date: staticMatch.startDate ? new Date(staticMatch.startDate) : null,
        end_date: staticMatch.endDate ? new Date(staticMatch.endDate) : null,
        is_static: true
      };
    }
  }

  return event;
}

/**
 * Calculates the combined multi-week / multi-quiz leaderboard for an Event.
 * Aggregates all completed attempts across all quizzes that are part of the event.
 *
 * @param {string} idOrSlug - Event UUID, slug, or name
 * @param {Object} [options]
 * @param {boolean} [options.filterAuthenticatedOnly=false]
 * @returns {Promise<Object>} Combined Leaderboard Result
 */
async function getEventCombinedLeaderboard(idOrSlug, options = {}) {
  const baseUrl = getQuizPlatformBaseUrl();
  const event = await resolveEvent(idOrSlug);

  if (!event) {
    return {
      success: false,
      error: `Event "${idOrSlug}" not found.`,
      event: null,
      quizzes: [],
      leaderboard: [],
      summary: null
    };
  }

  const eventId = event.id;
  const eventSlug = event.slug || '';
  const eventNameLower = (event.name || '').toLowerCase().trim();

  // 1. Find all Quizzes linked to this Event
  const allQuizzes = await Quiz.findAll({
    include: [{ model: Question, as: 'questions', attributes: ['id', 'marks'] }],
    order: [
      ['scheduled_start', 'ASC'],
      ['createdAt', 'ASC']
    ]
  }).catch(() => []);

  const linkedQuizzes = allQuizzes.filter(q => {
    if (q.event_id && (q.event_id === eventId || q.event_id === eventSlug)) return true;
    if (q.event_name && q.event_name.toLowerCase().trim() === eventNameLower) return true;
    if (eventNameLower.includes('vision') && (q.event_name || '').toLowerCase().includes('vision')) return true;
    return false;
  });

  // Sort linked quizzes chronologically (e.g. Week 1, Week 2, Week 3)
  linkedQuizzes.sort((a, b) => {
    const timeA = a.scheduled_start ? new Date(a.scheduled_start).getTime() : new Date(a.createdAt).getTime();
    const timeB = b.scheduled_start ? new Date(b.scheduled_start).getTime() : new Date(b.createdAt).getTime();
    if (timeA !== timeB) return timeA - timeB;
    return (a.title || '').localeCompare(b.title || '');
  });

  const formattedQuizzes = linkedQuizzes.map((q, idx) => {
    const qQuestions = q.questions || [];
    const maxScore = qQuestions.length > 0
      ? qQuestions.reduce((sum, item) => sum + (Number(item.marks) > 0 ? Number(item.marks) : (Number(q.positive_marks) || 1)), 0)
      : (q.positive_marks || 1) * 10;

    return {
      id: q.id,
      title: q.title,
      week_number: idx + 1,
      mode: q.mode || 'SCHEDULED',
      status: q.status || 'completed',
      join_code: q.join_code,
      slug: q.custom_slug || q.id,
      total_questions: qQuestions.length,
      max_score: maxScore,
      positive_marks: q.positive_marks || 1,
      negative_marks: q.negative_marks || 0,
      scheduled_start: q.scheduled_start,
      scheduled_end: q.scheduled_end,
      direct_url: q.mode === 'SCHEDULED' ? `${baseUrl}/q/${q.custom_slug || q.id}` : `${baseUrl}/join/${q.join_code}`
    };
  });

  if (linkedQuizzes.length === 0) {
    return {
      success: true,
      event: {
        id: event.id,
        name: event.name,
        slug: event.slug,
        poster_url: event.poster_url,
        description: event.description,
        category: event.category,
        mode: event.mode,
        venue: event.venue
      },
      quizzes: [],
      leaderboard: [],
      summary: {
        total_quizzes: 0,
        total_participants: 0,
        highest_combined_score: 0,
        average_combined_score: 0
      }
    };
  }

  // 2. Fetch all completed attempts & participants for each linked quiz
  const quizIds = linkedQuizzes.map(q => q.id);

    const [scheduledAttempts, liveParticipants, liveAnswers, liveViolations] = await Promise.all([
    QuizAttempt.findAll({
      where: {
        quiz_id: { [Op.in]: quizIds },
        status: 'completed'
      },
      order: [
        ['attempt_number', 'DESC'],
        ['submitted_at', 'DESC'],
        ['createdAt', 'DESC']
      ]
    }).catch(() => []),

    Participant.findAll({
      where: { quiz_id: { [Op.in]: quizIds } }
    }).catch(() => []),

    Answer.findAll({
      include: [{
        model: Question,
        as: 'question',
        where: { quiz_id: { [Op.in]: quizIds } }
      }]
    }).catch(() => []),

    Violation.findAll({
      where: { quiz_id: { [Op.in]: quizIds } }
    }).catch(() => [])
  ]);

  // Index scheduled attempt violations
  const attemptIds = scheduledAttempts.map(a => a.id);
  const attemptViolations = attemptIds.length > 0
    ? await AttemptViolation.findAll({ where: { attempt_id: { [Op.in]: attemptIds } } }).catch(() => [])
    : [];
  const attemptViolationsMap = new Map();
  for (const av of attemptViolations) {
    const aid = String(av.attempt_id);
    attemptViolationsMap.set(aid, (attemptViolationsMap.get(aid) || 0) + 1);
  }

  // Index live answers and violations by participant_id
  const liveAnswersByParticipant = new Map();
  for (const ans of liveAnswers) {
    const pid = String(ans.participant_id);
    if (!liveAnswersByParticipant.has(pid)) liveAnswersByParticipant.set(pid, []);
    liveAnswersByParticipant.get(pid).push(ans);
  }

  const liveViolationsByParticipant = new Map();
  for (const v of liveViolations) {
    const pid = String(v.participant_id);
    liveViolationsByParticipant.set(pid, (liveViolationsByParticipant.get(pid) || 0) + 1);
  }

  // 3. Normalize per-quiz participant attempts
  // Map: quizId -> Map(userKey -> { score, correct, timeTaken, violations, submittedAt, ... })
  const quizAttemptsByUser = new Map();
  for (const q of linkedQuizzes) {
    quizAttemptsByUser.set(q.id, new Map());
  }

  // Process Scheduled Quiz Attempts
  for (const rawAtt of scheduledAttempts) {
    const att = rawAtt.toJSON ? rawAtt.toJSON() : rawAtt;
    const qId = att.quiz_id;
    if (!quizAttemptsByUser.has(qId)) continue;

    const userQuizMap = quizAttemptsByUser.get(qId);
    const ssoId = att.sso_user_id ? String(att.sso_user_id).trim() : '';
    const email = (att.participant_email || att.email || '').toLowerCase().trim();
    const name = (att.participant_name || att.name || '').trim();

    const userKey = ssoId ? `sso:${ssoId}` : (email ? `email:${email}` : `name:${name.toLowerCase()}`);
    if (!userKey || userKey === 'name:') continue;

    const existing = userQuizMap.get(userKey);
    const scorePolicy = linkedQuizzes.find(lq => lq.id === qId)?.score_policy || 'BEST';

    const currentScore = Number(att.score) || 0;
    const currentTime = Number(att.time_taken_seconds || att.time_taken) || 0;
    const currentCorrect = Number(att.correct_count) || 0;
    const vCountModel = Number(att.violation_count ?? att.violationsCount ?? 0) || 0;
    const vCountLogs = attemptViolationsMap.get(String(att.id)) || 0;
    const currentViolations = Math.max(vCountModel, vCountLogs);
    const currentSubmittedAt = att.submitted_at || att.createdAt;

    if (!existing) {
      userQuizMap.set(userKey, {
        name: name || 'Participant',
        email: email || '',
        sso_user_id: ssoId || null,
        score: currentScore,
        correct_count: currentCorrect,
        time_taken_seconds: currentTime,
        violation_count: currentViolations,
        submitted_at: currentSubmittedAt,
        attempt_id: att.id
      });
    } else {
      let shouldReplace = false;
      if (scorePolicy === 'BEST') {
        if (currentScore > existing.score || (currentScore === existing.score && currentTime < existing.time_taken_seconds)) {
          shouldReplace = true;
        }
      } else if (scorePolicy === 'LATEST') {
        const curTime = new Date(currentSubmittedAt).getTime();
        const exTime = new Date(existing.submitted_at).getTime();
        if (curTime >= exTime) shouldReplace = true;
      }

      if (shouldReplace) {
        userQuizMap.set(userKey, {
          name: name || existing.name,
          email: email || existing.email,
          sso_user_id: ssoId || existing.sso_user_id,
          score: currentScore,
          correct_count: currentCorrect,
          time_taken_seconds: currentTime,
          violation_count: currentViolations,
          submitted_at: currentSubmittedAt,
          attempt_id: att.id
        });
      }
    }
  }

  // Process Live Quiz Participants
  for (const p of liveParticipants) {
    const qId = p.quiz_id;
    if (!quizAttemptsByUser.has(qId)) continue;

    const userQuizMap = quizAttemptsByUser.get(qId);
    const ssoId = p.sso_user_id ? String(p.sso_user_id).trim() : '';
    const email = (p.email || '').toLowerCase().trim();
    const name = (p.name || '').trim();

    const userKey = ssoId ? `sso:${ssoId}` : (email ? `email:${email}` : `name:${name.toLowerCase()}`);
    if (!userKey || userKey === 'name:') continue;

    const pAnswers = liveAnswersByParticipant.get(String(p.id)) || [];
    const correctCount = pAnswers.filter(a => Boolean(a.is_correct)).length;
    const pointsSum = pAnswers.reduce((sum, a) => sum + (Number(a.points) || 0), 0);
    const totalTimeMs = pAnswers.reduce((sum, a) => sum + (Number(a.response_time) || 0), 0);
    const timeTakenSeconds = Math.round(totalTimeMs / 1000);
    const violations = liveViolationsByParticipant.get(String(p.id)) || (p.tab_switch_count || 0);

    userQuizMap.set(userKey, {
      name: name || 'Participant',
      email: email || '',
      sso_user_id: ssoId || null,
      score: pointsSum,
      correct_count: correctCount,
      time_taken_seconds: timeTakenSeconds,
      violation_count: violations,
      submitted_at: p.updatedAt || p.createdAt,
      attempt_id: p.id
    });
  }

  // 4. Combine multi-week scores per unique participant
  // User master map: userKey -> combined user stats
  const combinedUserMap = new Map();

  for (const [qId, userMap] of quizAttemptsByUser.entries()) {
    for (const [userKey, quizPerf] of userMap.entries()) {
      if (!combinedUserMap.has(userKey)) {
        combinedUserMap.set(userKey, {
          user_key: userKey,
          name: quizPerf.name || 'Participant',
          participant_name: quizPerf.name || 'Participant',
          email: quizPerf.email || '',
          participant_email: quizPerf.email || '',
          sso_user_id: quizPerf.sso_user_id || null,
          is_authenticated: Boolean(quizPerf.sso_user_id || (quizPerf.email && quizPerf.email.includes('@'))),
          is_guest: !Boolean(quizPerf.sso_user_id || (quizPerf.email && quizPerf.email.includes('@'))),
          total_score: 0,
          score: 0,
          total_correct: 0,
          correctAnswers: 0,
          correct_count: 0,
          total_time_taken: 0,
          time_taken_seconds: 0,
          total_violations: 0,
          violations: 0,
          quizzes_attempted: 0,
          total_event_quizzes: linkedQuizzes.length,
          quizzes_breakdown: {}
        });
      }

      const combinedUser = combinedUserMap.get(userKey);
      if (quizPerf.name && combinedUser.name === 'Participant') {
        combinedUser.name = quizPerf.name;
        combinedUser.participant_name = quizPerf.name;
      }
      if (quizPerf.email && !combinedUser.email) {
        combinedUser.email = quizPerf.email;
        combinedUser.participant_email = quizPerf.email;
      }
      if (quizPerf.sso_user_id && !combinedUser.sso_user_id) {
        combinedUser.sso_user_id = quizPerf.sso_user_id;
      }

      combinedUser.total_score += quizPerf.score;
      combinedUser.score = combinedUser.total_score;
      combinedUser.total_correct += quizPerf.correct_count;
      combinedUser.correctAnswers = combinedUser.total_correct;
      combinedUser.correct_count = combinedUser.total_correct;
      combinedUser.total_time_taken += quizPerf.time_taken_seconds;
      combinedUser.time_taken_seconds = combinedUser.total_time_taken;
      combinedUser.total_violations += quizPerf.violation_count;
      combinedUser.violations = combinedUser.total_violations;
      combinedUser.quizzes_attempted += 1;

      if (quizPerf.submitted_at) {
        if (!combinedUser.submitted_at || new Date(quizPerf.submitted_at) < new Date(combinedUser.submitted_at)) {
          combinedUser.submitted_at = quizPerf.submitted_at;
        }
      }

      combinedUser.quizzes_breakdown[qId] = {
        score: quizPerf.score,
        correct_count: quizPerf.correct_count,
        time_taken_seconds: quizPerf.time_taken_seconds,
        violation_count: quizPerf.violation_count,
        attempted: true,
        submitted_at: quizPerf.submitted_at,
        attempt_id: quizPerf.attempt_id
      };
    }
  }

  // Format array for ranking
  const rawCombinedList = Array.from(combinedUserMap.values()).map(user => {
    // Fill breakdown for all quizzes in the event series
    const breakdownList = formattedQuizzes.map((fq, idx) => {
      const qPerf = user.quizzes_breakdown[fq.id];
      return {
        quiz_id: fq.id,
        quiz_title: fq.title,
        week_number: idx + 1,
        week_label: `Week ${idx + 1}`,
        mode: fq.mode,
        max_score: fq.max_score,
        total_questions: fq.total_questions,
        attempted: Boolean(qPerf && qPerf.attempted),
        score: qPerf ? qPerf.score : 0,
        correct_count: qPerf ? qPerf.correct_count : 0,
        time_taken_seconds: qPerf ? qPerf.time_taken_seconds : 0,
        violation_count: qPerf ? qPerf.violation_count : 0,
        submitted_at: qPerf ? qPerf.submitted_at : null,
        attempt_id: qPerf ? qPerf.attempt_id : null
      };
    });

    return {
      ...user,
      breakdown: breakdownList,
      completion_rate: Math.round((user.quizzes_attempted / Math.max(1, linkedQuizzes.length)) * 100)
    };
  });

  // 5. Rank combined leaderboard using standardized multi-factor tie-breaking
  const rankedLeaderboard = rankLeaderboard(rawCombinedList, options);

  // Compute summary stats
  const totalParticipants = rankedLeaderboard.length;
  const highestScore = totalParticipants > 0 ? Math.max(...rankedLeaderboard.map(p => p.total_score || 0)) : 0;
  const avgScore = totalParticipants > 0
    ? Math.round(rankedLeaderboard.reduce((sum, p) => sum + (p.total_score || 0), 0) / totalParticipants)
    : 0;

  return {
    success: true,
    event: {
      id: event.id,
      name: event.name,
      slug: event.slug,
      poster_url: event.poster_url,
      description: event.description,
      category: event.category,
      mode: event.mode,
      venue: event.venue,
      start_date: event.start_date,
      end_date: event.end_date,
      leaderboard_default_view: event.leaderboard_default_view || 'all',
      total_quizzes: linkedQuizzes.length
    },
    default_view: event.leaderboard_default_view || 'all',
    quizzes: formattedQuizzes,
    leaderboard: rankedLeaderboard,
    summary: {
      total_quizzes: linkedQuizzes.length,
      total_participants: totalParticipants,
      highest_combined_score: highestScore,
      average_combined_score: avgScore
    }
  };
}

module.exports = {
  resolveEvent,
  getEventCombinedLeaderboard
};
