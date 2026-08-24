const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const { 
  Quiz, Question, Participant, Answer, Violation,
  ScheduledOccurrence, QuizAttempt, AttemptAnswer, AttemptViolation 
} = require('../models');
const authMiddleware = require('../middleware/auth');
const { Op } = require('sequelize');

// Helper: Sanitize filename for headers
const getCleanFilename = (title, prefix) => {
  const safeTitle = (title || 'Quiz').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);
  return `${prefix}_${safeTitle}`;
};

// 1. Export Leaderboard Results (Supports both Live & Scheduled Quizzes)
router.get('/quiz/:id/results', authMiddleware, async (req, res) => {
  try {
    const quizId = req.params.id;
    const format = req.query.format === 'csv' ? 'csv' : 'xlsx';

    const quiz = await Quiz.findByPk(quizId);
    const scheduledOccurrencesCount = await ScheduledOccurrence.count({ where: { quiz_id: quizId } }).catch(() => 0);
    const scheduledAttemptsCount = await QuizAttempt.count({ where: { quiz_id: quizId } }).catch(() => 0);

    const isScheduled = quiz.mode === 'SCHEDULED' ||
      (quiz.mode && String(quiz.mode).toUpperCase() === 'SCHEDULED') ||
      Boolean(quiz.schedule_type) ||
      scheduledOccurrencesCount > 0 ||
      scheduledAttemptsCount > 0;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Leaderboard');

    if (isScheduled) {
      // ── SCHEDULED QUIZ LEADERBOARD EXPORT ──
      const occurrences = await ScheduledOccurrence.findAll({ where: { quiz_id: quizId } }).catch(() => []);
      const occurrenceIds = occurrences.map(o => o.id);

      const attempts = await QuizAttempt.findAll({
        where: {
          [Op.or]: [
            { quiz_id: quizId },
            ...(occurrenceIds.length > 0 ? [{ occurrence_id: { [Op.in]: occurrenceIds } }] : [])
          ]
        },
        order: [
          ['attempt_number', 'DESC'],
          ['submitted_at', 'DESC'],
          ['createdAt', 'DESC']
        ]
      }).catch(() => []);

      const attemptIds = attempts.map(a => a.id);
      let violationsMap = new Map();

      if (attemptIds.length > 0) {
        const violations = await AttemptViolation.findAll({
          where: { attempt_id: { [Op.in]: attemptIds } }
        }).catch(() => []);
        violations.forEach(v => {
          const aId = String(v.attempt_id);
          violationsMap.set(aId, (violationsMap.get(aId) || 0) + 1);
        });
      }

      // Group by unique student (taking latest completed attempt or active attempt)
      const userMap = new Map();
      attempts.forEach(a => {
        const userKey = a.sso_user_id
          ? `sso:${String(a.sso_user_id).trim()}`
          : (a.participant_email ? `email:${a.participant_email.toLowerCase().trim()}` : `name:${(a.participant_name || '').toLowerCase().trim()}`);
        if (!userMap.has(userKey)) {
          userMap.set(userKey, a);
        }
      });

      const rankedList = Array.from(userMap.values()).map(a => {
        const vCount = violationsMap.get(String(a.id)) || 0;
        return {
          id: a.id,
          name: a.participant_name,
          email: a.participant_email || 'N/A',
          ssoId: a.sso_user_id || 'N/A',
          attemptNumber: a.attempt_number || 1,
          score: Number(a.score) || 0,
          correctCount: a.correct_count || 0,
          incorrectCount: a.incorrect_count || 0,
          unansweredCount: a.unanswered_count || 0,
          timeTaken: a.time_taken_seconds || 0,
          violations: vCount,
          status: a.status || 'completed',
          submittedAt: a.submitted_at ? new Date(a.submitted_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'N/A'
        };
      });

      // Sort by score (DESC), correct answers (DESC), time taken (ASC)
      rankedList.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
        return a.timeTaken - b.timeTaken;
      });

      sheet.columns = [
        { header: 'Rank', key: 'rank', width: 8 },
        { header: 'Participant Name', key: 'name', width: 26 },
        { header: 'Email Address', key: 'email', width: 32 },
        { header: 'SSO / Student ID', key: 'ssoId', width: 20 },
        { header: 'Score (Points)', key: 'score', width: 16 },
        { header: 'Correct Answers', key: 'correctCount', width: 16 },
        { header: 'Incorrect Answers', key: 'incorrectCount', width: 16 },
        { header: 'Unanswered', key: 'unansweredCount', width: 14 },
        { header: 'Time Taken (s)', key: 'timeTaken', width: 16 },
        { header: 'Proctor Violations', key: 'violations', width: 18 },
        { header: 'Status', key: 'status', width: 14 },
        { header: 'Submission Date (IST)', key: 'submittedAt', width: 24 }
      ];

      rankedList.forEach((p, idx) => {
        sheet.addRow({
          rank: idx + 1,
          name: p.name,
          email: p.email,
          ssoId: p.ssoId,
          score: p.score,
          correctCount: p.correctCount,
          incorrectCount: p.incorrectCount,
          unansweredCount: p.unansweredCount,
          timeTaken: p.timeTaken,
          violations: p.violations,
          status: p.status,
          submittedAt: p.submittedAt
        });
      });
    } else {
      // ── LIVE QUIZ LEADERBOARD EXPORT ──
      const participants = await Participant.findAll({ where: { quiz_id: quizId } });
      const questions = await Question.findAll({ where: { quiz_id: quizId } });
      const answers = await Answer.findAll({
        include: [{ model: Question, as: 'question', where: { quiz_id: quizId } }]
      });
      const liveViolations = await Violation.findAll({ where: { quiz_id: quizId } }).catch(() => []);

      const leaderboard = participants.map((p) => {
        const pAnswers = answers.filter((ans) => ans.participant_id === p.id);
        const totalPoints = pAnswers.reduce((sum, a) => sum + a.points, 0);
        const correctAnswers = pAnswers.filter((a) => a.is_correct).length;
        const totalTime = pAnswers.reduce((sum, a) => sum + a.response_time, 0);
        const avgResponseTime = pAnswers.length > 0 ? parseFloat(((totalTime / pAnswers.length) / 1000).toFixed(2)) : 0;
        const pViolations = liveViolations.filter(v => v.participant_id === p.id).length;

        return {
          id: p.id,
          name: p.name,
          email: p.email || 'N/A',
          college: p.college || 'PRPCEM',
          score: totalPoints,
          correctAnswers,
          avgResponseTime,
          violations: Math.max(p.tab_switch_count || 0, pViolations),
          disqualified: p.disqualified ? 'Yes' : 'No'
        };
      });

      leaderboard.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.correctAnswers !== a.correctAnswers) return b.correctAnswers - a.correctAnswers;
        return a.avgResponseTime - b.avgResponseTime;
      });

      sheet.columns = [
        { header: 'Rank', key: 'rank', width: 8 },
        { header: 'Name', key: 'name', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'College', key: 'college', width: 35 },
        { header: 'Total Score', key: 'score', width: 15 },
        { header: 'Correct Answers', key: 'correctAnswers', width: 18 },
        { header: 'Avg Response Time (s)', key: 'avgResponseTime', width: 22 },
        { header: 'Violations Count', key: 'violations', width: 18 },
        { header: 'Disqualified', key: 'disqualified', width: 15 }
      ];

      leaderboard.forEach((p, idx) => {
        sheet.addRow({
          rank: idx + 1,
          name: p.name,
          email: p.email,
          college: p.college,
          score: p.score,
          correctAnswers: p.correctAnswers,
          avgResponseTime: p.avgResponseTime,
          violations: p.violations,
          disqualified: p.disqualified
        });
      });
    }

    // Style the header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    const filename = getCleanFilename(quiz.title, 'Leaderboard');

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      await workbook.csv.write(res);
    } else {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
      await workbook.xlsx.write(res);
    }
  } catch (error) {
    console.error('Export results error:', error);
    return res.status(500).json({ error: 'Server error generating leaderboard export' });
  }
});

// 2. Export Question-by-Question Detailed Responses (Supports both Live & Scheduled Quizzes)
router.get('/quiz/:id/responses', authMiddleware, async (req, res) => {
  try {
    const quizId = req.params.id;
    const format = req.query.format === 'csv' ? 'csv' : 'xlsx';

    const quiz = await Quiz.findByPk(quizId);
    const scheduledOccurrencesCount = await ScheduledOccurrence.count({ where: { quiz_id: quizId } }).catch(() => 0);
    const scheduledAttemptsCount = await QuizAttempt.count({ where: { quiz_id: quizId } }).catch(() => 0);

    const isScheduled = quiz.mode === 'SCHEDULED' ||
      (quiz.mode && String(quiz.mode).toUpperCase() === 'SCHEDULED') ||
      Boolean(quiz.schedule_type) ||
      scheduledOccurrencesCount > 0 ||
      scheduledAttemptsCount > 0;

    const questions = await Question.findAll({
      where: { quiz_id: quizId },
      order: [['order_index', 'ASC']]
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Responses');

    if (isScheduled) {
      // ── SCHEDULED QUIZ RESPONSES EXPORT ──
      const occurrences = await ScheduledOccurrence.findAll({ where: { quiz_id: quizId } }).catch(() => []);
      const occurrenceIds = occurrences.map(o => o.id);

      const attempts = await QuizAttempt.findAll({
        where: {
          [Op.or]: [
            { quiz_id: quizId },
            ...(occurrenceIds.length > 0 ? [{ occurrence_id: { [Op.in]: occurrenceIds } }] : [])
          ]
        },
        order: [['submitted_at', 'DESC'], ['createdAt', 'DESC']]
      }).catch(() => []);

      const attemptIds = attempts.map(a => a.id);
      let attemptAnswers = [];

      if (attemptIds.length > 0) {
        attemptAnswers = await AttemptAnswer.findAll({
          where: { attempt_id: { [Op.in]: attemptIds } }
        }).catch(() => []);
      }

      const columns = [
        { header: 'Participant Name', key: 'name', width: 26 },
        { header: 'Email Address', key: 'email', width: 32 },
        { header: 'Attempt #', key: 'attemptNumber', width: 12 },
        { header: 'Total Score', key: 'score', width: 14 },
        { header: 'Time Taken (s)', key: 'timeTaken', width: 15 },
        { header: 'Status', key: 'status', width: 14 }
      ];

      questions.forEach((q, idx) => {
        columns.push({
          header: `Q${idx + 1}: ${(q.question || '').substring(0, 35)}...`,
          key: `q_${q.id}`,
          width: 28
        });
      });

      sheet.columns = columns;

      attempts.forEach((a) => {
        const rowData = {
          name: a.participant_name,
          email: a.participant_email || 'N/A',
          attemptNumber: a.attempt_number || 1,
          score: a.score || 0,
          timeTaken: a.time_taken_seconds || 0,
          status: a.status
        };

        const studentAnswers = attemptAnswers.filter(ans => String(ans.attempt_id) === String(a.id));

        questions.forEach((q) => {
          const ans = studentAnswers.find(sa => sa.question_id === q.id);
          if (ans) {
            const correctText = ans.is_correct ? 'Correct' : 'Incorrect';
            rowData[`q_${q.id}`] = `${ans.selected_option} (${correctText}, ${ans.points} pts)`;
          } else {
            rowData[`q_${q.id}`] = 'Unanswered (0 pts)';
          }
        });

        sheet.addRow(rowData);
      });
    } else {
      // ── LIVE QUIZ RESPONSES EXPORT ──
      const participants = await Participant.findAll({ where: { quiz_id: quizId } });
      const answers = await Answer.findAll({
        include: [{ model: Question, as: 'question', where: { quiz_id: quizId } }]
      });

      const columns = [
        { header: 'Participant Name', key: 'name', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'College', key: 'college', width: 35 }
      ];

      questions.forEach((q, idx) => {
        columns.push({
          header: `Q${idx + 1}: ${(q.question || '').substring(0, 30)}...`,
          key: `q_${q.id}`,
          width: 25
        });
      });

      sheet.columns = columns;

      participants.forEach((p) => {
        const rowData = {
          name: p.name,
          email: p.email || 'N/A',
          college: p.college || 'PRPCEM'
        };

        questions.forEach((q) => {
          const ans = answers.find((a) => a.participant_id === p.id && a.question_id === q.id);
          if (ans) {
            rowData[`q_${q.id}`] = `${ans.selected_answer} (${ans.points} pts, ${(ans.response_time / 1000).toFixed(1)}s)`;
          } else {
            rowData[`q_${q.id}`] = 'No Answer (0 pts)';
          }
        });

        sheet.addRow(rowData);
      });
    }

    // Style the header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    const filename = getCleanFilename(quiz.title, 'Responses');

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      await workbook.csv.write(res);
    } else {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
      await workbook.xlsx.write(res);
    }
  } catch (error) {
    console.error('Export responses error:', error);
    return res.status(500).json({ error: 'Server error generating responses export' });
  }
});

module.exports = router;
