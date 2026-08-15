const express = require('express');
const router = express.Router();
const { Quiz, Question, Participant, QuizAttempt, ScheduledOccurrence, User } = require('../models');
const { sendCustomBroadcastEmail } = require('../services/emailService');
const { Op } = require('sequelize');

// Public base URL for Quiz platform links
const getQuizPlatformBaseUrl = () => {
  return (process.env.PUBLIC_QUIZ_URL || process.env.FRONTEND_URL || 'https://quiz.mscprpcem.tech').replace(/\/+$/, '');
};

// ----------------------------------------------------
// GET /api/events/public (or /api/events)
// Returns all active & upcoming events created on the Quiz platform for external portals (e.g. mscprpcem-website)
// ----------------------------------------------------
router.get(['/public', '/'], async (req, res) => {
  try {
    const now = new Date();
    const baseUrl = getQuizPlatformBaseUrl();

    const quizzes = await Quiz.findAll({
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: ScheduledOccurrence,
          as: 'occurrences',
          required: false,
          attributes: ['id', 'start_time', 'end_time', 'status']
        }
      ]
    });

    const activeEvents = [];

    for (const q of quizzes) {
      if (!q) continue;

      // Exclude cancelled/archived
      if (['cancelled', 'archived'].includes((q.status || '').toLowerCase())) {
        continue;
      }

      // Check occurrences or standard schedule
      let startTime = q.scheduled_start || q.createdAt;
      let endTime = q.scheduled_end;
      let isScheduled = q.mode === 'SCHEDULED' || (q.occurrences && q.occurrences.length > 0);
      let occurrenceStatus = q.status;

      if (q.occurrences && q.occurrences.length > 0) {
        // Find active or closest upcoming occurrence
        const validOccurrences = q.occurrences.filter(occ => {
          const occEnd = occ.end_time ? new Date(occ.end_time) : null;
          return !occEnd || occEnd >= now;
        });

        if (validOccurrences.length > 0) {
          const nextOcc = validOccurrences[0];
          startTime = nextOcc.start_time;
          endTime = nextOcc.end_time;
          occurrenceStatus = nextOcc.status;
        } else {
          // All occurrences ended
          continue;
        }
      } else if (endTime && new Date(endTime) < now) {
        // Past standard quiz
        continue;
      }

      // Counts
      const [questionCount, liveCount, attemptCount] = await Promise.all([
        Question.count({ where: { quiz_id: q.id } }).catch(() => 0),
        Participant.count({ where: { quiz_id: q.id } }).catch(() => 0),
        QuizAttempt.count({ where: { quiz_id: q.id } }).catch(() => 0)
      ]);

      const registrationCount = liveCount + attemptCount;
      const slug = q.custom_slug || (q.title ? q.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : q.join_code);
      const directUrl = isScheduled ? `${baseUrl}/q/${slug}` : `${baseUrl}/join/${q.join_code}`;

      const sDate = startTime ? new Date(startTime) : null;
      const isLiveNow = sDate && sDate <= now && (!endTime || new Date(endTime) >= now);
      const isUpcoming = sDate && sDate > now;

      activeEvents.push({
        id: q.id,
        slug,
        title: q.title || 'Tech Event Assessment',
        event_name: q.event_name || 'MSC Tech Event',
        description: q.description || `Official assessment and tech challenge for ${q.event_name || q.title}.`,
        category: q.category || q.subject || 'Technical',
        subject: q.subject || q.category || 'Technology',
        mode: q.mode || 'SCHEDULED',
        join_code: q.join_code,
        status: isLiveNow ? 'LIVE' : isUpcoming ? 'UPCOMING' : 'OPEN',
        start_time: startTime,
        end_time: endTime,
        question_count: questionCount,
        registration_count: registrationCount,
        direct_quiz_url: directUrl,
        registration_url: `${baseUrl}/courses`,
        is_live: isLiveNow,
        is_upcoming: isUpcoming,
        created_at: q.createdAt
      });
    }

    // Sort: Live first, then closest upcoming start time
    activeEvents.sort((a, b) => {
      if (a.is_live && !b.is_live) return -1;
      if (!a.is_live && b.is_live) return 1;
      const aTime = new Date(a.start_time || 0).getTime();
      const bTime = new Date(b.start_time || 0).getTime();
      return aTime - bTime;
    });

    res.json({
      success: true,
      count: activeEvents.length,
      events: activeEvents
    });
  } catch (err) {
    console.error('Error fetching public events:', err);
    res.status(500).json({ error: 'Failed to fetch public events.' });
  }
});

// ----------------------------------------------------
// POST /api/events/register
// Allows external website (mscprpcem-website) to register participants for a specific event / quiz
// ----------------------------------------------------
router.post('/register', async (req, res) => {
  try {
    const {
      eventId,
      quizId,
      slug,
      joinCode,
      name,
      email,
      college = 'PRPCEM Amravati',
      phone,
      year,
      branch
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Participant Full Name is required.' });
    }
    if (!email || !email.trim() || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid Participant Email address is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();
    const cleanCollege = (college || 'PRPCEM Amravati').trim();

    // 1. Locate the Quiz
    const targetQuery = eventId || quizId || slug || joinCode;
    if (!targetQuery) {
      return res.status(400).json({ error: 'Event ID, Quiz ID, or Slug is required to register.' });
    }

    let quiz = null;
    if (eventId || quizId) {
      quiz = await Quiz.findByPk(eventId || quizId);
    }
    if (!quiz && slug) {
      quiz = await Quiz.findOne({
        where: {
          [Op.or]: [
            { custom_slug: slug },
            { id: slug }
          ]
        }
      });
    }
    if (!quiz && joinCode) {
      quiz = await Quiz.findOne({ where: { join_code: joinCode.toUpperCase().trim() } });
    }

    if (!quiz) {
      return res.status(404).json({ error: 'Event or Quiz not found.' });
    }

    // 2. Find or Create User Account
    let user = await User.findOne({ where: { email: cleanEmail } });
    if (!user) {
      const autoUsername = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(100 + Math.random() * 900);
      user = await User.create({
        name: cleanName,
        email: cleanEmail,
        username: autoUsername,
        college: cleanCollege,
        role: 'student',
        is_verified: true
      });
    } else {
      // Update college and name if missing
      if (!user.college && cleanCollege) {
        await user.update({ college: cleanCollege }).catch(() => {});
      }
    }

    // 3. Register as Participant
    const existingParticipant = await Participant.findOne({
      where: { quiz_id: quiz.id, email: cleanEmail }
    });

    if (!existingParticipant) {
      await Participant.create({
        quiz_id: quiz.id,
        email: cleanEmail,
        name: cleanName,
        college: cleanCollege
      });
    }

    const baseUrl = getQuizPlatformBaseUrl();
    const qSlug = quiz.custom_slug || (quiz.title ? quiz.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : quiz.join_code);
    const directUrl = quiz.mode === 'SCHEDULED' ? `${baseUrl}/q/${qSlug}` : `${baseUrl}/join/${quiz.join_code}`;

    // 4. Send Confirmation Email asynchronously
    try {
      sendCustomBroadcastEmail({
        to: cleanEmail,
        recipientName: cleanName,
        subject: `Registration Confirmed: ${quiz.title} (${quiz.event_name || 'MSC Event'})`,
        heading: `Event Registration Confirmed`,
        messageHtml: `
          <p>Hello <strong>${cleanName}</strong>,</p>
          <p>You have successfully registered for the technical challenge <strong>${quiz.title}</strong> under <strong>${quiz.event_name || 'Microsoft Student Club PRPCEM'}</strong>.</p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0;">
            <p style="margin: 4px 0; color: #334155;"><strong>🎓 Participant:</strong> ${cleanName} (${cleanCollege})</p>
            <p style="margin: 4px 0; color: #334155;"><strong>🔑 Join Code:</strong> <code style="color:#2563eb;font-size:15px;font-weight:800;">${quiz.join_code || 'LIVE'}</code></p>
          </div>
          <p>Please keep this link handy to access your assessment when the session goes live:</p>
        `,
        ctaText: 'Access Quiz Assessment',
        ctaUrl: directUrl
      }).catch(mailErr => console.warn('Registration confirmation email warning:', mailErr.message));
    } catch (e) {
      console.warn('Email dispatch warning:', e.message);
    }

    return res.json({
      success: true,
      message: `Successfully registered for "${quiz.title}"!`,
      event: {
        id: quiz.id,
        title: quiz.title,
        event_name: quiz.event_name || 'MSC Event',
        join_code: quiz.join_code,
        direct_url: directUrl
      },
      participant: {
        id: user.id,
        name: cleanName,
        email: cleanEmail,
        college: cleanCollege
      }
    });
  } catch (err) {
    console.error('Error during event registration:', err);
    res.status(500).json({ error: err.message || 'Failed to complete event registration.' });
  }
});

module.exports = router;
