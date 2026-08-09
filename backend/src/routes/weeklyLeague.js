const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { 
  sequelize, 
  League, 
  LeagueWeek, 
  Quiz, 
  Question, 
  QuizAttempt, 
  AttemptAnswer, 
  AttemptViolation, 
  WeeklyResult 
} = require('../models');
const authMiddleware = require('../middleware/auth');

// Utility helper to shuffle an array deterministically or randomly
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// =========================================================
// 1. ADMIN ROUTES (Protected with authMiddleware)
// =========================================================

// Create a new League with custom schedule (Daily, Weekly, Multiple Days, or Specific Dates)
router.post('/admin/leagues', authMiddleware, async (req, res) => {
  try {
    const { 
      name, description, type, startDate, endDate, 
      recurrence, repeatDays, customDates, numberOfWeeks, settings 
    } = req.body;

    if (!name || !startDate || !endDate) {
      return res.status(400).json({ error: 'Name, start date, and end date are required.' });
    }

    const league = await League.create({
      name,
      description,
      type: type || 'SCHEDULED_LEAGUE',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      recurrence: recurrence || 'weekly_1day',
      repeatDays: repeatDays || ['Monday'],
      customDates: customDates || [],
      numberOfWeeks: parseInt(numberOfWeeks) || 8,
      status: 'active',
      settings: settings || {}
    });

    const start = new Date(startDate);
    const end = new Date(endDate);
    const recMode = recurrence || 'weekly_1day';
    const targetDays = Array.isArray(repeatDays) ? repeatDays : ['Monday'];
    const datesList = Array.isArray(customDates) ? customDates : [];

    const defaultTopics = [
      'DSA & Programming', 'Azure & Cloud Basics', 'Databases & SQL', 
      'Cloud Computing Essentials', 'AI & ML Fundamentals', 'DevOps & CI/CD', 
      'Cybersecurity Essentials', 'Full Stack Final Challenge', 'System Architecture', 'Security & Cryptography'
    ];

    let slots = [];

    if (recMode === 'specific_dates' && datesList.length > 0) {
      // Generate slots for each specific date provided
      datesList.forEach((dStr, idx) => {
        const dStart = new Date(dStr);
        dStart.setHours(0, 0, 0, 0);
        const dEnd = new Date(dStr);
        dEnd.setHours(23, 59, 59, 999);
        slots.push({ start: dStart, end: dEnd, num: idx + 1 });
      });
    } else if (recMode === 'daily') {
      // Generate 1 slot per day
      let cur = new Date(start);
      let count = 1;
      while (cur <= end && count <= 60) {
        const dStart = new Date(cur);
        dStart.setHours(0, 0, 0, 0);
        const dEnd = new Date(cur);
        dEnd.setHours(23, 59, 59, 999);
        slots.push({ start: dStart, end: dEnd, num: count });
        cur.setDate(cur.getDate() + 1);
        count++;
      }
    } else if (recMode === 'weekly_multiple') {
      // Generate slots on specified days of week
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      let cur = new Date(start);
      let count = 1;
      while (cur <= end && count <= 52) {
        const dayName = dayNames[cur.getDay()];
        if (targetDays.includes(dayName)) {
          const dStart = new Date(cur);
          dStart.setHours(0, 0, 0, 0);
          const dEnd = new Date(cur);
          dEnd.setHours(23, 59, 59, 999);
          slots.push({ start: dStart, end: dEnd, num: count });
          count++;
        }
        cur.setDate(cur.getDate() + 1);
      }
    } else {
      // Default: Weekly 1 day (e.g. 8 weeks)
      const numWeeks = parseInt(numberOfWeeks) || 8;
      for (let i = 1; i <= numWeeks; i++) {
        const weekStart = new Date(start.getTime() + (i - 1) * 7 * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1000);
        slots.push({ start: weekStart, end: weekEnd, num: i });
      }
    }

    // Create LeagueWeek records
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      const topicIndex = i % defaultTopics.length;
      await LeagueWeek.create({
        league_id: league.id,
        week_number: slot.num,
        title: `Session ${slot.num}: ${defaultTopics[topicIndex]}`,
        technology: defaultTopics[topicIndex].split(' ')[0] || 'General CS',
        description: `Scheduled session #${slot.num} for ${league.name}`,
        start_date_time: slot.start,
        end_date_time: slot.end,
        status: 'upcoming',
        published: true,
        enabled: true
      });
    }

    const createdLeague = await League.findByPk(league.id, {
      include: [{ model: LeagueWeek, as: 'weeks' }]
    });

    return res.json({ success: true, league: createdLeague });
  } catch (error) {
    console.error('Create league error:', error);
    return res.status(500).json({ error: 'Failed to create league' });
  }
});

// Add a single custom week / session to an existing League
router.post('/admin/leagues/:id/weeks', authMiddleware, async (req, res) => {
  try {
    const league = await League.findByPk(req.params.id, {
      include: [{ model: LeagueWeek, as: 'weeks' }]
    });
    if (!league) return res.status(404).json({ error: 'League not found' });

    const { title, technology, description, quizId, startDateTime, endDateTime, settings } = req.body;

    const nextWeekNum = (league.weeks?.length || 0) + 1;
    const start = startDateTime ? new Date(startDateTime) : new Date();
    const end = endDateTime ? new Date(endDateTime) : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

    const week = await LeagueWeek.create({
      league_id: league.id,
      week_number: nextWeekNum,
      title: title || `Session ${nextWeekNum}: Tech Challenge`,
      technology: technology || 'General CS',
      description: description || `Custom scheduled session #${nextWeekNum}`,
      quiz_id: quizId || null,
      start_date_time: start,
      end_date_time: end,
      status: 'upcoming',
      published: true,
      enabled: true,
      settings: settings || {}
    });

    return res.json({ success: true, week });
  } catch (error) {
    console.error('Add custom week error:', error);
    return res.status(500).json({ error: 'Failed to add session' });
  }
});

// Delete a week / session
router.delete('/admin/weeks/:weekId', authMiddleware, async (req, res) => {
  try {
    const week = await LeagueWeek.findByPk(req.params.weekId);
    if (!week) return res.status(404).json({ error: 'Session not found' });
    await week.destroy();
    return res.json({ success: true, message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Delete week error:', error);
    return res.status(500).json({ error: 'Failed to delete session' });
  }
});

// List all Leagues
router.get('/admin/leagues', authMiddleware, async (req, res) => {
  try {
    const leagues = await League.findAll({
      include: [{ model: LeagueWeek, as: 'weeks', include: [{ model: Quiz, as: 'quiz' }] }],
      order: [['createdAt', 'DESC']]
    });
    return res.json({ success: true, leagues });
  } catch (error) {
    console.error('List leagues error:', error);
    return res.status(500).json({ error: 'Failed to fetch leagues' });
  }
});

// Get Single League Details (Admin)
router.get('/admin/leagues/:id', authMiddleware, async (req, res) => {
  try {
    const league = await League.findByPk(req.params.id, {
      include: [
        { 
          model: LeagueWeek, 
          as: 'weeks',
          include: [{ model: Quiz, as: 'quiz', include: [{ model: Question, as: 'questions' }] }]
        }
      ],
      order: [[{ model: LeagueWeek, as: 'weeks' }, 'week_number', 'ASC']]
    });
    if (!league) return res.status(404).json({ error: 'League not found' });
    return res.json({ success: true, league });
  } catch (error) {
    console.error('Get league error:', error);
    return res.status(500).json({ error: 'Failed to fetch league' });
  }
});

// Update League details
router.put('/admin/leagues/:id', authMiddleware, async (req, res) => {
  try {
    const league = await League.findByPk(req.params.id);
    if (!league) return res.status(404).json({ error: 'League not found' });

    const { name, description, startDate, endDate, status, settings } = req.body;
    if (name) league.name = name;
    if (description !== undefined) league.description = description;
    if (startDate) league.startDate = new Date(startDate);
    if (endDate) league.endDate = new Date(endDate);
    if (status) league.status = status;
    if (settings) league.settings = { ...league.settings, ...settings };

    await league.save();
    return res.json({ success: true, league });
  } catch (error) {
    console.error('Update league error:', error);
    return res.status(500).json({ error: 'Failed to update league' });
  }
});

// Delete League
router.delete('/admin/leagues/:id', authMiddleware, async (req, res) => {
  try {
    const league = await League.findByPk(req.params.id);
    if (!league) return res.status(404).json({ error: 'League not found' });
    await league.destroy();
    return res.json({ success: true, message: 'League deleted successfully' });
  } catch (error) {
    console.error('Delete league error:', error);
    return res.status(500).json({ error: 'Failed to delete league' });
  }
});

// Update LeagueWeek Details & Quiz Config
router.put('/admin/weeks/:weekId', authMiddleware, async (req, res) => {
  try {
    const week = await LeagueWeek.findByPk(req.params.weekId);
    if (!week) return res.status(404).json({ error: 'Week not found' });

    const { 
      title, technology, description, quizId, 
      startDateTime, endDateTime, status, published, enabled, settings 
    } = req.body;

    if (title) week.title = title;
    if (technology) week.technology = technology;
    if (description !== undefined) week.description = description;
    if (quizId !== undefined) week.quiz_id = quizId || null;
    if (startDateTime) week.start_date_time = new Date(startDateTime);
    if (endDateTime) week.end_date_time = new Date(endDateTime);
    if (status) week.status = status;
    if (published !== undefined) week.published = published;
    if (enabled !== undefined) week.enabled = enabled;
    if (settings) week.settings = { ...week.settings, ...settings };

    // If a quiz is bound to this week, set quiz mode to WEEKLY_LEAGUE
    if (quizId) {
      const quiz = await Quiz.findByPk(quizId);
      if (quiz) {
        quiz.mode = 'WEEKLY_LEAGUE';
        await quiz.save();
      }
    }

    await week.save();
    return res.json({ success: true, week });
  } catch (error) {
    console.error('Update week error:', error);
    return res.status(500).json({ error: 'Failed to update week' });
  }
});

// Toggle Publish Week
router.post('/admin/weeks/:weekId/publish', authMiddleware, async (req, res) => {
  try {
    const week = await LeagueWeek.findByPk(req.params.weekId);
    if (!week) return res.status(404).json({ error: 'Week not found' });
    week.published = !week.published;
    await week.save();
    return res.json({ success: true, published: week.published, week });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to toggle publish status' });
  }
});

// Reopen a closed week
router.post('/admin/weeks/:weekId/reopen', authMiddleware, async (req, res) => {
  try {
    const week = await LeagueWeek.findByPk(req.params.weekId);
    if (!week) return res.status(404).json({ error: 'Week not found' });
    week.status = 'open';
    await week.save();
    return res.json({ success: true, message: 'Week reopened successfully', week });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to reopen week' });
  }
});

// Admin view all attempts & violations for a league
router.get('/admin/leagues/:id/attempts', authMiddleware, async (req, res) => {
  try {
    const attempts = await QuizAttempt.findAll({
      where: { league_id: req.params.id },
      include: [
        { model: LeagueWeek, as: 'leagueWeek' },
        { model: AttemptViolation, as: 'violations' }
      ],
      order: [['createdAt', 'DESC']]
    });
    return res.json({ success: true, attempts });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch attempts' });
  }
});

// =========================================================
// 2. PARTICIPANT & PUBLIC LEAGUE ROUTES
// =========================================================

// Get Active League & User Overview
router.get('/active', async (req, res) => {
  try {
    const userId = req.query.userId || req.headers['x-user-id'] || null;

    // Find latest active league
    let league = await League.findOne({
      where: { status: 'active' },
      include: [
        { 
          model: LeagueWeek, 
          as: 'weeks',
          include: [{ model: Quiz, as: 'quiz', attributes: ['id', 'title', 'subject'] }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    if (!league) {
      // Fallback to any league
      league = await League.findOne({
        include: [{ model: LeagueWeek, as: 'weeks' }],
        order: [['createdAt', 'DESC']]
      });
    }

    if (!league) {
      return res.json({ success: true, activeLeague: null, currentWeek: null });
    }

    const now = new Date();

    // Auto-update week status based on current date
    const updatedWeeks = await Promise.all(league.weeks.map(async (w) => {
      const start = new Date(w.start_date_time);
      const end = new Date(w.end_date_time);

      let computedStatus = w.status;
      if (w.enabled && w.published) {
        if (now >= start && now <= end) {
          computedStatus = 'open';
        } else if (now > end && w.status !== 'finalized') {
          computedStatus = 'closed';
        } else if (now < start) {
          computedStatus = 'upcoming';
        }
      }

      if (computedStatus !== w.status) {
        w.status = computedStatus;
        await w.save();
      }
      return w;
    }));

    // Find current open week
    const currentWeek = updatedWeeks.find(w => w.status === 'open') || updatedWeeks.find(w => w.status === 'upcoming') || updatedWeeks[0];

    // User progress if userId provided
    let userProgress = [];
    if (userId) {
      userProgress = await WeeklyResult.findAll({
        where: { user_id: userId, league_id: league.id }
      });
    }

    return res.json({
      success: true,
      activeLeague: league,
      weeks: updatedWeeks.sort((a, b) => a.week_number - b.week_number),
      currentWeek,
      userProgress
    });
  } catch (error) {
    console.error('Fetch active league error:', error);
    return res.status(500).json({ error: 'Failed to fetch active league' });
  }
});

// Get User's League Progress
router.get('/my-progress', async (req, res) => {
  try {
    const userId = req.query.userId || req.headers['x-user-id'];
    const leagueId = req.query.leagueId;

    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const results = await WeeklyResult.findAll({
      where: leagueId ? { user_id: userId, league_id: leagueId } : { user_id: userId },
      include: [{ model: LeagueWeek, as: 'leagueWeek' }],
      order: [[{ model: LeagueWeek, as: 'leagueWeek' }, 'week_number', 'ASC']]
    });

    const attempts = await QuizAttempt.findAll({
      where: { user_id: userId },
      include: [{ model: LeagueWeek, as: 'leagueWeek' }],
      order: [['createdAt', 'DESC']]
    });

    const totalScore = results.reduce((acc, r) => acc + (r.score || 0), 0);

    return res.json({
      success: true,
      totalScore,
      weeksCompleted: results.length,
      results,
      attempts
    });
  } catch (error) {
    console.error('My progress error:', error);
    return res.status(500).json({ error: 'Failed to fetch user progress' });
  }
});

// Get Weekly Leaderboard
router.get('/weeks/:weekId/leaderboard', async (req, res) => {
  try {
    const week = await LeagueWeek.findByPk(req.params.weekId, {
      include: [{ model: League, as: 'league' }]
    });
    if (!week) return res.status(404).json({ error: 'Week not found' });

    const privacy = week.league?.settings?.leaderboardPrivacy || {};

    const results = await WeeklyResult.findAll({
      where: { league_week_id: req.params.weekId },
      order: [
        ['score', 'DESC'],
        ['time_taken', 'ASC'],
        ['createdAt', 'ASC']
      ]
    });

    // Apply ranking numbers
    const rankedResults = results.map((r, idx) => ({
      rank: idx + 1,
      id: r.id,
      user_id: r.user_id,
      user_name: privacy.showNames !== false ? r.user_name : `Participant #${idx + 1}`,
      user_college: r.user_college,
      score: privacy.showScores !== false ? r.score : 'Hidden',
      correct_count: r.correct_count,
      time_taken: r.time_taken
    }));

    const finalResults = privacy.showTop10Only ? rankedResults.slice(0, 10) : rankedResults;

    return res.json({
      success: true,
      weekTitle: week.title,
      leaderboard: finalResults,
      totalParticipants: results.length
    });
  } catch (error) {
    console.error('Weekly leaderboard error:', error);
    return res.status(500).json({ error: 'Failed to fetch weekly leaderboard' });
  }
});

// Get Overall Cumulative Leaderboard
router.get('/leagues/:id/leaderboard', async (req, res) => {
  try {
    const league = await League.findByPk(req.params.id, {
      include: [{ model: LeagueWeek, as: 'weeks' }]
    });
    if (!league) return res.status(404).json({ error: 'League not found' });

    const settings = league.settings || {};
    const privacy = settings.leaderboardPrivacy || {};

    // Fetch all results for this league
    const allResults = await WeeklyResult.findAll({
      where: { league_id: req.params.id },
      include: [{ model: LeagueWeek, as: 'leagueWeek' }]
    });

    // Aggregate by user_id
    const userMap = {};

    allResults.forEach(r => {
      if (!userMap[r.user_id]) {
        userMap[r.user_id] = {
          user_id: r.user_id,
          user_name: r.user_name,
          user_college: r.user_college,
          scores: {},
          weeksCompleted: 0,
          totalScore: 0,
          totalTime: 0
        };
      }
      userMap[r.user_id].scores[`w${r.leagueWeek?.week_number}`] = r.score;
      userMap[r.user_id].weeksCompleted += 1;
      userMap[r.user_id].totalTime += (r.time_taken || 0);
    });

    // Calculate overall score according to admin settings (Drop lowest, weights, etc.)
    const leaderboardList = Object.values(userMap).map(u => {
      let weekScores = Object.values(u.scores);

      if (settings.dropLowestScore && weekScores.length > 1) {
        // Drop lowest score
        const minScore = Math.min(...weekScores);
        const minIdx = weekScores.indexOf(minScore);
        weekScores.splice(minIdx, 1);
      }

      const finalTotalScore = weekScores.reduce((sum, s) => sum + s, 0);
      return {
        ...u,
        totalScore: Math.round(finalTotalScore * 100) / 100
      };
    });

    // Filter minimum weeks required if configured
    const minWeeks = settings.minWeeksRequired || 0;
    const eligibleList = leaderboardList.filter(u => u.weeksCompleted >= minWeeks);

    // Sort by Total Score DESC -> Total Time ASC
    eligibleList.sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      return a.totalTime - b.totalTime;
    });

    const rankedLeaderboard = eligibleList.map((u, idx) => ({
      rank: idx + 1,
      user_id: u.user_id,
      user_name: privacy.showNames !== false ? u.user_name : `Participant #${idx + 1}`,
      user_college: u.user_college,
      weeksCompleted: u.weeksCompleted,
      scores: u.scores,
      totalScore: privacy.showScores !== false ? u.totalScore : 'Hidden',
      totalTime: u.totalTime
    }));

    const finalOutput = privacy.showTop10Only ? rankedLeaderboard.slice(0, 10) : rankedLeaderboard;

    return res.json({
      success: true,
      leagueName: league.name,
      leaderboard: finalOutput,
      totalParticipants: eligibleList.length
    });
  } catch (error) {
    console.error('Cumulative leaderboard error:', error);
    return res.status(500).json({ error: 'Failed to fetch cumulative leaderboard' });
  }
});

// =========================================================
// 3. QUIZ ATTEMPT & EXECUTOR API
// =========================================================

// Start a new QuizAttempt
router.post('/weeks/:weekId/attempt', async (req, res) => {
  try {
    const { userId, userName, userCollege } = req.body;
    if (!userId || !userName) {
      return res.status(400).json({ error: 'User ID and User Name are required to start attempt' });
    }

    const week = await LeagueWeek.findByPk(req.params.weekId, {
      include: [
        { model: League, as: 'league' },
        { model: Quiz, as: 'quiz', include: [{ model: Question, as: 'questions' }] }
      ]
    });

    if (!week) return res.status(404).json({ error: 'League Week not found' });
    if (!week.enabled || !week.published) {
      return res.status(403).json({ error: 'This weekly quiz is currently disabled or unpublished.' });
    }

    const now = new Date();
    const start = new Date(week.start_date_time);
    const end = new Date(week.end_date_time);

    // Verify availability window
    if (now < start || now > end) {
      if (week.status !== 'open') {
        return res.status(403).json({ error: 'This weekly quiz window is currently closed.' });
      }
    }

    if (!week.quiz || !week.quiz.questions || week.quiz.questions.length === 0) {
      return res.status(400).json({ error: 'No quiz or questions configured for this week yet.' });
    }

    const settings = week.settings || {};

    // Check max attempts
    const existingAttempts = await QuizAttempt.findAll({
      where: {
        user_id: userId,
        league_week_id: week.id
      }
    });

    const activeAttempt = existingAttempts.find(a => a.status === 'in_progress' && new Date() < new Date(a.expires_at));
    if (activeAttempt) {
      // Resume active in-progress attempt
      return res.json({ success: true, attemptId: activeAttempt.id, resumed: true });
    }

    const maxAttempts = settings.maxAttempts !== undefined ? settings.maxAttempts : 1;
    if (maxAttempts > 0 && existingAttempts.length >= maxAttempts) {
      return res.status(403).json({ 
        error: `Maximum attempts limit reached (${existingAttempts.length}/${maxAttempts}). You cannot take this quiz again.` 
      });
    }

    // Shuffle Questions per attempt if enabled
    let questionsList = [...week.quiz.questions];
    if (settings.shuffleQuestions !== false) {
      questionsList = shuffleArray(questionsList);
    }
    const questionOrder = questionsList.map(q => q.id);

    // Shuffle Answer Options per attempt if enabled
    const optionOrder = {};
    questionsList.forEach(q => {
      const options = ['A', 'B', 'C', 'D'];
      optionOrder[q.id] = settings.shuffleAnswers !== false ? shuffleArray(options) : options;
    });

    // Time limit in minutes
    const timeLimitMins = settings.timeLimit || 30;
    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + timeLimitMins * 60 * 1000);

    const attempt = await QuizAttempt.create({
      user_id: userId,
      user_name: userName,
      user_college: userCollege || 'Student',
      quiz_id: week.quiz_id,
      league_id: week.league_id,
      league_week_id: week.id,
      attempt_number: existingAttempts.length + 1,
      started_at: startedAt,
      expires_at: expiresAt,
      status: 'in_progress',
      question_order: questionOrder,
      option_order: optionOrder
    });

    return res.json({
      success: true,
      attemptId: attempt.id,
      attemptNumber: attempt.attempt_number,
      expiresAt: attempt.expires_at
    });
  } catch (error) {
    console.error('Start attempt error:', error);
    return res.status(500).json({ error: 'Failed to start quiz attempt' });
  }
});

// Resume & Fetch Active QuizAttempt (Sanitized: NO CORRECT ANSWERS SENT TO CLIENT)
router.get('/attempts/:attemptId', async (req, res) => {
  try {
    const attempt = await QuizAttempt.findByPk(req.params.attemptId, {
      include: [
        { model: LeagueWeek, as: 'leagueWeek' },
        { model: League, as: 'league' },
        { model: AttemptAnswer, as: 'answers' },
        { model: AttemptViolation, as: 'violations' }
      ]
    });

    if (!attempt) return res.status(404).json({ error: 'Quiz attempt not found' });

    const now = new Date();
    const expiresAt = new Date(attempt.expires_at);

    // Auto-submit if expired
    if (attempt.status === 'in_progress' && now >= expiresAt) {
      attempt.status = 'expired';
      await attempt.save();
      await finalizeAttemptScore(attempt.id, 'expired');
    }

    // Fetch questions in randomized question order
    const questionIds = attempt.question_order || [];
    const rawQuestions = await Question.findAll({
      where: { id: { [Op.in]: questionIds } }
    });

    // Sort questions according to stored attempt questionOrder
    const questionMap = {};
    rawQuestions.forEach(q => { questionMap[q.id] = q; });
    const orderedQuestions = questionIds.map(id => questionMap[id]).filter(Boolean);

    const optionOrderMap = attempt.option_order || {};

    // Sanitize questions (Remove correct_answer for client security)
    const sanitizedQuestions = orderedQuestions.map(q => {
      const allowedOptions = optionOrderMap[q.id] || ['A', 'B', 'C', 'D'];
      const rawOptions = {
        A: q.option_a,
        B: q.option_b,
        C: q.option_c,
        D: q.option_d
      };

      const mappedOptions = allowedOptions.map(optKey => ({
        key: optKey,
        text: rawOptions[optKey]
      }));

      return {
        id: q.id,
        question: q.question,
        options: mappedOptions,
        marks: q.marks,
        timer: q.timer
      };
    });

    // Map existing saved answers
    const savedAnswers = {};
    (attempt.answers || []).forEach(a => {
      savedAnswers[a.question_id] = a.selected_option;
    });

    const remainingSeconds = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));

    return res.json({
      success: true,
      attempt: {
        id: attempt.id,
        status: attempt.status,
        userName: attempt.user_name,
        leagueName: attempt.league?.name,
        weekTitle: attempt.leagueWeek?.title,
        weekNumber: attempt.leagueWeek?.week_number,
        technology: attempt.leagueWeek?.technology,
        settings: attempt.leagueWeek?.settings || {},
        startedAt: attempt.started_at,
        expiresAt: attempt.expires_at,
        remainingSeconds,
        score: attempt.score,
        correctCount: attempt.correct_count,
        incorrectCount: attempt.incorrect_count,
        unansweredCount: attempt.unanswered_count,
        timeTaken: attempt.time_taken,
        violationCount: attempt.violation_count || 0
      },
      questions: sanitizedQuestions,
      savedAnswers
    });
  } catch (error) {
    console.error('Fetch attempt error:', error);
    return res.status(500).json({ error: 'Failed to load quiz attempt' });
  }
});

// Continuous Per-Question Answer Autosave
router.post('/attempts/:attemptId/answers', async (req, res) => {
  try {
    const { questionId, selectedOption } = req.body;
    if (!questionId || !selectedOption) {
      return res.status(400).json({ error: 'Question ID and selected option required' });
    }

    const attempt = await QuizAttempt.findByPk(req.params.attemptId);
    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
    if (attempt.status !== 'in_progress') {
      return res.status(400).json({ error: 'Attempt is no longer in progress' });
    }

    // Verify correct answer on backend
    const question = await Question.findByPk(questionId);
    if (!question) return res.status(404).json({ error: 'Question not found' });

    const isCorrect = (selectedOption === question.correct_answer);

    const [answerRecord, created] = await AttemptAnswer.findOrCreate({
      where: { attempt_id: attempt.id, question_id: questionId },
      defaults: {
        selected_option: selectedOption,
        is_correct: isCorrect,
        answered_at: new Date()
      }
    });

    if (!created) {
      answerRecord.selected_option = selectedOption;
      answerRecord.is_correct = isCorrect;
      answerRecord.answered_at = new Date();
      await answerRecord.save();
    }

    return res.json({ success: true, saved: true });
  } catch (error) {
    console.error('Save answer error:', error);
    return res.status(500).json({ error: 'Failed to save answer' });
  }
});

// Anti-Cheat Violation Logger
router.post('/attempts/:attemptId/violation', async (req, res) => {
  try {
    const { type, metadata } = req.body;
    if (!type) return res.status(400).json({ error: 'Violation type required' });

    const attempt = await QuizAttempt.findByPk(req.params.attemptId, {
      include: [{ model: LeagueWeek, as: 'leagueWeek' }]
    });

    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });

    await AttemptViolation.create({
      attempt_id: attempt.id,
      type,
      timestamp: new Date(),
      metadata: metadata || {}
    });

    attempt.violation_count += 1;
    await attempt.save();

    const threshold = attempt.leagueWeek?.settings?.autoSubmitOnViolationThreshold || 0;
    let autoSubmitted = false;

    if (threshold > 0 && attempt.violation_count >= threshold && attempt.status === 'in_progress') {
      autoSubmitted = true;
      await finalizeAttemptScore(attempt.id, 'auto_submitted');
    }

    return res.json({
      success: true,
      violationCount: attempt.violation_count,
      threshold,
      autoSubmitted
    });
  } catch (error) {
    console.error('Log violation error:', error);
    return res.status(500).json({ error: 'Failed to log violation' });
  }
});

// Finalize & Submit Attempt (Server-Side Score Calculation)
router.post('/attempts/:attemptId/submit', async (req, res) => {
  try {
    const attempt = await QuizAttempt.findByPk(req.params.attemptId);
    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });

    if (attempt.status === 'completed' || attempt.status === 'auto_submitted') {
      return res.json({ success: true, message: 'Attempt already submitted', attempt });
    }

    const updatedAttempt = await finalizeAttemptScore(attempt.id, 'completed');
    return res.json({ success: true, attempt: updatedAttempt });
  } catch (error) {
    console.error('Submit attempt error:', error);
    return res.status(500).json({ error: 'Failed to submit quiz attempt' });
  }
});

// Helper function to calculate score server-side and update WeeklyResult
async function finalizeAttemptScore(attemptId, finalStatus = 'completed') {
  const attempt = await QuizAttempt.findByPk(attemptId, {
    include: [
      { model: LeagueWeek, as: 'leagueWeek' },
      { model: AttemptAnswer, as: 'answers' }
    ]
  });

  if (!attempt) return null;

  const week = attempt.leagueWeek;
  const settings = week?.settings || {};
  const marksCorrect = settings.marksPerCorrect !== undefined ? settings.marksPerCorrect : 4;
  const marksWrong = settings.marksPerWrong !== undefined ? settings.marksPerWrong : -1;
  const marksUnanswered = settings.marksUnanswered !== undefined ? settings.marksUnanswered : 0;

  // Get total questions for this quiz
  const questions = await Question.findAll({ where: { quiz_id: attempt.quiz_id } });
  const totalQuestions = questions.length;

  const answerMap = {};
  attempt.answers.forEach(a => { answerMap[a.question_id] = a; });

  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;
  let calculatedScore = 0;

  questions.forEach(q => {
    const ans = answerMap[q.id];
    if (!ans || !ans.selected_option) {
      unansweredCount++;
      calculatedScore += marksUnanswered;
    } else if (ans.is_correct) {
      correctCount++;
      calculatedScore += marksCorrect;
    } else {
      incorrectCount++;
      calculatedScore += marksWrong;
    }
  });

  const now = new Date();
  const startedAt = new Date(attempt.started_at);
  const timeTaken = Math.max(1, Math.floor((now.getTime() - startedAt.getTime()) / 1000));

  attempt.status = finalStatus;
  attempt.submitted_at = now;
  attempt.score = Math.round(calculatedScore * 100) / 100;
  attempt.correct_count = correctCount;
  attempt.incorrect_count = incorrectCount;
  attempt.unanswered_count = unansweredCount;
  attempt.time_taken = timeTaken;
  await attempt.save();

  // Create or Update WeeklyResult according to attemptScoringPolicy
  const policy = settings.attemptScoringPolicy || 'best';
  const allAttempts = await QuizAttempt.findAll({
    where: {
      user_id: attempt.user_id,
      league_week_id: attempt.league_week_id,
      status: { [Op.in]: ['completed', 'auto_submitted', 'expired'] }
    }
  });

  let bestAttempt = attempt;
  if (policy === 'best') {
    allAttempts.forEach(a => {
      if (a.score > bestAttempt.score || (a.score === bestAttempt.score && a.time_taken < bestAttempt.time_taken)) {
        bestAttempt = a;
      }
    });
  } else if (policy === 'latest') {
    bestAttempt = allAttempts.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))[0] || attempt;
  } else if (policy === 'first') {
    bestAttempt = allAttempts.sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at))[0] || attempt;
  }

  const [weeklyResult, created] = await WeeklyResult.findOrCreate({
    where: {
      league_id: attempt.league_id,
      league_week_id: attempt.league_week_id,
      user_id: attempt.user_id
    },
    defaults: {
      user_name: attempt.user_name,
      user_college: attempt.user_college,
      best_attempt_id: bestAttempt.id,
      score: bestAttempt.score,
      correct_count: bestAttempt.correct_count,
      time_taken: bestAttempt.time_taken
    }
  });

  if (!created) {
    weeklyResult.best_attempt_id = bestAttempt.id;
    weeklyResult.score = bestAttempt.score;
    weeklyResult.correct_count = bestAttempt.correct_count;
    weeklyResult.time_taken = bestAttempt.time_taken;
    await weeklyResult.save();
  }

  // Recalculate weekly ranks for this week
  const weekResults = await WeeklyResult.findAll({
    where: { league_week_id: attempt.league_week_id },
    order: [
      ['score', 'DESC'],
      ['time_taken', 'ASC'],
      ['createdAt', 'ASC']
    ]
  });

  for (let idx = 0; idx < weekResults.length; idx++) {
    weekResults[idx].rank = idx + 1;
    await weekResults[idx].save();
  }

  return attempt;
}

module.exports = router;
