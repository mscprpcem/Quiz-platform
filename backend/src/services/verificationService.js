const { Quiz, Question, Participant, Answer } = require('../models');

/**
 * Service to handle auto-issuance of certificates and auto-syncing of event & attendee data
 * with the external Verification Platform.
 */
async function syncQuizCertificates(quizId) {
  try {
    const quiz = await Quiz.findByPk(quizId);
    if (!quiz) {
      throw new Error(`Quiz with ID ${quizId} not found`);
    }

    const participants = await Participant.findAll({ where: { quiz_id: quizId } });
    const questions = await Question.findAll({ where: { quiz_id: quizId } });
    const answers = await Answer.findAll({
      include: [{ model: Question, as: 'question', where: { quiz_id: quizId } }]
    });

    // Calculate Leaderboard
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
        college: p.college || 'MSC PRPCEM',
        score: totalPoints,
        correctAnswers,
        avgResponseTime,
        violations: p.tab_switch_count || 0,
        disqualified: p.disqualified || false
      };
    });

    // Sort leaderboard by score desc, correct answers desc, avg response time asc
    leaderboard.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.correctAnswers !== a.correctAnswers) return b.correctAnswers - a.correctAnswers;
      return a.avgResponseTime - b.avgResponseTime;
    });

    // Assign Ranks and Certificate Categories
    const attendees = leaderboard.map((p, index) => {
      const rank = index + 1;
      let category = 'Participation Certificate';
      if (rank === 1 && !p.disqualified) category = '1st Place Winner';
      else if (rank === 2 && !p.disqualified) category = '2nd Place Runner-Up';
      else if (rank === 3 && !p.disqualified) category = '3rd Place Runner-Up';
      else if (rank <= 10 && !p.disqualified) category = 'Top 10 Merit Certificate';

      return {
        participantId: p.id,
        name: p.name,
        email: p.email,
        college: p.college,
        score: p.score,
        correctAnswers: p.correctAnswers,
        rank,
        disqualified: p.disqualified,
        certificateCategory: category
      };
    });

    const verificationPlatformUrl = process.env.VERIFICATION_PLATFORM_URL || 'https://verify.mscprpcem.tech';
    const apiKey = process.env.VERIFICATION_API_KEY || 'msc_quiz_verification_secret_key_2026';

    const payload = {
      event: {
        quizId: quiz.id,
        title: quiz.title,
        eventName: quiz.event_name,
        joinCode: quiz.join_code,
        description: quiz.description,
        totalQuestions: questions.length,
        totalParticipants: attendees.length,
        date: quiz.updatedAt || new Date()
      },
      attendees
    };

    console.log(`[VerificationService] Syncing Quiz ${quiz.title} (${quiz.id}) to ${verificationPlatformUrl}...`);

    const endpoint = `${verificationPlatformUrl.replace(/\/$/, '')}/api/webhooks/quiz-certificates`;

    let responseData = null;
    let isSuccess = false;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        responseData = await res.json();
        isSuccess = true;
      } else {
        const errText = await res.text();
        throw new Error(`Platform responded with status ${res.status}: ${errText}`);
      }
    } catch (httpError) {
      console.warn(`[VerificationService] Direct HTTP sync warning (${httpError.message}). Local record updated.`);
      await quiz.update({
        verification_synced: false,
        verification_error: httpError.message,
        verification_synced_at: new Date()
      });

      return {
        success: false,
        error: httpError.message,
        payload
      };
    }

    if (isSuccess) {
      await quiz.update({
        verification_synced: true,
        verification_synced_at: new Date(),
        verification_event_id: responseData?.eventId || quiz.id,
        verification_error: null
      });

      console.log(`[VerificationService] Successfully synced quiz ${quiz.title} with Verification Platform!`);
    }

    return {
      success: isSuccess,
      data: responseData,
      payload
    };
  } catch (err) {
    console.error('[VerificationService] Error syncing quiz certificates:', err);
    throw err;
  }
}

module.exports = {
  syncQuizCertificates
};
