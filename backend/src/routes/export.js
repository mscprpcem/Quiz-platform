const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const { Quiz, Question, Participant, Answer, Violation } = require('../models');
const authMiddleware = require('../middleware/auth');

// 1. Export Leaderboard Results
router.get('/quiz/:id/results', authMiddleware, async (req, res) => {
  try {
    const quizId = req.params.id;
    const format = req.query.format === 'csv' ? 'csv' : 'xlsx';

    const quiz = await Quiz.findByPk(quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const participants = await Participant.findAll({ where: { quiz_id: quizId } });
    const questions = await Question.findAll({ where: { quiz_id: quizId } });
    const answers = await Answer.findAll({
      include: [{ model: Question, as: 'question', where: { quiz_id: quizId } }]
    });

    // Compute player statistics
    const leaderboard = participants.map((p) => {
      const pAnswers = answers.filter((ans) => ans.participant_id === p.id);
      const totalPoints = pAnswers.reduce((sum, a) => sum + a.points, 0);
      const correctAnswers = pAnswers.filter((a) => a.is_correct).length;
      const totalTime = pAnswers.reduce((sum, a) => sum + a.response_time, 0);
      const avgResponseTime = pAnswers.length > 0 ? parseFloat(((totalTime / pAnswers.length) / 1000).toFixed(2)) : 0;

      return {
        id: p.id,
        name: p.name,
        email: p.email || 'N/A',
        college: p.college,
        score: totalPoints,
        correctAnswers,
        avgResponseTime,
        violations: p.tab_switch_count,
        disqualified: p.disqualified ? 'Yes' : 'No'
      };
    });

    // Sort by score (descending), then correct answers (descending), then response speed (ascending)
    leaderboard.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.correctAnswers !== a.correctAnswers) return b.correctAnswers - a.correctAnswers;
      return a.avgResponseTime - b.avgResponseTime;
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Leaderboard');

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

    // Style the header row
    sheet.getRow(1).font = { bold: true };

    const filename = `Leaderboard_${quiz.title.replace(/\s+/g, '_')}`;

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);
      await workbook.csv.write(res);
    } else {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}.xlsx`);
      await workbook.xlsx.write(res);
    }
  } catch (error) {
    console.error('Export results error:', error);
    return res.status(500).json({ error: 'Server error generating leaderboard export' });
  }
});

// 2. Export Question-by-Question Detailed Responses
router.get('/quiz/:id/responses', authMiddleware, async (req, res) => {
  try {
    const quizId = req.params.id;
    const format = req.query.format === 'csv' ? 'csv' : 'xlsx';

    const quiz = await Quiz.findByPk(quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const participants = await Participant.findAll({ where: { quiz_id: quizId } });
    const questions = await Question.findAll({
      where: { quiz_id: quizId },
      order: [['order_index', 'ASC']]
    });
    const answers = await Answer.findAll({
      include: [{ model: Question, as: 'question', where: { quiz_id: quizId } }]
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Responses');

    // Define standard headers
    const columns = [
      { header: 'Participant Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'College', key: 'college', width: 35 }
    ];

    // Append a column for each question dynamically
    questions.forEach((q, idx) => {
      columns.push({
        header: `Q${idx + 1}: ${q.question.substring(0, 30)}...`,
        key: `q_${q.id}`,
        width: 25
      });
    });

    sheet.columns = columns;

    participants.forEach((p) => {
      const rowData = {
        name: p.name,
        email: p.email || 'N/A',
        college: p.college
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

    sheet.getRow(1).font = { bold: true };

    const filename = `Responses_${quiz.title.replace(/\s+/g, '_')}`;

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);
      await workbook.csv.write(res);
    } else {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}.xlsx`);
      await workbook.xlsx.write(res);
    }
  } catch (error) {
    console.error('Export responses error:', error);
    return res.status(500).json({ error: 'Server error generating responses export' });
  }
});

// 3. Publish & Automatically Issue Certificates to Certificate Verification Engine
router.post('/quiz/:id/publish-certificates', authMiddleware, async (req, res) => {
  try {
    const quizId = req.params.id;
    const quiz = await Quiz.findByPk(quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const participants = await Participant.findAll({ where: { quiz_id: quizId } });
    const questions = await Question.findAll({ where: { quiz_id: quizId } });
    const answers = await Answer.findAll({
      include: [{ model: Question, as: 'question', where: { quiz_id: quizId } }]
    });

    // Compute player statistics
    const leaderboard = participants.map((p) => {
      const pAnswers = answers.filter((ans) => ans.participant_id === p.id);
      const totalPoints = pAnswers.reduce((sum, a) => sum + a.points, 0);
      const correctAnswers = pAnswers.filter((a) => a.is_correct).length;
      const totalTime = pAnswers.reduce((sum, a) => sum + a.response_time, 0);
      const avgResponseTime = pAnswers.length > 0 ? parseFloat(((totalTime / pAnswers.length) / 1000).toFixed(2)) : 0;

      return {
        name: p.name,
        email: p.email && p.email !== 'N/A' ? p.email : `${p.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@mscprpcem.tech`,
        score: totalPoints,
        correctAnswers,
        avgResponseTime
      };
    });

    // Sort by score (descending), then correct answers (descending), then response speed (ascending)
    leaderboard.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.correctAnswers !== a.correctAnswers) return b.correctAnswers - a.correctAnswers;
      return a.avgResponseTime - b.avgResponseTime;
    });

    // Assign ranks
    const rankedParticipants = leaderboard.map((p, idx) => ({
      ...p,
      rank: idx + 1
    }));

    const certApiUrl = process.env.CERTIFICATE_API_URL || "https://msc-cert-verification-api-g2d4d9d9cygwgtd8.centralindia-01.azurewebsites.net/api/integration/publish-results";
    
    // Call Certificate Verification Engine API
    const response = await fetch(certApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "msc_quiz_verification_secret_key_2026"
      },
      body: JSON.stringify({
        quizTitle: quiz.title || quiz.event_name || "MSC Quiz Event",
        publishDate: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
        participants: rankedParticipants
      })
    });

    const certData = await response.json();
    return res.json({
      success: true,
      message: `Issued ${rankedParticipants.length} certificates to Certificate Engine!`,
      details: certData
    });
  } catch (error) {
    console.error('Publish certificates error:', error);
    return res.status(500).json({ error: 'Failed to dispatch certificates to Certificate Engine', details: error.message });
  }
});

module.exports = router;
