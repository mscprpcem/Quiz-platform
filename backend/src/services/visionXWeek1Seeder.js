const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const { 
  Quiz, Question, ScheduledOccurrence, QuizAttempt, AttemptViolation, Event, User, EventRegistration, Participant
} = require('../models');

const WEEK1_QUIZ_ID = 'd5ee3170-5f08-434c-bfb8-bd65faf9ef0c';
const VISIONX_EVENT_ID = '82acac2e-95e6-462f-bc4f-9ff32c4dda88';
const OCCURRENCE_ID = '02c339e1-487e-4621-85d3-85a40d38ca69';
const LEAGUE_ID = 'bf6425ee-ab69-48d4-bc25-95f477ecf8c5';
const LEAGUE_WEEK_ID = 'a70bbde4-573a-4431-87a0-767b0aa623b0';

async function seedVisionXWeek1(force = false) {
  try {
    const dataPath = path.join(__dirname, '../data/visionXWeek1Data.json');
    if (!fs.existsSync(dataPath)) {
      console.warn('visionXWeek1Data.json not found, skipping injection.');
      return { success: false, reason: 'Data file missing' };
    }

    const participantsData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    if (!Array.isArray(participantsData) || participantsData.length === 0) {
      return { success: false, reason: 'No participant data in JSON' };
    }

    // 1. Ensure Event exists
    let event = await Event.findByPk(VISIONX_EVENT_ID).catch(() => null);
    if (!event) {
      event = await Event.findOne({
        where: {
          [Op.or]: [
            { slug: 'visionx-season-2' },
            { name: 'VisionX Season 2' }
          ]
        }
      }).catch(() => null);
    }

    if (!event) {
      event = await Event.create({
        id: VISIONX_EVENT_ID,
        name: 'VisionX Season 2',
        slug: 'visionx-season-2',
        description: 'Project innovation hackathon & weekly competitive tech challenges.',
        poster_url: 'https://mscprpcem.blob.core.windows.net/events/VisionX.png',
        category: 'Innovation Challenge',
        mode: 'Hybrid',
        venue: 'PRPCEM Campus',
        start_date: new Date('2026-08-23T10:00:00.000Z'),
        end_date: new Date('2026-08-25T18:00:00.000Z'),
        status: 'upcoming',
        is_registration_open: true,
        rewards: 'Certificates & Swags'
      });
    }

    // 2. Ensure Week 1 Quiz exists & is properly configured
    let quiz = await Quiz.findByPk(WEEK1_QUIZ_ID).catch(() => null);
    if (!quiz) {
      quiz = await Quiz.findOne({
        where: {
          [Op.or]: [
            { custom_slug: 'visionx-season-2-week-1-quiz' },
            { title: 'VisionX Season 2 — Week 1 Quiz' }
          ]
        }
      }).catch(() => null);
    }

    if (!quiz) {
      quiz = await Quiz.create({
        id: WEEK1_QUIZ_ID,
        title: 'VisionX Season 2 — Week 1 Quiz',
        event_name: 'VisionX Season 2',
        event_id: event.id,
        join_code: 'VX2W1Q',
        custom_slug: 'visionx-season-2-week-1-quiz',
        description: 'Official Week 1 challenge for VisionX Season 2.',
        status: 'completed',
        mode: 'SCHEDULED',
        schedule_type: 'ONE_TIME',
        timezone: 'Asia/Kolkata',
        time_limit: 30,
        max_attempts: 1,
        score_policy: 'BEST',
        shuffle_questions: true,
        shuffle_answers: true,
        require_fullscreen: false,
        anti_cheat_enabled: true,
        max_violations: 3,
        positive_marks: 1,
        negative_marks: 0,
        show_leaderboard: true,
        subject: 'Cloud & Software Foundations',
        scheduled_start: new Date('2026-08-01T00:00:00.000Z'),
        scheduled_end: new Date('2026-10-01T00:00:00.000Z'),
        badge_title: 'VisionX Season 2 Week 1 Badge',
        difficulty: 'Intermediate'
      });
    } else {
      await quiz.update({
        event_id: event.id,
        event_name: event.name,
        status: 'completed',
        positive_marks: 1,
        negative_marks: 0,
        show_leaderboard: true
      });
    }

    // 3. Ensure Scheduled Occurrence exists
    let occ = await ScheduledOccurrence.findByPk(OCCURRENCE_ID).catch(() => null);
    if (!occ) {
      occ = await ScheduledOccurrence.findOne({ where: { quiz_id: quiz.id } }).catch(() => null);
    }
    if (!occ) {
      occ = await ScheduledOccurrence.create({
        id: OCCURRENCE_ID,
        quiz_id: quiz.id,
        occurrence_number: 1,
        title: 'VisionX Season 2 — Week 1 Quiz',
        start_time: new Date('2026-08-01T00:00:00.000Z'),
        end_time: new Date('2026-10-01T00:00:00.000Z'),
        status: 'SCHEDULED'
      });
    }

    // 4. Ensure 20 questions exist so max_score displays as 20 pts
    const existingQuestions = await Question.findAll({ where: { quiz_id: quiz.id } }).catch(() => []);
    if (existingQuestions.length < 20) {
      const needed = 20 - existingQuestions.length;
      const newQuestions = [];
      for (let i = 0; i < needed; i++) {
        const qIdx = existingQuestions.length + i + 1;
        newQuestions.push({
          quiz_id: quiz.id,
          question: `VisionX Week 1 Technical Question ${qIdx}`,
          option_a: 'Option A',
          option_b: 'Option B',
          option_c: 'Option C',
          option_d: 'Option D',
          correct_answer: 'Option A',
          timer: 60,
          marks: 1,
          order_index: qIdx,
          occurrence_number: 1,
          difficulty: 'Intermediate',
          question_type: 'single'
        });
      }
      await Question.bulkCreate(newQuestions);
    }

    // 5. Check if attempts already injected
    const existingAttemptsCount = await QuizAttempt.count({ where: { quiz_id: quiz.id } }).catch(() => 0);
    if (existingAttemptsCount >= 43 && !force) {
      return {
        success: true,
        message: `Vision X Week 1 already has ${existingAttemptsCount} attempts seeded.`,
        quizId: quiz.id,
        count: existingAttemptsCount
      };
    }

    // 6. Inject/Update the 43 attempts
    const baseStartTime = new Date('2026-08-10T14:00:00.000Z').getTime();

    for (let i = 0; i < participantsData.length; i++) {
      const p = participantsData[i];
      const cleanEmail = (p.email || '').toLowerCase().trim();
      const cleanName = (p.name || '').trim();
      const timeSecs = Number(p.time_taken_seconds) || 0;
      const score = Number(p.score) || 0;
      const correctCount = Number(p.correct_count) || score;
      const violations = Number(p.violations) || 0;

      // Calculate sequential timestamps preserving exact rank order
      const startedAt = new Date(baseStartTime + (i * 30000));
      const submittedAt = new Date(startedAt.getTime() + (timeSecs * 1000));
      const expiresAt = new Date(startedAt.getTime() + (30 * 60 * 1000));

      const payload = {
        occurrence_id: occ.id,
        quiz_id: quiz.id,
        user_id: cleanEmail || `usr_${i + 1}`,
        user_name: cleanName,
        league_id: LEAGUE_ID,
        league_week_id: LEAGUE_WEEK_ID,
        participant_name: cleanName,
        participant_email: cleanEmail,
        attempt_number: 1,
        started_at: startedAt,
        expires_at: expiresAt,
        submitted_at: submittedAt,
        score: score,
        correct_count: correctCount,
        incorrect_count: 20 - correctCount,
        unanswered_count: 0,
        time_taken: timeSecs,
        time_taken_seconds: timeSecs,
        violation_count: violations,
        status: 'completed'
      };

      // Find or create user attempt
      let attempt = await QuizAttempt.findOne({
        where: {
          quiz_id: quiz.id,
          [Op.or]: [
            { participant_email: cleanEmail },
            { participant_name: cleanName }
          ]
        }
      });

      if (!attempt) {
        attempt = await QuizAttempt.create(payload);
      } else {
        await attempt.update(payload);
      }

      // Create AttemptViolation records if violations > 0
      if (violations > 0) {
        await AttemptViolation.destroy({ where: { attempt_id: attempt.id } }).catch(() => {});
        const violationRecords = [];
        for (let v = 0; v < violations; v++) {
          violationRecords.push({
            attempt_id: attempt.id,
            type: v === 0 ? 'TAB_SWITCH' : (v === 1 ? 'FULLSCREEN_EXIT' : 'WINDOW_BLUR'),
            violation_type: v === 0 ? 'TAB_SWITCH' : (v === 1 ? 'FULLSCREEN_EXIT' : 'WINDOW_BLUR'),
            timestamp: new Date(startedAt.getTime() + ((v + 1) * 20000))
          });
        }
        await AttemptViolation.bulkCreate(violationRecords).catch(() => {});
      }
    }

    console.log(`Successfully injected ${participantsData.length} participant attempts for Vision X Week 1.`);
    return {
      success: true,
      quizId: quiz.id,
      count: participantsData.length
    };
  } catch (err) {
    console.error('Error seeding Vision X Week 1 data:', err);
    return { success: false, error: err.message };
  }
}

module.exports = {
  seedVisionXWeek1
};
