const { Quiz, Question, Participant, Answer, Violation, sequelize } = require('../models');

// In-memory store for active quiz sessions, socket mapping, and timers
// Format: { [quizId]: { activeQuestionId: string, timerStartedAt: Date, timerValue: number, questionStatus: string, answersReceived: Set(participantId) } }
const activeQuizzes = {};

const initializeSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // ----------------------------------------------------
    // ADMIN EVENTS
    // ----------------------------------------------------

    // Admin joins the lobby / manager for a quiz
    socket.on('admin_join_quiz', async ({ quizId }) => {
      try {
        socket.join(`quiz_${quizId}`);
        socket.join(`admin_${quizId}`);
        console.log(`Admin joined quiz room: quiz_${quizId}`);

        // Initialize active state in memory if not already present
        if (!activeQuizzes[quizId]) {
          const quiz = await Quiz.findByPk(quizId);
          if (quiz) {
            let activeQuestionId = null;
            if (quiz.current_question_index >= 0) {
              const question = await Question.findOne({
                where: { quiz_id: quizId },
                order: [['order_index', 'ASC']],
                offset: quiz.current_question_index
              });
              if (question) activeQuestionId = question.id;
            }

            activeQuizzes[quizId] = {
              activeQuestionId,
              questionStatus: quiz.current_question_status || 'closed',
              answersReceived: new Set(),
              timerValue: 0,
              leaderboardReleased: false
            };
          }
        }

        // Send current list of joined participants to Admin
        const participants = await Participant.findAll({
          where: { quiz_id: quizId },
          order: [['createdAt', 'ASC']]
        });

        socket.emit('lobby_participants_update', participants);
        socket.emit('leaderboard_status', { released: activeQuizzes[quizId]?.leaderboardReleased || false });
      } catch (err) {
        console.error('admin_join_quiz error:', err);
      }
    });

    // Admin starts the quiz lobby (changes status to waiting_lobby)
    socket.on('start_lobby', async ({ quizId }) => {
      try {
        const quiz = await Quiz.findByPk(quizId);
        if (quiz && quiz.status === 'draft') {
          await quiz.update({ status: 'waiting_lobby' });
          io.to(`quiz_${quizId}`).emit('lobby_started', { status: 'waiting_lobby' });
        }
      } catch (err) {
        console.error('start_lobby error:', err);
      }
    });

    // Admin starts the quiz game (changes status to in_progress)
    socket.on('start_quiz', async ({ quizId }) => {
      try {
        const quiz = await Quiz.findByPk(quizId);
        if (quiz && (quiz.status === 'waiting_lobby' || quiz.status === 'draft')) {
          await quiz.update({
            status: 'in_progress',
            current_question_index: 0,
            current_question_status: 'closed'
          });

          if (!activeQuizzes[quizId]) {
            activeQuizzes[quizId] = {};
          }
          activeQuizzes[quizId].questionStatus = 'closed';
          activeQuizzes[quizId].answersReceived = new Set();

          io.to(`quiz_${quizId}`).emit('quiz_started');
        }
      } catch (err) {
        console.error('start_quiz error:', err);
      }
    });

    // Admin releases a question
    socket.on('release_question', async ({ quizId, questionIndex }) => {
      try {
        const quiz = await Quiz.findByPk(quizId);
        if (!quiz || quiz.status !== 'in_progress') return;

        // Fetch question by index (offset)
        const question = await Question.findOne({
          where: { quiz_id: quizId },
          order: [['order_index', 'ASC']],
          offset: questionIndex
        });

        if (!question) {
          socket.emit('error_message', { message: 'Question not found at this index' });
          return;
        }

        await quiz.update({
          current_question_index: questionIndex,
          current_question_status: 'released'
        });

        // Track state in memory
        activeQuizzes[quizId] = {
          activeQuestionId: question.id,
          questionStatus: 'released',
          timerStartedAt: new Date(),
          timerValue: question.timer,
          answersReceived: new Set()
        };

        const totalQuestions = await Question.count({ where: { quiz_id: quizId } });

        // Broadcast question to participants (do NOT send correct_answer!)
        io.to(`quiz_${quizId}`).emit('question_released', {
          questionIndex,
          questionId: question.id,
          question: question.question,
          option_a: question.option_a,
          option_b: question.option_b,
          option_c: question.option_c,
          option_d: question.option_d,
          timer: question.timer,
          marks: question.marks,
          totalQuestions
        });
      } catch (err) {
        console.error('release_question error:', err);
      }
    });

    // Admin ends the current question (locks submissions and shows answers)
    socket.on('end_question', async ({ quizId }) => {
      try {
        const quiz = await Quiz.findByPk(quizId);
        if (!quiz || !activeQuizzes[quizId]) return;

        activeQuizzes[quizId].questionStatus = 'timer_ended';
        await quiz.update({ current_question_status: 'timer_ended' });

        const question = await Question.findByPk(activeQuizzes[quizId].activeQuestionId);
        if (!question) return;

        // Calculate updated top 10 standings after question end
        const fullLeaderboard = await getLiveLeaderboard(quizId);
        const top10 = fullLeaderboard.slice(0, 10);

        // Broadcast correct answer & Top 10 standings
        io.to(`quiz_${quizId}`).emit('question_ended', {
          correctAnswer: question.correct_answer,
          leaderboard: top10
        });
      } catch (err) {
        console.error('end_question error:', err);
      }
    });

    // Admin skips a question
    socket.on('skip_question', async ({ quizId }) => {
      try {
        const quiz = await Quiz.findByPk(quizId);
        if (!quiz) return;

        // Automatically close the question if running
        if (activeQuizzes[quizId]) {
          activeQuizzes[quizId].questionStatus = 'closed';
        }

        const nextIndex = quiz.current_question_index + 1;
        const totalQuestions = await Question.count({ where: { quiz_id: quizId } });

        if (nextIndex >= totalQuestions) {
          // Last question skipped, end quiz session and notify participants to wait for leaderboard
          await quiz.update({ status: 'completed' });
          if (activeQuizzes[quizId]) {
            activeQuizzes[quizId].questionStatus = 'closed';
            activeQuizzes[quizId].leaderboardReleased = false;
          }
          io.to(`admin_${quizId}`).emit('leaderboard_status', { released: false });
          io.to(`quiz_${quizId}`).emit('quiz_completed');
        } else {
          await quiz.update({
            current_question_index: nextIndex,
            current_question_status: 'closed'
          });
          io.to(`quiz_${quizId}`).emit('question_skipped', { nextIndex });
        }
      } catch (err) {
        console.error('skip_question error:', err);
      }
    });

    // Admin pauses the quiz
    socket.on('pause_quiz', ({ quizId }) => {
      io.to(`quiz_${quizId}`).emit('quiz_paused');
    });

    // Admin resumes the quiz
    socket.on('resume_quiz', ({ quizId }) => {
      io.to(`quiz_${quizId}`).emit('quiz_resumed');
    });

    // Admin ends the entire quiz (but does not release leaderboard yet)
    socket.on('end_quiz', async ({ quizId }) => {
      try {
        const quiz = await Quiz.findByPk(quizId);
        if (!quiz) return;

        await quiz.update({ status: 'completed' });
        if (activeQuizzes[quizId]) {
          activeQuizzes[quizId].questionStatus = 'closed';
          activeQuizzes[quizId].leaderboardReleased = false;
        }

        // Notify admins that the leaderboard state is unreleased
        io.to(`admin_${quizId}`).emit('leaderboard_status', { released: false });

        // Broadcast to participants that the quiz is completed and to wait
        io.to(`quiz_${quizId}`).emit('quiz_completed');

        // Auto Sync Certificates and Event data with Verification Platform
        if (process.env.AUTO_ISSUE_CERTIFICATES !== 'false') {
          syncQuizCertificates(quizId)
            .then((res) => {
              io.to(`admin_${quizId}`).emit('verification_sync_status', res);
            })
            .catch((err) => {
              console.error('Socket auto-sync certificate error:', err);
            });
        }
      } catch (err) {
        console.error('end_quiz error:', err);
      }
    });

    // Admin manually releases the leaderboard to students
    socket.on('release_leaderboard', async ({ quizId }) => {
      try {
        if (activeQuizzes[quizId]) {
          activeQuizzes[quizId].leaderboardReleased = true;
        }

        // Notify admins
        io.to(`admin_${quizId}`).emit('leaderboard_status', { released: true });

        // Compile and release the leaderboard standings to all participant sockets
        const leaderboard = await getLiveLeaderboard(quizId);
        io.to(`quiz_${quizId}`).emit('quiz_ended', { leaderboard });

        // Auto Sync Certificates and Event data on release as well
        if (process.env.AUTO_ISSUE_CERTIFICATES !== 'false') {
          syncQuizCertificates(quizId)
            .then((res) => {
              io.to(`admin_${quizId}`).emit('verification_sync_status', res);
            })
            .catch((err) => {
              console.error('Socket release auto-sync certificate error:', err);
            });
        }
      } catch (err) {
        console.error('release_leaderboard error:', err);
      }
    });

    // Admin removes/kicks a participant
    socket.on('kick_participant', async ({ quizId, participantId }) => {
      try {
        const participant = await Participant.findByPk(participantId);
        if (participant) {
          await participant.destroy();
          // Find and notify client
          io.to(`quiz_${quizId}`).emit('participant_kicked', { participantId });

          // Refresh participant list on Admin board and participant waiting rooms
          const participants = await Participant.findAll({
            where: { quiz_id: quizId },
            order: [['createdAt', 'ASC']]
          });
          io.to(`admin_${quizId}`).emit('lobby_participants_update', participants);
          io.to(`quiz_${quizId}`).emit('lobby_participants_update', participants);
          io.to(`quiz_${quizId}`).emit('participant_count_update', { count: participants.length });
        }
      } catch (err) {
        console.error('kick_participant error:', err);
      }
    });

    // ----------------------------------------------------
    // PARTICIPANT EVENTS
    // ----------------------------------------------------

    // Participant joins a quiz room
    socket.on('join_quiz', async ({ name, college, email, joinCode }) => {
      try {
        // Find active/waiting quiz by join code
        const quiz = await Quiz.findOne({
          where: {
            join_code: joinCode?.toUpperCase()
          }
        });

        if (!quiz) {
          socket.emit('join_error', { message: 'Invalid Join Code' });
          return;
        }

        if (quiz.status === 'completed') {
          socket.emit('join_error', { message: 'This quiz has already ended' });
          return;
        }

        // Add participant to DB (or find existing by email/name in the same quiz)
        let participant = await Participant.findOne({
          where: {
            quiz_id: quiz.id,
            name,
            college
          }
        });

        if (!participant) {
          participant = await Participant.create({
            quiz_id: quiz.id,
            name,
            college,
            email: email || null,
            connection_status: 'connected'
          });
        } else {
          // Re-connecting participant
          await participant.update({ connection_status: 'connected' });
        }

        // Store information on the socket object
        socket.participantId = participant.id;
        socket.quizId = quiz.id;
        socket.name = name;

        // Join socket rooms
        socket.join(`quiz_${quiz.id}`);

        socket.emit('join_success', {
          participantId: participant.id,
          quizId: quiz.id,
          title: quiz.title,
          eventName: quiz.event_name,
          quizStatus: quiz.status,
          currentQuestionIndex: quiz.current_question_index,
          currentQuestionStatus: quiz.current_question_status,
          scheduledStart: quiz.scheduled_start,
          name: participant.name,
          college: participant.college,
          email: participant.email,
          joinCode: quiz.join_code
        });

        // Broadcast updated participants list to admins AND to all room participants
        const participants = await Participant.findAll({
          where: { quiz_id: quiz.id },
          order: [['createdAt', 'ASC']]
        });
        io.to(`admin_${quiz.id}`).emit('lobby_participants_update', participants);
        io.to(`quiz_${quiz.id}`).emit('lobby_participants_update', participants);
        io.to(`quiz_${quiz.id}`).emit('participant_count_update', { count: participants.length });
      } catch (err) {
        console.error('join_quiz error:', err);
        socket.emit('join_error', { message: 'Server error joining quiz' });
      }
    });

    // Participant rejoins/syncs after disconnection
    socket.on('rejoin_quiz', async ({ participantId, quizId }) => {
      try {
        const participant = await Participant.findByPk(participantId);
        const quiz = await Quiz.findByPk(quizId);

        if (!participant || !quiz) {
          socket.emit('rejoin_error', { message: 'Participant or Quiz session not found' });
          return;
        }

        if (quiz.status === 'completed') {
          const leaderboard = await getLiveLeaderboard(quiz.id);
          const playerStats = leaderboard.find((p) => p.id === participant.id);

          socket.emit('rejoin_success', {
            participantId: participant.id,
            quizId: quiz.id,
            quizStatus: 'completed',
            isCompleted: true,
            message: 'This quiz session has already ended.',
            title: quiz.title,
            eventName: quiz.event_name,
            leaderboard,
            playerStats: playerStats ? {
              rank: leaderboard.indexOf(playerStats) + 1,
              score: playerStats.score,
              correctAnswers: playerStats.correctAnswers,
              avgResponseTime: playerStats.avgResponseTime
            } : {
              rank: 'N/A',
              score: 0,
              correctAnswers: 0,
              avgResponseTime: 0
            }
          });
          return;
        }

        // Associate socket
        socket.participantId = participant.id;
        socket.quizId = quiz.id;
        socket.name = participant.name;

        // Reconnect update connection status
        await participant.update({ connection_status: 'connected' });

        // Join rooms
        socket.join(`quiz_${quiz.id}`);

        // Broadcast updated participants list to admins AND room
        const participants = await Participant.findAll({
          where: { quiz_id: quiz.id },
          order: [['createdAt', 'ASC']]
        });
        io.to(`admin_${quiz.id}`).emit('lobby_participants_update', participants);
        io.to(`quiz_${quiz.id}`).emit('lobby_participants_update', participants);
        io.to(`quiz_${quiz.id}`).emit('participant_count_update', { count: participants.length });

        const totalQuestions = await Question.count({ where: { quiz_id: quiz.id } });

        // Calculate and send current state
        const responseData = {
          participantId: participant.id,
          quizId: quiz.id,
          title: quiz.title,
          eventName: quiz.event_name,
          quizStatus: quiz.status,
          currentQuestionIndex: quiz.current_question_index,
          currentQuestionStatus: quiz.current_question_status,
          scheduledStart: quiz.scheduled_start,
          disqualified: participant.disqualified,
          tabSwitchCount: participant.tab_switch_count,
          name: participant.name,
          college: participant.college,
          email: participant.email,
          joinCode: quiz.join_code,
          totalParticipants: participants.length,
          totalQuestions
        };

        // If quiz is in progress, we need to send active question details
        const quizState = activeQuizzes[quiz.id];
        if (quiz.status === 'in_progress' && quizState) {
          const currentQuestionId = quizState.activeQuestionId;
          if (currentQuestionId) {
            const question = await Question.findByPk(currentQuestionId);
            if (question) {
              responseData.currentQuestion = {
                questionIndex: quiz.current_question_index,
                questionId: question.id,
                question: question.question,
                option_a: question.option_a,
                option_b: question.option_b,
                option_c: question.option_c,
                option_d: question.option_d,
                timer: question.timer,
                marks: question.marks,
                totalQuestions
              };

              // Calculate remaining time
              if (quizState.questionStatus === 'released' && quizState.timerStartedAt) {
                const elapsedSeconds = Math.floor((new Date() - new Date(quizState.timerStartedAt)) / 1000);
                const remainingTime = Math.max(0, question.timer - elapsedSeconds);
                responseData.remainingTime = remainingTime;
              } else {
                responseData.remainingTime = 0;
              }

              // Check if they already answered this question
              const alreadyAnswered = await Answer.findOne({
                where: {
                  participant_id: participantId,
                  question_id: currentQuestionId
                }
              });

              if (alreadyAnswered) {
                responseData.submitted = true;
                responseData.selectedAnswer = alreadyAnswered.selected_answer;
                responseData.feedbackData = {
                  isCorrect: alreadyAnswered.is_correct,
                  points: alreadyAnswered.points,
                  correctAnswer: quizState.questionStatus === 'timer_ended' ? question.correct_answer : null
                };
              } else {
                responseData.submitted = false;
                responseData.selectedAnswer = null;
              }

              if (quizState.questionStatus === 'timer_ended') {
                // Fetch leaderboard
                const leaderboard = await getLiveLeaderboard(quiz.id);
                const playerStats = leaderboard.find((p) => p.id === participant.id);
                responseData.feedbackData = {
                  ...responseData.feedbackData,
                  correctAnswer: question.correct_answer,
                  rank: playerStats ? leaderboard.indexOf(playerStats) + 1 : 'N/A',
                  totalScore: playerStats ? playerStats.score : 0
                };
              }
            }
          }
        }

        socket.emit('rejoin_success', responseData);
      } catch (err) {
        console.error('rejoin_quiz error:', err);
        socket.emit('rejoin_error', { message: 'Server error during sync rejoin' });
      }
    });

    // Participant submits an answer
    socket.on('submit_answer', async ({ questionId, selectedAnswer, responseTime }) => {
      try {
        const participantId = socket.participantId;
        const quizId = socket.quizId;

        if (!participantId || !quizId) return;

        // Check if question is released and submissions are open
        const quizState = activeQuizzes[quizId];
        if (!quizState || quizState.activeQuestionId !== questionId || quizState.questionStatus !== 'released') {
          socket.emit('submit_error', { message: 'Submissions are closed for this question' });
          return;
        }

        // Check if already answered
        if (quizState.answersReceived.has(participantId)) {
          socket.emit('submit_error', { message: 'Answer already submitted' });
          return;
        }

        // Check if participant is disqualified
        const participant = await Participant.findByPk(participantId);
        if (!participant || participant.disqualified) {
          socket.emit('submit_error', { message: 'You have been disqualified' });
          return;
        }

        const question = await Question.findByPk(questionId);
        if (!question) return;

        // Scoring rules
        const isCorrect = selectedAnswer === question.correct_answer;
        let points = 0;

        if (isCorrect) {
          // Speed Bonus Math
          // Max Speed Bonus = 30% of base marks
          const maxSpeedBonus = Math.round(question.marks * 0.3);
          const responseTimeSeconds = responseTime / 1000;
          const timeRatio = (question.timer - responseTimeSeconds) / question.timer;
          const speedBonus = Math.round(maxSpeedBonus * Math.max(0, timeRatio));

          points = question.marks + speedBonus;

          // Deduct points for tab switching / window violations - Disabled for now
          /*
          if (participant.tab_switch_count === 2) {
            points = Math.round(points * 0.8); // 20% points deduction
          } else if (participant.tab_switch_count >= 3) {
            points = 0; // Disqualified from points for this question
          }
          */
        }

        // Save answer to database
        await Answer.create({
          participant_id: participantId,
          question_id: questionId,
          selected_answer: selectedAnswer,
          response_time: responseTime,
          is_correct: isCorrect,
          points
        });

        // Mark as answered in-memory
        quizState.answersReceived.add(participantId);

        // Tell participant submission succeeded
        socket.emit('answer_received', { points, isCorrect });

        // Update active participant dashboard stats
        const totalJoined = await Participant.count({ where: { quiz_id: quizId } });
        io.to(`admin_${quizId}`).emit('question_progress_update', {
          submittedCount: quizState.answersReceived.size,
          totalCount: totalJoined
        });
      } catch (err) {
        console.error('submit_answer error:', err);
      }
    });

    // Participant reports a violation (tab switch, exit fullscreen, etc.)
    socket.on('report_violation', async ({ violationType }) => {
      // Disabled for now
      return;
      try {
        const participantId = socket.participantId;
        const quizId = socket.quizId;

        if (!participantId || !quizId) return;

        const participant = await Participant.findByPk(participantId);
        if (!participant || participant.disqualified) return;

        // Increment violation count
        const newSwitchCount = participant.tab_switch_count + 1;
        let disqualified = false;

        if (newSwitchCount >= 3) {
          disqualified = true; // Auto-submit or mark as violation
        }

        await participant.update({
          tab_switch_count: newSwitchCount,
          disqualified
        });

        // Save violation to table
        await Violation.create({
          participant_id: participantId,
          quiz_id: quizId,
          violation_type: violationType
        });

        // Send alert back to participant
        socket.emit('violation_alert', {
          count: newSwitchCount,
          disqualified,
          message:
            newSwitchCount === 1
              ? 'Warning: Exiting the quiz window is NOT allowed! Future violations will deduct points.'
              : newSwitchCount === 2
              ? 'Second Warning: Exiting the quiz window has resulted in a 20% point deduction for this question.'
              : 'Violation Limit Reached: You have been disqualified from this question/quiz.'
        });

        // Update admin telemetry board
        const participants = await Participant.findAll({
          where: { quiz_id: quizId },
          order: [['createdAt', 'ASC']]
        });
        io.to(`admin_${quizId}`).emit('lobby_participants_update', participants);
      } catch (err) {
        console.error('report_violation error:', err);
      }
    });

    // ----------------------------------------------------
    // CLEANUP & CONNECTION LOSS HANDLING
    // ----------------------------------------------------
    socket.on('disconnect', async () => {
      try {
        console.log(`Socket disconnected: ${socket.id}`);
        const participantId = socket.participantId;
        const quizId = socket.quizId;

        if (participantId && quizId) {
          // Update Participant connection status to disconnected
          const participant = await Participant.findByPk(participantId);
          if (participant) {
            await participant.update({ connection_status: 'disconnected' });
          }

          // Update admins of connection status change
          const participants = await Participant.findAll({
            where: { quiz_id: quizId },
            order: [['createdAt', 'ASC']]
          });
          io.to(`admin_${quizId}`).emit('lobby_participants_update', participants);
        }
      } catch (err) {
        console.error('disconnect handler error:', err);
      }
    });
  });
};

// Helper: Calculate and compile live standings for a quiz
const getLiveLeaderboard = async (quizId) => {
  try {
    const participants = await Participant.findAll({
      where: { quiz_id: quizId }
    });

    const answers = await Answer.findAll({
      include: [
        {
          model: Question,
          as: 'question',
          where: { quiz_id: quizId }
        }
      ]
    });

    const leaderboard = participants.map((p) => {
      const pAnswers = answers.filter((a) => a.participant_id === p.id);
      const score = pAnswers.reduce((sum, a) => sum + a.points, 0);
      const correctAnswers = pAnswers.filter((a) => a.is_correct).length;
      const totalTime = pAnswers.reduce((sum, a) => sum + a.response_time, 0);
      const avgResponseTime = pAnswers.length > 0 ? parseFloat(((totalTime / pAnswers.length) / 1000).toFixed(2)) : 0;

      return {
        id: p.id,
        name: p.name,
        college: p.college,
        score,
        correctAnswers,
        avgResponseTime,
        violations: p.tab_switch_count,
        connectionStatus: p.connection_status
      };
    });

    // Sort by Score DESC, then CorrectAnswers DESC, then AvgResponseTime ASC
    leaderboard.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.correctAnswers !== a.correctAnswers) return b.correctAnswers - a.correctAnswers;
      return a.avgResponseTime - b.avgResponseTime;
    });

    return leaderboard;
  } catch (err) {
    console.error('getLiveLeaderboard error:', err);
    return [];
  }
};

module.exports = {
  initializeSocket
};
