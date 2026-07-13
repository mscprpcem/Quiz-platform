const express = require('express');
const router = express.Router();
const { Quiz, Question, Participant, Answer, Violation } = require('../models');
const authMiddleware = require('../middleware/auth');
const { Op } = require('sequelize');

router.get('/quiz/:id', authMiddleware, async (req, res) => {
  try {
    const quizId = req.params.id;
    const quiz = await Quiz.findByPk(quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Fetch quiz dependencies
    const questions = await Question.findAll({
      where: { quiz_id: quizId },
      order: [['order_index', 'ASC']]
    });
    const participants = await Participant.findAll({ where: { quiz_id: quizId } });
    const answers = await Answer.findAll({
      include: [
        {
          model: Question,
          as: 'question',
          where: { quiz_id: quizId }
        }
      ]
    });
    const violations = await Violation.findAll({ where: { quiz_id: quizId } });

    const totalParticipants = participants.length;
    const totalQuestions = questions.length;

    if (totalParticipants === 0) {
      return res.json({
        quizTitle: quiz.title,
        eventName: quiz.event_name,
        totalParticipants: 0,
        totalQuestions,
        averageResponseTime: 0,
        highestScore: 0,
        lowestScore: 0,
        completionPercentage: 0,
        questionAccuracy: [],
        mostMissedQuestion: 'N/A',
        scoreDistribution: [],
        accuracyChart: [],
        speedChart: []
      });
    }

    // Calculate score per participant
    const participantScores = {};
    participants.forEach((p) => {
      participantScores[p.id] = {
        name: p.name,
        college: p.college,
        email: p.email,
        score: 0,
        correctCount: 0,
        answerCount: 0,
        totalResponseTime: 0
      };
    });

    let totalAnswerTime = 0;
    let totalAnswersCount = 0;

    answers.forEach((ans) => {
      const pId = ans.participant_id;
      if (participantScores[pId]) {
        participantScores[pId].score += ans.points;
        participantScores[pId].answerCount += 1;
        participantScores[pId].totalResponseTime += ans.response_time;
        if (ans.is_correct) {
          participantScores[pId].correctCount += 1;
        }
      }
      totalAnswerTime += ans.response_time;
      totalAnswersCount += 1;
    });

    const scoresList = Object.values(participantScores).map((p) => p.score);
    const highestScore = scoresList.length > 0 ? Math.max(...scoresList) : 0;
    const lowestScore = scoresList.length > 0 ? Math.min(...scoresList) : 0;

    // Average response time in seconds
    const averageResponseTime =
      totalAnswersCount > 0 ? parseFloat(((totalAnswerTime / totalAnswersCount) / 1000).toFixed(2)) : 0;

    // Completion percentage: participants who answered all questions
    const completedCount = Object.values(participantScores).filter(
      (p) => p.answerCount === totalQuestions && totalQuestions > 0
    ).length;
    const completionPercentage =
      totalParticipants > 0 ? Math.round((completedCount / totalParticipants) * 100) : 0;

    // Question-wise Accuracy
    const questionAccuracy = [];
    const accuracyChart = [];
    const speedChart = [];
    let lowestAccuracy = 1.1; // Accuracy represents 0 to 1
    let mostMissedQuestion = 'N/A';

    questions.forEach((q, idx) => {
      const qAnswers = answers.filter((ans) => ans.question_id === q.id);
      const qCorrectAnswers = qAnswers.filter((ans) => ans.is_correct);
      const qAccuracy = qAnswers.length > 0 ? qCorrectAnswers.length / qAnswers.length : 0;
      const qAccuracyPct = Math.round(qAccuracy * 100);

      const qAvgResponseTime =
        qAnswers.length > 0
          ? parseFloat(((qAnswers.reduce((sum, a) => sum + a.response_time, 0) / qAnswers.length) / 1000).toFixed(2))
          : 0;

      questionAccuracy.push({
        questionId: q.id,
        questionText: q.question,
        index: idx + 1,
        accuracy: qAccuracyPct,
        avgResponseTime: qAvgResponseTime,
        correctCount: qCorrectAnswers.length,
        totalSubmissions: qAnswers.length
      });

      accuracyChart.push({
        name: `Q${idx + 1}`,
        Accuracy: qAccuracyPct
      });

      speedChart.push({
        name: `Q${idx + 1}`,
        'Avg Speed (s)': qAvgResponseTime
      });

      if (qAnswers.length > 0 && qAccuracy < lowestAccuracy) {
        lowestAccuracy = qAccuracy;
        mostMissedQuestion = q.question;
      }
    });

    // Score distribution calculation
    // Create 5 buckets based on highest score
    const bucketSize = highestScore > 0 ? Math.ceil(highestScore / 5) : 500;
    const scoreDistribution = [];
    for (let i = 0; i < 5; i++) {
      const minVal = i * bucketSize;
      const maxVal = (i + 1) * bucketSize;
      const label = `${minVal} - ${maxVal}`;
      const count = scoresList.filter((s) => s >= minVal && s < maxVal).length;
      // For the last bucket, include the boundary
      const countAdjusted = i === 4 ? scoresList.filter((s) => s >= minVal && s <= maxVal).length : count;

      scoreDistribution.push({
        range: label,
        Count: countAdjusted
      });
    }

    return res.json({
      quizTitle: quiz.title,
      eventName: quiz.event_name,
      totalParticipants,
      totalQuestions,
      averageResponseTime,
      highestScore,
      lowestScore,
      completionPercentage,
      questionAccuracy,
      mostMissedQuestion: mostMissedQuestion === 'N/A' && questions.length > 0 ? 'None yet' : mostMissedQuestion,
      scoreDistribution,
      accuracyChart,
      speedChart
    });
  } catch (error) {
    console.error('Analytics fetching error:', error);
    return res.status(500).json({ error: 'Server error compiling analytics' });
  }
});

module.exports = router;
