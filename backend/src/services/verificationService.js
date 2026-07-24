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

    // Filter out disqualified participants and calculate scores
    const activeParticipants = participants.filter((p) => !p.disqualified);

    const leaderboard = activeParticipants.map((p) => {
      const pAnswers = answers.filter((ans) => ans.participant_id === p.id);
      const totalPoints = pAnswers.reduce((sum, a) => sum + a.points, 0);
      const correctAnswers = pAnswers.filter((a) => a.is_correct).length;
      const totalTime = pAnswers.reduce((sum, a) => sum + a.response_time, 0);
      const exactAvgResponseTime = pAnswers.length > 0 ? totalTime / pAnswers.length : 999999;
      const avgResponseTime = pAnswers.length > 0 ? parseFloat((exactAvgResponseTime / 1000).toFixed(2)) : 0;

      return {
        id: p.id,
        name: p.name,
        email: p.email || 'N/A',
        college: p.college || 'MSC PRPCEM',
        score: totalPoints,
        correctAnswers,
        exactAvgResponseTime,
        avgResponseTime,
        violations: p.tab_switch_count || 0,
        disqualified: false
      };
    });

    // Sort leaderboard by score desc, correct answers desc, exact response time asc
    leaderboard.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.correctAnswers !== a.correctAnswers) return b.correctAnswers - a.correctAnswers;
      return a.exactAvgResponseTime - b.exactAvgResponseTime;
    });

    // Assign Ranks and Certificate Categories for active participants
    const attendees = leaderboard.map((p, index) => {
      const rank = index + 1;
      let category = 'Participation Certificate';
      if (rank === 1) category = '1st Place Winner';
      else if (rank === 2) category = '2nd Place Runner-Up';
      else if (rank === 3) category = '3rd Place Runner-Up';
      else if (rank <= 10) category = 'Top 10 Merit Certificate';

      return {
        participantId: p.id,
        name: p.name,
        email: p.email,
        college: p.college,
        score: p.score,
        correctAnswers: p.correctAnswers,
        rank,
        disqualified: false,
        certificateCategory: category
      };
    });

    const candidateUrls = [
      process.env.VERIFICATION_PLATFORM_URL,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://verify.mscprpcem.tech'
    ].filter(Boolean);

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
        date: quiz.updatedAt || new Date(),
        svgTemplate: quiz.svg_template || null
      },
      attendees
    };

    let responseData = null;
    let isSuccess = false;
    let lastError = null;

    for (const baseUrl of candidateUrls) {
      const endpoint = `${baseUrl.replace(/\/$/, '')}/api/webhooks/quiz-certificates`;
      console.log(`[VerificationService] Attempting Sync for Quiz "${quiz.title}" (${quiz.id}) to ${endpoint}...`);

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(4000)
        });

        if (res.ok) {
          responseData = await res.json();
          isSuccess = true;
          console.log(`[VerificationService] Successfully synced quiz "${quiz.title}" with Verification Platform via ${baseUrl}!`);
          break;
        } else {
          const errText = await res.text();
          lastError = `Status ${res.status}: ${errText}`;
        }
      } catch (httpError) {
        lastError = httpError.message;
        console.warn(`[VerificationService] Sync attempt to ${baseUrl} failed: ${httpError.message}`);
      }
    }

    if (!isSuccess) {
      console.warn(`[VerificationService] Direct HTTP sync failed on all endpoints (${lastError}). Local record updated.`);
      await quiz.update({
        verification_synced: false,
        verification_error: lastError || 'Verification Platform endpoint unreachable',
        verification_synced_at: new Date()
      });

      return {
        success: false,
        error: lastError || 'Verification Platform endpoint unreachable',
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
