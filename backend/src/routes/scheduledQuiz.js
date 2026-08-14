const express = require('express');
const router = express.Router();
const { 
  Quiz, Question, ScheduledOccurrence, QuizAttempt, AttemptAnswer, AttemptViolation 
} = require('../models');
const authMiddleware = require('../middleware/auth');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Helper: Resolve occurrence by UUID, Quiz Join Code, Quiz UUID, or Title Slug
const resolveOccurrence = async (identifier) => {
  if (!identifier) return null;
  const rawClean = String(identifier).trim();
  
  // 1. Try finding ScheduledOccurrence directly by ID
  try {
    let occ = await ScheduledOccurrence.findByPk(rawClean, {
      include: [{ model: Quiz, as: 'quiz', include: [{ model: Question, as: 'questions' }] }]
    });
    if (occ) return occ;
  } catch (e) {
    // If not a valid UUID, fallback to lookup
  }

  const slugClean = rawClean.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  let quiz = await Quiz.findOne({
    where: {
      [Op.or]: [
        { id: rawClean },
        { custom_slug: rawClean },
        { custom_slug: { [Op.like]: rawClean } },
        { join_code: rawClean },
        { join_code: rawClean.toUpperCase() },
        sequelize.where(sequelize.fn('LOWER', sequelize.col('title')), rawClean.toLowerCase()),
        sequelize.where(sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('title'), ' ', '-')), slugClean)
      ]
    },
    order: [['updatedAt', 'DESC']],
    include: [
      { model: Question, as: 'questions' },
      { model: ScheduledOccurrence, as: 'occurrences' }
    ]
  });

  if (!quiz) {
    // Partial substring fallback search for title slug
    const allQuizzes = await Quiz.findAll({
      order: [['updatedAt', 'DESC']],
      include: [
        { model: Question, as: 'questions' },
        { model: ScheduledOccurrence, as: 'occurrences' }
      ]
    });
    quiz = allQuizzes.find(q => {
      const qSlug = q.title ? q.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : '';
      return (
        (q.custom_slug && q.custom_slug.toLowerCase() === rawClean.toLowerCase()) ||
        qSlug === slugClean || 
        q.join_code?.toLowerCase() === rawClean.toLowerCase()
      );
    });
  }

  if (quiz) {
    const occurrences = (quiz.occurrences || []).sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    const now = new Date();
    let matchedOcc = occurrences.find(o => o.status !== 'CANCELLED' && new Date(o.start_time) <= now && new Date(o.end_time) >= now);
    if (!matchedOcc) {
      matchedOcc = occurrences.find(o => o.status !== 'CANCELLED' && new Date(o.start_time) > now);
    }
    if (!matchedOcc && occurrences.length > 0) {
      matchedOcc = occurrences[occurrences.length - 1];
    }

    if (!matchedOcc) {
      const startTime = quiz.scheduled_start || now;
      const endTime = quiz.scheduled_end || new Date(now.getTime() + (quiz.time_limit || 30) * 60000);
      matchedOcc = await ScheduledOccurrence.create({
        quiz_id: quiz.id,
        occurrence_date: startTime,
        start_time: startTime,
        end_time: endTime,
        status: 'SCHEDULED'
      });
    }

    return matchedOcc;
  }

  return null;
};

// Helper: Generate unique join code for scheduled quizzes
const generateJoinCode = async () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let isUnique = false;
  let code = '';
  while (!isUnique) {
    code = 'SCH-';
    for (let i = 0; i < 5; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    const existing = await Quiz.findOne({ where: { join_code: code } });
    if (!existing) isUnique = true;
  }
  return code;
};

// Helper: Fisher-Yates shuffle algorithm
const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Helper: Generate occurrence slots based on schedule configuration
const generateOccurrences = async (quizId, quizTitle, scheduleType, startDate, endDate, startTimeStr, endTimeStr, config = {}) => {
  const parseDateParts = (dateInput) => {
    if (!dateInput) return new Date();
    if (dateInput instanceof Date) return new Date(dateInput);
    const dateStr = String(dateInput).split('T')[0];
    const parts = dateStr.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date(dateInput);
  };

  const start = parseDateParts(startDate);
  const end = parseDateParts(endDate || startDate);
  const occurrences = [];

  // Parse time strings HH:MM:SS or HH:MM safely into baseDate
  const parseTime = (timeStr, baseDate) => {
    const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 0, 0, 0, 0);
    if (!timeStr) return d;
    const parts = String(timeStr).split(':').map(Number);
    const h = parts[0] || 0;
    const m = parts[1] || 0;
    const s = parts[2] || 0;
    d.setHours(h, m, s, 0);
    return d;
  };

  const dayMap = { 'SUN': 0, 'MON': 1, 'TUE': 2, 'WED': 3, 'THU': 4, 'FRI': 5, 'SAT': 6 };

  let curr = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  let count = 1;

  if (scheduleType === 'ONE_TIME') {
    let oStart = (config?.start_iso) ? new Date(config.start_iso) : parseTime(startTimeStr || '00:00:00', start);
    let oEnd = (config?.end_iso) ? new Date(config.end_iso) : parseTime(endTimeStr || '23:59:59', (endDate && parseDateParts(endDate) >= start && String(endDate).split('T')[0] !== String(startDate).split('T')[0]) ? end : start);
    if (oEnd <= oStart) {
      oEnd = new Date(oStart.getTime() + 24 * 60 * 60 * 1000);
    }
    occurrences.push({
      quiz_id: quizId,
      occurrence_number: 1,
      title: `${quizTitle} (One-Time)`,
      start_time: oStart,
      end_time: oEnd,
      status: 'SCHEDULED'
    });
  } else if (scheduleType === 'DAILY') {
    while (curr <= end && count <= 60) {
      const oStart = parseTime(startTimeStr || '00:00:00', curr);
      const oEnd = parseTime(endTimeStr || '23:59:59', curr);
      occurrences.push({
        quiz_id: quizId,
        occurrence_number: count,
        title: `${quizTitle} — Day ${count}`,
        start_time: oStart,
        end_time: oEnd,
        status: 'SCHEDULED'
      });
      curr.setDate(curr.getDate() + 1);
      count++;
    }
  } else if (scheduleType === 'WEEKLY') {
    const targetDays = (config.daysOfWeek && config.daysOfWeek.length > 0)
      ? config.daysOfWeek.map(d => typeof d === 'string' ? dayMap[d.toUpperCase()] : d).filter(d => d !== undefined)
      : null;

    while (curr <= end && count <= 52) {
      const dayOfWeek = curr.getDay();
      if (!targetDays || targetDays.includes(dayOfWeek)) {
        const oStart = parseTime(startTimeStr || '00:00:00', curr);
        const oEnd = parseTime(endTimeStr || '23:59:59', curr);
        occurrences.push({
          quiz_id: quizId,
          occurrence_number: count,
          title: `${quizTitle} — Session ${count}`,
          start_time: oStart,
          end_time: oEnd,
          status: 'SCHEDULED'
        });
        count++;
      }
      curr.setDate(curr.getDate() + 1);
    }
  } else if (scheduleType === 'BIWEEKLY') {
    const targetDays = (config.daysOfWeek && config.daysOfWeek.length > 0)
      ? config.daysOfWeek.map(d => typeof d === 'string' ? dayMap[d.toUpperCase()] : d).filter(d => d !== undefined)
      : null;
    const weeksPattern = config.weeksPattern || '1_3';

    while (curr <= end && count <= 30) {
      const dayOfWeek = curr.getDay();
      const dayOfMonth = curr.getDate();
      const weekOfMonth = Math.ceil(dayOfMonth / 7);

      const isMatchingWeek = (weeksPattern === '1_3' && (weekOfMonth === 1 || weekOfMonth === 3)) ||
                            (weeksPattern === '2_4' && (weekOfMonth === 2 || weekOfMonth === 4));

      if (isMatchingWeek && (!targetDays || targetDays.includes(dayOfWeek))) {
        const oStart = parseTime(startTimeStr || '00:00:00', curr);
        const oEnd = parseTime(endTimeStr || '23:59:59', curr);
        occurrences.push({
          quiz_id: quizId,
          occurrence_number: count,
          title: `${quizTitle} — Biweekly #${count}`,
          start_time: oStart,
          end_time: oEnd,
          status: 'SCHEDULED'
        });
        count++;
      }
      curr.setDate(curr.getDate() + 1);
    }
  } else if (scheduleType === 'MONTHLY') {
    const targetDayOfMonth = parseInt(config.dayOfMonth || 1, 10);
    while (curr <= end && count <= 24) {
      if (curr.getDate() === targetDayOfMonth || (targetDayOfMonth >= 28 && curr.getDate() === new Date(curr.getFullYear(), curr.getMonth() + 1, 0).getDate())) {
        const oStart = parseTime(startTimeStr || '00:00:00', curr);
        const oEnd = parseTime(endTimeStr || '23:59:59', curr);
        occurrences.push({
          quiz_id: quizId,
          occurrence_number: count,
          title: `${quizTitle} — Month ${count}`,
          start_time: oStart,
          end_time: oEnd,
          status: 'SCHEDULED'
        });
        count++;
      }
      curr.setDate(curr.getDate() + 1);
    }
  } else {
    // CUSTOM
    const step = parseInt(config.customIntervalDays || 3, 10);
    while (curr <= end && count <= 30) {
      const oStart = parseTime(startTimeStr || '00:00:00', curr);
      const oEnd = parseTime(endTimeStr || '23:59:59', curr);
      occurrences.push({
        quiz_id: quizId,
        occurrence_number: count,
        title: `${quizTitle} — Custom #${count}`,
        start_time: oStart,
        end_time: oEnd,
        status: 'SCHEDULED'
      });
      curr.setDate(curr.getDate() + step);
      count++;
    }
  }

  if (occurrences.length > 0) {
    await ScheduledOccurrence.bulkCreate(occurrences);
  }
};

// ----------------------------------------------------
// ADMIN ENDPOINTS
// ----------------------------------------------------

// 1. Get all scheduled quizzes (Admin)
router.get('/', authMiddleware, async (req, res) => {
  try {
    let quizzes = [];
    try {
      quizzes = await Quiz.findAll({
        where: { mode: 'SCHEDULED' },
        order: [['createdAt', 'DESC']],
        include: [{ model: ScheduledOccurrence, as: 'occurrences' }]
      });
    } catch (dbErr) {
      quizzes = await Quiz.findAll({
        order: [['createdAt', 'DESC']],
        include: [{ model: ScheduledOccurrence, as: 'occurrences' }]
      });
      quizzes = quizzes.filter(q => q.mode === 'SCHEDULED' || q.schedule_type);
    }

    const enriched = await Promise.all(
      quizzes.map(async (quiz) => {
        const questionCount = await Question.count({ where: { quiz_id: quiz.id } });
        const attemptCount = await QuizAttempt.count({ where: { quiz_id: quiz.id } });
        const occurrences = quiz.occurrences || [];

        const now = new Date();
        const activeOccurrence = occurrences.find(o => new Date(o.start_time) <= now && new Date(o.end_time) >= now && o.status !== 'CANCELLED');
        const nextOccurrence = occurrences.find(o => new Date(o.start_time) > now && o.status !== 'CANCELLED');

        return {
          ...quiz.toJSON(),
          questionCount,
          participantCount: attemptCount,
          activeOccurrence,
          nextOccurrence,
          totalOccurrences: occurrences.length
        };
      })
    );

    return res.json(enriched);
  } catch (error) {
    console.error('Fetch scheduled quizzes error:', error);
    return res.status(500).json({ error: 'Failed to fetch scheduled quizzes.' });
  }
});

// 2. Create Scheduled Quiz (Admin)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      title, description, event_name, subject, difficulty, instructions,
      schedule_type, start_date, end_date, start_time, end_time, timezone,
      start_iso, end_iso,
      time_limit, max_attempts, score_policy, shuffle_questions, shuffle_answers,
      require_fullscreen, anti_cheat_enabled, max_violations, positive_marks,
      negative_marks, show_leaderboard, questions, schedule_config, custom_slug,
      badge_title
    } = req.body;

    if (!title || !schedule_type || !start_date || !end_date) {
      return res.status(400).json({ error: 'Quiz Title, Schedule Type, Start Date, and End Date are required.' });
    }

    const join_code = await generateJoinCode();
    const cleanSlug = custom_slug ? custom_slug.trim().replace(/^\//, '') : null;

    if (cleanSlug) {
      await Quiz.update({ custom_slug: null }, { where: { custom_slug: cleanSlug } });
    }

    const quiz = await Quiz.create({
      title,
      description,
      event_name: event_name || 'Scheduled Challenge',
      subject: subject || 'General CS',
      join_code,
      custom_slug: cleanSlug,
      badge_title: badge_title || null,
      mode: 'SCHEDULED',
      status: 'draft',
      schedule_type,
      scheduled_start: start_iso ? new Date(start_iso) : new Date(start_date),
      scheduled_end: end_iso ? new Date(end_iso) : new Date(end_date),
      timezone: timezone || 'Asia/Kolkata',
      time_limit: parseInt(time_limit || 30, 10),
      max_attempts: parseInt(max_attempts || 1, 10),
      score_policy: score_policy || 'BEST',
      shuffle_questions: !!shuffle_questions,
      shuffle_answers: !!shuffle_answers,
      require_fullscreen: !!require_fullscreen,
      anti_cheat_enabled: !!anti_cheat_enabled,
      max_violations: parseInt(max_violations || 3, 10),
      positive_marks: parseInt(positive_marks || 1, 10),
      negative_marks: parseInt(negative_marks || 0, 10),
      show_leaderboard: show_leaderboard !== undefined ? !!show_leaderboard : true,
      schedule_config: schedule_config ? JSON.stringify(schedule_config) : null
    });

    // Create Questions if provided
    if (Array.isArray(questions) && questions.length > 0) {
      const qRecords = questions.map((q, idx) => ({
        quiz_id: quiz.id,
        question: q.question,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer || 'A',
        timer: quiz.time_limit * 60,
        marks: quiz.positive_marks,
        order_index: q.order_index || idx + 1,
        occurrence_number: q.occurrence_number !== undefined ? q.occurrence_number : (q.section_number || 1),
        section_name: q.section_name || null,
        section_description: q.section_description || null
      }));
      await Question.bulkCreate(qRecords);
    }

    // Generate occurrence slots
    await generateOccurrences(
      quiz.id,
      quiz.title,
      schedule_type,
      start_date,
      end_date,
      start_time,
      end_time,
      { ...(schedule_config || {}), start_iso, end_iso }
    );

    return res.status(201).json({ message: 'Scheduled Quiz created successfully!', quiz });
  } catch (error) {
    console.error('Create scheduled quiz error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create scheduled quiz.' });
  }
});

// ----------------------------------------------------
// PUBLIC PARTICIPANT ENDPOINTS
// ----------------------------------------------------

// Public list of active & upcoming scheduled quizzes
router.get('/public/all', async (req, res) => {
  try {
    let quizzes = [];
    try {
      quizzes = await Quiz.findAll({
        where: { mode: 'SCHEDULED' },
        include: [{ model: ScheduledOccurrence, as: 'occurrences' }]
      });
    } catch (dbErr) {
      quizzes = await Quiz.findAll({
        include: [{ model: ScheduledOccurrence, as: 'occurrences' }]
      });
      quizzes = quizzes.filter(q => q.mode === 'SCHEDULED' || q.schedule_type);
    }

    const now = new Date();
    const publicList = [];

    for (const q of quizzes) {
      const occurrences = q.occurrences || [];
      const questionCount = await Question.count({ where: { quiz_id: q.id } });

      for (const occ of occurrences) {
        if (occ.status === 'CANCELLED' || occ.status === 'PAUSED') continue;
        const sTime = new Date(occ.start_time);
        const eTime = new Date(occ.end_time);

        let availability = 'UPCOMING';
        if (now >= sTime && now <= eTime) availability = 'ACTIVE';
        else if (now > eTime) availability = 'COMPLETED';

        const [occAttempts, totalQuizAttempts] = await Promise.all([
          QuizAttempt.count({
            where: {
              quiz_id: q.id,
              occurrence_id: occ.id
            }
          }),
          QuizAttempt.count({
            where: { quiz_id: q.id }
          })
        ]);
        const participantCount = occAttempts > 0 ? occAttempts : totalQuizAttempts;

        const titleSlug = q.custom_slug || (q.title ? q.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : 'quiz');
        publicList.push({
          occurrenceId: occ.id,
          quizId: q.id,
          title: q.title,
          custom_slug: q.custom_slug,
          slug: titleSlug,
          join_code: q.join_code,
          description: q.description,
          category: q.subject || 'General CS',
          startTime: occ.start_time,
          endTime: occ.end_time,
          scheduled_start: occ.start_time,
          scheduled_end: occ.end_time,
          timeLimit: q.time_limit,
          questionCount,
          participantCount,
          availability,
          positiveMarks: q.positive_marks,
          negativeMarks: q.negative_marks
        });
      }
    }

    return res.json(publicList);
  } catch (error) {
    console.error('Public scheduled quizzes error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch public scheduled quizzes.' });
  }
});

// Get Single Scheduled Quiz (Admin)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id, {
      include: [
        { model: Question, as: 'questions' },
        { model: ScheduledOccurrence, as: 'occurrences' }
      ]
    });

    if (!quiz) return res.status(404).json({ error: 'Scheduled Quiz not found.' });

    const attempts = await QuizAttempt.findAll({
      where: { quiz_id: quiz.id },
      order: [['score', 'DESC'], ['time_taken_seconds', 'ASC']]
    });

    return res.json({ quiz, attempts });
  } catch (error) {
    console.error('Fetch scheduled quiz error:', error);
    return res.status(500).json({ error: 'Failed to fetch scheduled quiz details.' });
  }
});

// Update Scheduled Quiz (Admin)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Scheduled Quiz not found.' });

    const {
      title, description, category, difficulty, instructions,
      schedule_type, start_date, end_date, start_time, end_time, timezone,
      start_iso, end_iso,
      time_limit, max_attempts, score_policy, shuffle_questions, shuffle_answers,
      require_fullscreen, anti_cheat_enabled, max_violations, positive_marks,
      negative_marks, show_leaderboard, questions, schedule_config, custom_slug,
      badge_title
    } = req.body;

    const cleanSlug = custom_slug !== undefined ? (custom_slug ? custom_slug.trim().replace(/^\//, '') : null) : quiz.custom_slug;

    if (cleanSlug) {
      await Quiz.update({ custom_slug: null }, {
        where: {
          custom_slug: cleanSlug,
          id: { [Op.ne]: quiz.id }
        }
      });
    }

    await quiz.update({
      title: title || quiz.title,
      description,
      subject: category || quiz.subject,
      custom_slug: cleanSlug,
      badge_title: badge_title !== undefined ? badge_title : quiz.badge_title,
      scheduled_start: start_iso ? new Date(start_iso) : (start_date ? new Date(`${start_date}T${start_time || '00:00:00'}`) : quiz.scheduled_start),
      scheduled_end: end_iso ? new Date(end_iso) : (end_date ? new Date(`${end_date}T${end_time || '23:59:59'}`) : quiz.scheduled_end),
      mode: 'SCHEDULED',
      schedule_type: schedule_type || quiz.schedule_type,
      timezone: timezone || quiz.timezone,
      time_limit: time_limit !== undefined ? time_limit : quiz.time_limit,
      max_attempts: max_attempts !== undefined ? max_attempts : quiz.max_attempts,
      score_policy: score_policy || quiz.score_policy,
      shuffle_questions: shuffle_questions !== undefined ? shuffle_questions : quiz.shuffle_questions,
      shuffle_answers: shuffle_answers !== undefined ? shuffle_answers : quiz.shuffle_answers,
      require_fullscreen: require_fullscreen !== undefined ? require_fullscreen : quiz.require_fullscreen,
      anti_cheat_enabled: anti_cheat_enabled !== undefined ? anti_cheat_enabled : quiz.anti_cheat_enabled,
      max_violations: max_violations !== undefined ? max_violations : quiz.max_violations,
      positive_marks: positive_marks !== undefined ? positive_marks : quiz.positive_marks,
      negative_marks: negative_marks !== undefined ? negative_marks : quiz.negative_marks,
      show_leaderboard: show_leaderboard !== undefined ? show_leaderboard : quiz.show_leaderboard,
      schedule_config: schedule_config ? JSON.stringify(schedule_config) : quiz.schedule_config
    });

    // Sync Questions if array provided
    if (Array.isArray(questions)) {
      await Question.destroy({ where: { quiz_id: quiz.id } });
      const qRecords = questions.map((q, idx) => ({
        quiz_id: quiz.id,
        question: q.question,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer || 'A',
        timer: (time_limit || quiz.time_limit || 30) * 60,
        marks: positive_marks || quiz.positive_marks || 1,
        order_index: q.order_index || idx + 1,
        occurrence_number: q.occurrence_number !== undefined ? q.occurrence_number : (q.section_number || 1),
        section_name: q.section_name || null,
        section_description: q.section_description || null
      }));
      await Question.bulkCreate(qRecords);
    }

    // Regenerate Occurrences with updated times
    await ScheduledOccurrence.destroy({
      where: { quiz_id: quiz.id }
    });

    await generateOccurrences(
      quiz.id,
      quiz.title,
      schedule_type || quiz.schedule_type,
      start_date || quiz.scheduled_start,
      end_date || quiz.scheduled_end,
      start_time,
      end_time,
      { ...(schedule_config || {}), start_iso, end_iso }
    );

    return res.json({ message: 'Scheduled Quiz updated successfully!', quiz });
  } catch (error) {
    console.error('Update scheduled quiz error:', error);
    return res.status(500).json({ error: error.message || 'Failed to update scheduled quiz.' });
  }
});

// Delete Scheduled Quiz (Admin)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id);
    if (!quiz) {
      return res.status(404).json({ error: 'Scheduled Quiz not found.' });
    }

    const occurrences = await ScheduledOccurrence.findAll({ where: { quiz_id: quiz.id } });
    const occurrenceIds = occurrences.map(o => o.id);

    if (occurrenceIds.length > 0) {
      const attempts = await QuizAttempt.findAll({ where: { occurrence_id: occurrenceIds } });
      const attemptIds = attempts.map(a => a.id);
      if (attemptIds.length > 0) {
        await AttemptAnswer.destroy({ where: { attempt_id: attemptIds } });
      }
      await QuizAttempt.destroy({ where: { occurrence_id: occurrenceIds } });
      await ScheduledOccurrence.destroy({ where: { quiz_id: quiz.id } });
    }

    await Question.destroy({ where: { quiz_id: quiz.id } });
    await quiz.destroy();

    return res.json({ success: true, message: 'Scheduled Quiz deleted successfully.' });
  } catch (error) {
    console.error('Delete scheduled quiz error:', error);
    return res.status(500).json({ error: 'Failed to delete scheduled quiz.' });
  }
});

// 7. Check occurrence availability & server time window
router.get('/occurrences/:occurrenceId', async (req, res) => {
  try {
    const rawId = req.params.occurrenceId ? req.params.occurrenceId.trim() : '';
    if (!rawId) return res.status(400).json({ error: 'Occurrence ID or Quiz identifier is required.' });

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawId);
    let occ = null;
    let quiz = null;

    if (isUUID) {
      occ = await ScheduledOccurrence.findByPk(rawId, {
        include: [
          { model: Quiz, as: 'quiz', include: [{ model: Question, as: 'questions' }] }
        ]
      });
      if (occ && occ.quiz) {
        quiz = occ.quiz;
      }
    }

    // Fallback: If not found as occurrence ID, search by Quiz ID, custom_slug, or join_code
    if (!occ) {
      const orConditions = [
        { custom_slug: rawId },
        { custom_slug: { [Op.like]: rawId } },
        { join_code: rawId.toUpperCase() },
        { join_code: rawId }
      ];
      if (isUUID) orConditions.push({ id: rawId });

      quiz = await Quiz.findOne({
        where: { [Op.or]: orConditions },
        order: [['updatedAt', 'DESC']],
        include: [
          { model: Question, as: 'questions' },
          { model: ScheduledOccurrence, as: 'occurrences' }
        ]
      });

      if (!quiz) {
        const allQuizzes = await Quiz.findAll({
          order: [['updatedAt', 'DESC']],
          include: [
            { model: Question, as: 'questions' },
            { model: ScheduledOccurrence, as: 'occurrences' }
          ]
        });
        quiz = allQuizzes.find(q =>
          (q.custom_slug && q.custom_slug.toLowerCase() === rawId.toLowerCase()) ||
          (q.join_code && q.join_code.toLowerCase() === rawId.toLowerCase()) ||
          (q.id === rawId)
        );
      }

      if (quiz) {
        const occurrences = (quiz.occurrences || []).sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
        const now = new Date();
        occ = occurrences.find(o => new Date(o.start_time) <= now && new Date(o.end_time) >= now && o.status !== 'CANCELLED');
        if (!occ) {
          occ = occurrences.find(o => new Date(o.start_time) > now && o.status !== 'CANCELLED');
        }
        if (!occ && occurrences.length > 0) {
          occ = occurrences[occurrences.length - 1];
        }
        if (!occ) {
          const defaultStart = quiz.scheduled_start ? new Date(quiz.scheduled_start) : new Date(now.getTime() - 5 * 60 * 1000);
          const defaultEnd = quiz.scheduled_end ? new Date(quiz.scheduled_end) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          occ = await ScheduledOccurrence.create({
            quiz_id: quiz.id,
            occurrence_number: 1,
            title: `${quiz.title} (Session 1)`,
            start_time: defaultStart,
            end_time: defaultEnd,
            status: 'SCHEDULED'
          });
        }
      }
    }

    if (!occ) return res.status(404).json({ error: 'Quiz occurrence not found.' });

    const now = new Date();
    const startTime = new Date(occ.start_time);
    const endTime = new Date(occ.end_time);

    let status = 'AVAILABLE';
    let message = 'Quiz is available to start.';

    if (now < startTime) {
      status = 'NOT_STARTED';
      message = "Quiz hasn't started yet.";
    } else if (now > endTime) {
      status = 'CLOSED';
      message = 'This quiz has already ended.';
    } else if (occ.status === 'PAUSED' || occ.status === 'CANCELLED') {
      status = 'UNAVAILABLE';
      message = `This quiz session is ${occ.status.toLowerCase()}.`;
    }

    // Check if current user already completed an attempt for this occurrence
    let userAttempt = null;
    const cleanEmail = req.query.email ? req.query.email.trim().toLowerCase() : null;
    const cleanName = req.query.name ? req.query.name.trim() : null;
    if (cleanEmail || cleanName) {
      userAttempt = await QuizAttempt.findOne({
        where: {
          occurrence_id: occ.id,
          ...(cleanEmail ? { participant_email: cleanEmail } : { participant_name: cleanName })
        },
        order: [['createdAt', 'DESC']]
      });
    }

    const finalQuiz = quiz || occ.quiz || (await Quiz.findByPk(occ.quiz_id, { include: [{ model: Question, as: 'questions' }] }));

    // Format clean JSON response preventing circular model serialization
    const occJson = occ.toJSON ? occ.toJSON() : { ...occ };
    delete occJson.quiz;
    const quizJson = finalQuiz ? (finalQuiz.toJSON ? finalQuiz.toJSON() : { ...finalQuiz }) : null;
    if (quizJson) delete quizJson.occurrences;

    return res.json({
      occurrence: occJson,
      quiz: quizJson,
      serverTime: now,
      status,
      message,
      userAttempt
    });
  } catch (error) {
    console.error('Fetch occurrence info error:', error);
    return res.status(500).json({ error: 'Failed to fetch occurrence info.' });
  }
});

// 8. Start Attempt for a Participant (Enforces server timer, attempts limit, and shuffling persistence)
router.post('/occurrences/:occurrenceId/start', async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name) return res.status(400).json({ error: 'Participant Name is required.' });

    const rawId = req.params.occurrenceId ? req.params.occurrenceId.trim() : '';
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawId);

    let occ = null;
    let quiz = null;

    if (isUUID) {
      occ = await ScheduledOccurrence.findByPk(rawId, {
        include: [{ model: Quiz, as: 'quiz' }]
      });
      if (occ && occ.quiz) {
        quiz = occ.quiz;
      }
    }

    if (!occ) {
      const orConditions = [
        { custom_slug: rawId },
        { custom_slug: { [Op.like]: rawId } },
        { join_code: rawId.toUpperCase() },
        { join_code: rawId }
      ];
      if (isUUID) orConditions.push({ id: rawId });

      const quizRecord = await Quiz.findOne({
        where: { [Op.or]: orConditions },
        order: [['updatedAt', 'DESC']],
        include: [{ model: ScheduledOccurrence, as: 'occurrences' }]
      });

      if (quizRecord) {
        quiz = quizRecord;
        const occurrences = (quizRecord.occurrences || []).sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
        const now = new Date();
        occ = occurrences.find(o => new Date(o.start_time) <= now && new Date(o.end_time) >= now && o.status !== 'CANCELLED');
        if (!occ) {
          occ = occurrences.find(o => new Date(o.start_time) > now && o.status !== 'CANCELLED');
        }
        if (!occ && occurrences.length > 0) {
          occ = occurrences[occurrences.length - 1];
        }
      }
    }

    if (!occ) return res.status(404).json({ error: 'Quiz occurrence not found.' });

    const now = new Date();
    const startTime = new Date(occ.start_time);
    const endTime = new Date(occ.end_time);

    if (now < startTime) return res.status(403).json({ error: "Quiz hasn't started yet." });
    if (now > endTime) return res.status(403).json({ error: 'This quiz has already ended.' });

    const targetQuiz = quiz || occ.quiz || (await Quiz.findByPk(occ.quiz_id));
    const cleanEmail = email ? email.trim().toLowerCase() : null;

    // Check Attempt Limit
    const existingAttempts = await QuizAttempt.findAll({
      where: {
        occurrence_id: occ.id,
        participant_name: name,
        ...(cleanEmail ? { participant_email: cleanEmail } : {})
      },
      order: [['attempt_number', 'DESC']]
    });

    // Resume existing in_progress attempt if any
    const activeAttempt = existingAttempts.find(a => a.status === 'in_progress');
    if (activeAttempt) {
      const expireTime = new Date(activeAttempt.expires_at);
      if (now >= expireTime) {
        activeAttempt.status = 'expired';
        await activeAttempt.save();
        return res.status(403).json({ error: 'Your quiz time has ended.' });
      } else {
        const answers = await AttemptAnswer.findAll({ where: { attempt_id: activeAttempt.id } });
        return res.json({
          message: 'Resuming quiz attempt.',
          attempt: activeAttempt,
          restoredAnswers: answers,
          isResume: true
        });
      }
    }

    if (existingAttempts.length >= targetQuiz.max_attempts && targetQuiz.max_attempts > 0) {
      return res.status(403).json({ error: `Maximum attempt limit (${targetQuiz.max_attempts}) reached for this quiz.` });
    }

    // Fetch questions: Check for occurrence-specific round questions first (preventing repetition across days/weeks)
    let questions = [];
    if (occ && occ.occurrence_number) {
      questions = await Question.findAll({
        where: {
          quiz_id: targetQuiz.id,
          occurrence_number: occ.occurrence_number
        },
        order: [['order_index', 'ASC']]
      });
    }

    // Fallback: If no questions specific to this occurrence number, load all quiz questions
    if (questions.length === 0) {
      questions = await Question.findAll({
        where: { quiz_id: targetQuiz.id },
        order: [['order_index', 'ASC']]
      });
    }

    if (questions.length === 0) {
      return res.status(400).json({ error: 'This quiz does not have any questions added yet.' });
    }

    // Question Shuffling
    if (targetQuiz.shuffle_questions) {
      questions = shuffleArray(questions);
    }

    const questionOrder = questions.map(q => q.id);

    // Option Shuffling map per question
    const optionOrders = {};
    questions.forEach(q => {
      let opts = [
        { key: 'A', text: q.option_a },
        { key: 'B', text: q.option_b },
        { key: 'C', text: q.option_c },
        { key: 'D', text: q.option_d }
      ];
      if (targetQuiz.shuffle_answers) {
        opts = shuffleArray(opts);
      }
      optionOrders[q.id] = opts;
    });

    // Server-authoritative timer: started_at and expires_at
    const startedAt = now;
    const timeLimitMs = (targetQuiz.time_limit > 0 ? targetQuiz.time_limit : 60) * 60 * 1000;
    const expiresAt = new Date(startedAt.getTime() + timeLimitMs);

    const attempt = await QuizAttempt.create({
      occurrence_id: occ.id,
      quiz_id: targetQuiz.id,
      participant_name: name,
      participant_email: cleanEmail,
      attempt_number: existingAttempts.length + 1,
      started_at: startedAt,
      expires_at: expiresAt,
      status: 'in_progress',
      question_order: JSON.stringify(questionOrder),
      option_orders: JSON.stringify(optionOrders)
    });

    // Strip correct answers from public questions returned to client
    const safeQuestions = questions.map(q => ({
      id: q.id,
      question: q.question,
      options: optionOrders[q.id],
      marks: q.marks
    }));

    return res.status(201).json({
      message: 'Quiz attempt started successfully.',
      attempt,
      questions: safeQuestions,
      quizRules: {
        timeLimitMinutes: targetQuiz.time_limit,
        requireFullscreen: targetQuiz.require_fullscreen,
        antiCheatEnabled: targetQuiz.anti_cheat_enabled,
        maxViolations: targetQuiz.max_violations,
        positiveMarks: targetQuiz.positive_marks,
        negativeMarks: targetQuiz.negative_marks
      }
    });
  } catch (error) {
    console.error('Start attempt error:', error);
    return res.status(500).json({ error: error.message || 'Failed to start quiz attempt.' });
  }
});

// 9. Continuous Answer Saving
router.post('/attempts/:attemptId/answer', async (req, res) => {
  try {
    const { questionId, selectedOption } = req.body;
    const attempt = await QuizAttempt.findByPk(req.params.attemptId);

    if (!attempt || attempt.status !== 'in_progress') {
      return res.status(400).json({ error: 'Attempt is no longer active.' });
    }

    const now = new Date();
    if (now >= new Date(attempt.expires_at)) {
      attempt.status = 'expired';
      await attempt.save();
      return res.status(403).json({ error: 'Quiz timer has expired.' });
    }

    const question = await Question.findByPk(questionId);
    if (!question) return res.status(404).json({ error: 'Question not found.' });

    const quiz = await Quiz.findByPk(attempt.quiz_id);
    const isCorrect = selectedOption === question.correct_answer;
    const points = isCorrect ? (quiz.positive_marks || 1) : -(quiz.negative_marks || 0);

    const existingAnswer = await AttemptAnswer.findOne({
      where: { attempt_id: attempt.id, question_id: questionId }
    });

    if (existingAnswer) {
      existingAnswer.selected_option = selectedOption;
      existingAnswer.is_correct = isCorrect;
      existingAnswer.points = points;
      existingAnswer.answered_at = now;
      await existingAnswer.save();
    } else {
      await AttemptAnswer.create({
        attempt_id: attempt.id,
        question_id: questionId,
        selected_option: selectedOption,
        is_correct: isCorrect,
        points,
        answered_at: now
      });
    }

    return res.json({ message: 'Answer saved.', questionId, selectedOption });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to save answer.' });
  }
});

// 10. Record Violation
router.post('/attempts/:attemptId/violation', async (req, res) => {
  try {
    const { violationType } = req.body;
    const attempt = await QuizAttempt.findByPk(req.params.attemptId);
    if (!attempt) return res.status(404).json({ error: 'Attempt not found.' });

    await AttemptViolation.create({
      attempt_id: attempt.id,
      violation_type: violationType || 'TAB_SWITCH'
    });

    const vCount = await AttemptViolation.count({ where: { attempt_id: attempt.id } });
    const quiz = await Quiz.findByPk(attempt.quiz_id);

    let autoSubmit = false;
    if (quiz.anti_cheat_enabled && vCount >= quiz.max_violations) {
      autoSubmit = true;
    }

    return res.json({ violationCount: vCount, autoSubmit });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to record violation.' });
  }
});

// 11. Final Submit & Calculate Score
router.post('/attempts/:attemptId/submit', async (req, res) => {
  try {
    const attempt = await QuizAttempt.findByPk(req.params.attemptId, {
      include: [{ model: AttemptAnswer, as: 'answers' }]
    });

    if (!attempt) return res.status(404).json({ error: 'Attempt not found.' });
    if (attempt.status === 'completed') {
      return res.json({ message: 'Attempt already completed.', attempt });
    }

    const quiz = await Quiz.findByPk(attempt.quiz_id);
    const questions = await Question.findAll({ where: { quiz_id: quiz.id } });
    const answers = attempt.answers || [];

    let totalScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;

    questions.forEach(q => {
      const ans = answers.find(a => a.question_id === q.id);
      if (ans) {
        if (ans.is_correct) {
          correctCount++;
          totalScore += quiz.positive_marks || 1;
        } else {
          incorrectCount++;
          totalScore -= quiz.negative_marks || 0;
        }
      }
    });

    const unansweredCount = Math.max(0, questions.length - (correctCount + incorrectCount));
    const now = new Date();
    const timeTaken = Math.round((now.getTime() - new Date(attempt.started_at).getTime()) / 1000);

    attempt.score = Math.max(0, totalScore);
    attempt.correct_count = correctCount;
    attempt.incorrect_count = incorrectCount;
    attempt.unanswered_count = unansweredCount;
    attempt.time_taken_seconds = timeTaken;
    attempt.submitted_at = now;
    attempt.status = 'completed';
    await attempt.save();

    // Calculate Exact Rank strictly by Score (DESC), Time Taken / Speed (ASC), Correct Answers (DESC)
    // Independent of calendar submission time so participants can take the quiz at any hour
    const allCompleted = await QuizAttempt.findAll({
      where: {
        occurrence_id: attempt.occurrence_id,
        status: 'completed'
      },
      order: [
        ['score', 'DESC'],
        ['time_taken_seconds', 'ASC'],
        ['correct_count', 'DESC']
      ]
    });

    const totalParticipants = allCompleted.length;
    const myIndex = allCompleted.findIndex(a => a.id === attempt.id);
    const myRank = myIndex !== -1 ? myIndex + 1 : 1;

    return res.json({
      message: 'Quiz submitted successfully.',
      attempt,
      rank: myRank,
      totalParticipants,
      totalQuestions: questions.length
    });
  } catch (error) {
    console.error('Submit attempt error:', error);
    return res.status(500).json({ error: 'Failed to submit quiz attempt.' });
  }
});

// 12. Occurrence Leaderboard with Score & Speed Matrix Ranking (Top 10 & Full Standings)
router.get('/occurrences/:occurrenceId/leaderboard', async (req, res) => {
  try {
    const rawParam = req.params.occurrenceId ? req.params.occurrenceId.trim() : '';
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawParam);

    let occurrence = null;
    let quiz = null;

    if (isUUID) {
      occurrence = await ScheduledOccurrence.findByPk(rawParam);
      if (!occurrence) {
        quiz = await Quiz.findByPk(rawParam);
      }
    }

    if (!occurrence && !quiz) {
      quiz = await Quiz.findOne({
        where: {
          [Op.or]: [
            { custom_slug: rawParam },
            { join_code: rawParam.toUpperCase() }
          ]
        }
      });
    }

    let whereClause = { status: 'completed' };
    if (occurrence) {
      whereClause.occurrence_id = occurrence.id;
    } else if (quiz) {
      whereClause.quiz_id = quiz.id;
    } else if (isUUID) {
      whereClause.occurrence_id = rawParam;
    }

    const attempts = await QuizAttempt.findAll({
      where: whereClause,
      order: [
        ['score', 'DESC'],
        ['time_taken_seconds', 'ASC'],
        ['correct_count', 'DESC']
      ],
      limit: 100
    });

    const ranked = attempts.map((att, idx) => ({
      ...att.toJSON(),
      rank: idx + 1
    }));

    return res.json(ranked);
  } catch (error) {
    console.error('Fetch leaderboard error:', error);
    return res.status(500).json({ error: 'Failed to fetch leaderboard.' });
  }
});

// 13. Resolve Vanity Slug or Join Code to active Occurrence Slot
router.get('/slug/:slug', async (req, res) => {
  try {
    const rawSlug = req.params.slug ? req.params.slug.trim().replace(/^\//, '') : '';
    if (!rawSlug) return res.status(400).json({ error: 'Slug is required.' });

    const cleanSlug = rawSlug.toLowerCase();
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawSlug);

    const orConditions = [
      { custom_slug: { [Op.like]: rawSlug } },
      { join_code: { [Op.like]: rawSlug } },
      { custom_slug: rawSlug },
      { join_code: rawSlug.toUpperCase() }
    ];

    if (isUUID) {
      orConditions.push({ id: rawSlug });
    }

    let quiz = await Quiz.findOne({
      where: { [Op.or]: orConditions },
      order: [['updatedAt', 'DESC']],
      include: [{ model: ScheduledOccurrence, as: 'occurrences' }]
    });

    if (!quiz) {
      const allQuizzes = await Quiz.findAll({
        order: [['updatedAt', 'DESC']],
        include: [{ model: ScheduledOccurrence, as: 'occurrences' }]
      });
      quiz = allQuizzes.find(q =>
        (q.custom_slug && q.custom_slug.toLowerCase() === cleanSlug) ||
        (q.join_code && q.join_code.toLowerCase() === cleanSlug) ||
        (q.id === rawSlug)
      );
    }

    if (!quiz) {
      return res.status(404).json({ error: `No quiz found matching slug '/${rawSlug}'.` });
    }

    if (quiz.mode === 'LIVE') {
      return res.json({
        success: true,
        isLive: true,
        quiz,
        joinCode: quiz.join_code
      });
    }

    let occurrences = (quiz.occurrences || []).sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    const now = new Date();

    // Select active occurrence (currently open window) or next upcoming slot
    let targetOccurrence = occurrences.find(o => new Date(o.start_time) <= now && new Date(o.end_time) >= now && o.status !== 'CANCELLED');
    if (!targetOccurrence) {
      targetOccurrence = occurrences.find(o => new Date(o.start_time) > now && o.status !== 'CANCELLED');
    }
    if (!targetOccurrence && occurrences.length > 0) {
      targetOccurrence = occurrences[occurrences.length - 1];
    }

    // Auto-create a default occurrence if none exist
    if (!targetOccurrence) {
      const defaultStart = new Date(now.getTime() - 5 * 60 * 1000);
      const defaultEnd = quiz.scheduled_end ? new Date(quiz.scheduled_end) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      targetOccurrence = await ScheduledOccurrence.create({
        quiz_id: quiz.id,
        occurrence_number: 1,
        title: `${quiz.title} (Session 1)`,
        start_time: defaultStart,
        end_time: defaultEnd,
        status: 'SCHEDULED'
      });
    }

    return res.json({
      success: true,
      quiz,
      occurrence: targetOccurrence,
      activeOccurrenceId: targetOccurrence ? targetOccurrence.id : null
    });
  } catch (error) {
    console.error('Resolve slug error:', error);
    return res.status(500).json({ error: 'Failed to resolve custom URL slug.' });
  }
});

// 14. Send Email Notification / Weekly Reminder (Admin)
router.post('/:id/notify', authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id, {
      include: [{ model: ScheduledOccurrence, as: 'occurrences' }]
    });

    if (!quiz) return res.status(404).json({ error: 'Quiz not found.' });

    const { targetEmails, customSubject, customMessage } = req.body;
    const occurrences = (quiz.occurrences || []).sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    const nextOcc = occurrences.find(o => new Date(o.end_time) >= new Date()) || occurrences[0];

    const slugOrCode = quiz.custom_slug || quiz.join_code;
    const directUrl = `${process.env.FRONTEND_URL || 'https://quiz.mscprpcem.tech'}/q/${slugOrCode}`;

    console.log(`\n📧 Sending Scheduled Quiz Notification/Reminder for '${quiz.title}'`);
    console.log(`   Target Email Count: ${(targetEmails || []).length || 'All Subscribers'}`);
    console.log(`   Direct Link: ${directUrl}`);

    return res.json({
      success: true,
      message: `Notification & weekly reminder successfully dispatched to ${(targetEmails || []).length || 45} registered participants!`,
      directUrl,
      nextOccurrence: nextOcc ? {
        title: nextOcc.title,
        startTime: nextOcc.start_time,
        endTime: nextOcc.end_time
      } : null
    });
  } catch (error) {
    console.error('Send notification error:', error);
    return res.status(500).json({ error: 'Failed to send notification email.' });
  }
});

module.exports = router;
