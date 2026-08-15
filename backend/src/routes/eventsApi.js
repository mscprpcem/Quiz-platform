const express = require('express');
const router = express.Router();
const { Quiz, Question, Participant, QuizAttempt, ScheduledOccurrence, User } = require('../models');
const { sendCustomBroadcastEmail } = require('../services/emailService');
const { Op } = require('sequelize');

// Public base URL for Quiz platform links
const getQuizPlatformBaseUrl = () => {
  return (process.env.PUBLIC_QUIZ_URL || process.env.FRONTEND_URL || 'https://quiz.mscprpcem.tech').replace(/\/+$/, '');
};

/**
 * ----------------------------------------------------
 * GET /api/events/public (or /api/events)
 * Aggregates quizzes into unified Events with 1-to-many Quiz Tracks
 * ----------------------------------------------------
 */
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

    // Group quizzes by event_name
    const eventGroups = new Map();

    for (const q of quizzes) {
      if (!q) continue;
      if (['cancelled', 'archived'].includes((q.status || '').toLowerCase())) continue;

      const eventKey = (q.event_name || q.title || 'MSC Tech Event').trim();
      const slug = q.custom_slug || (q.title ? q.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : q.join_code);
      const isScheduled = q.mode === 'SCHEDULED' || (q.occurrences && q.occurrences.length > 0);
      const directUrl = isScheduled ? `${baseUrl}/q/${slug}` : `${baseUrl}/join/${q.join_code}`;

      let startTime = q.scheduled_start || q.createdAt;
      let endTime = q.scheduled_end;

      if (q.occurrences && q.occurrences.length > 0) {
        const validOcc = q.occurrences.filter(occ => !occ.end_time || new Date(occ.end_time) >= now);
        if (validOcc.length > 0) {
          startTime = validOcc[0].start_time;
          endTime = validOcc[0].end_time;
        } else {
          continue; // past occurrences
        }
      } else if (endTime && new Date(endTime) < now) {
        continue; // past standard quiz
      }

      const [questionCount, liveCount, attemptCount] = await Promise.all([
        Question.count({ where: { quiz_id: q.id } }).catch(() => 0),
        Participant.count({ where: { quiz_id: q.id } }).catch(() => 0),
        QuizAttempt.count({ where: { quiz_id: q.id } }).catch(() => 0)
      ]);

      const regCount = liveCount + attemptCount;
      const sDate = startTime ? new Date(startTime) : null;
      const isLiveNow = sDate && sDate <= now && (!endTime || new Date(endTime) >= now);
      const isUpcoming = sDate && sDate > now;

      const quizTrack = {
        quiz_id: q.id,
        title: q.title,
        slug,
        mode: q.mode,
        join_code: q.join_code,
        question_count: questionCount,
        registration_count: regCount,
        direct_quiz_url: directUrl,
        start_time: startTime,
        end_time: endTime,
        status: isLiveNow ? 'LIVE' : isUpcoming ? 'UPCOMING' : 'OPEN'
      };

      if (!eventGroups.has(eventKey)) {
        eventGroups.set(eventKey, {
          id: `event-${eventKey.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          event_name: eventKey,
          title: eventKey,
          description: q.description || `Official challenge and assessment tracks for ${eventKey}.`,
          poster: "https://mscprpcem.blob.core.windows.net/events/clean_529287766.png",
          category: q.category || q.subject || 'Technical Event',
          mode: isScheduled ? 'Online Assessment' : 'Live Interactive Quiz',
          rewards: 'Verified Certificate & Badges',
          start_time: startTime,
          end_time: endTime,
          is_live: isLiveNow,
          is_upcoming: isUpcoming,
          status: isLiveNow ? 'upcoming' : isUpcoming ? 'upcoming' : 'upcoming',
          quizzes: [quizTrack],
          total_quizzes_count: 1,
          total_registration_count: regCount,
          direct_quiz_url: directUrl,
          register: `/register/event-${eventKey.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
        });
      } else {
        const group = eventGroups.get(eventKey);
        group.quizzes.push(quizTrack);
        group.total_quizzes_count += 1;
        group.total_registration_count += regCount;
        if (isLiveNow) group.is_live = true;
        if (isUpcoming) group.is_upcoming = true;
      }
    }

    const events = Array.from(eventGroups.values());

    res.json({
      success: true,
      count: events.length,
      events
    });
  } catch (err) {
    console.error('Error fetching public events:', err);
    res.status(500).json({ error: 'Failed to fetch public events.' });
  }
});

/**
 * ----------------------------------------------------
 * POST /api/events/register
 * Enrolls participant into an Event and ALL its Quiz Tracks
 * ----------------------------------------------------
 */
router.post('/register', async (req, res) => {
  try {
    const {
      eventId,
      eventName,
      quizId,
      slug,
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
      return res.status(400).json({ error: 'Valid Email address is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();
    const cleanCollege = (college || 'PRPCEM Amravati').trim();

    // 1. Locate all Quizzes matching this Event or specific Quiz
    let matchingQuizzes = [];

    if (quizId) {
      const q = await Quiz.findByPk(quizId);
      if (q) matchingQuizzes.push(q);
    }

    if (matchingQuizzes.length === 0 && slug) {
      const q = await Quiz.findOne({
        where: {
          [Op.or]: [
            { custom_slug: slug },
            { id: slug }
          ]
        }
      });
      if (q) matchingQuizzes.push(q);
    }

    // If eventName or eventId provided (e.g. event-spark-2026 or "Spark 2026")
    if (matchingQuizzes.length === 0 && (eventName || eventId)) {
      const targetName = (eventName || eventId).replace(/^event-/, '').replace(/-/g, ' ');
      matchingQuizzes = await Quiz.findAll({
        where: {
          [Op.or]: [
            { event_name: { [Op.iLike || Op.like]: `%${targetName}%` } },
            { title: { [Op.iLike || Op.like]: `%${targetName}%` } }
          ]
        }
      });
    }

    // If still no direct match, fetch all active quizzes as fallback
    if (matchingQuizzes.length === 0) {
      matchingQuizzes = await Quiz.findAll({
        where: { status: { [Op.ne]: 'cancelled' } },
        limit: 3
      });
    }

    if (matchingQuizzes.length === 0) {
      return res.status(404).json({ error: 'No active event or quiz found for registration.' });
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
      if (!user.college && cleanCollege) {
        await user.update({ college: cleanCollege }).catch(() => {});
      }
    }

    // 3. Register as Participant in ALL matching quiz tracks
    const baseUrl = getQuizPlatformBaseUrl();
    const registeredTracks = [];

    for (const q of matchingQuizzes) {
      const existing = await Participant.findOne({
        where: { quiz_id: q.id, email: cleanEmail }
      });
      if (!existing) {
        await Participant.create({
          quiz_id: q.id,
          email: cleanEmail,
          name: cleanName,
          college: cleanCollege
        });
      }

      const qSlug = q.custom_slug || (q.title ? q.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : q.join_code);
      const directUrl = q.mode === 'SCHEDULED' ? `${baseUrl}/q/${qSlug}` : `${baseUrl}/join/${q.join_code}`;

      registeredTracks.push({
        quiz_id: q.id,
        title: q.title,
        join_code: q.join_code,
        direct_url: directUrl
      });
    }

    const primaryEventName = matchingQuizzes[0].event_name || matchingQuizzes[0].title;
    const primaryDirectUrl = registeredTracks[0].direct_url;

    // 4. Send Unified Confirmation Email
    try {
      const tracksListHtml = registeredTracks.map(t => `
        <li style="margin-bottom: 8px;">
          <strong>${t.title}</strong> — Join Code: <code style="color:#2563eb;font-weight:bold;">${t.join_code}</code><br/>
          <a href="${t.direct_url}" style="color:#2563eb;font-size:12px;">Launch Assessment ↗</a>
        </li>
      `).join('');

      sendCustomBroadcastEmail({
        to: cleanEmail,
        recipientName: cleanName,
        subject: `Registration Confirmed: ${primaryEventName}`,
        heading: `Event Registration Confirmed`,
        messageHtml: `
          <p>Hello <strong>${cleanName}</strong>,</p>
          <p>You have successfully registered for <strong>${primaryEventName}</strong> organized by the Microsoft Student Club PRPCEM.</p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; color: #0f172a; font-weight: bold;">Included Challenge Tracks (${registeredTracks.length}):</p>
            <ul style="padding-left: 20px; margin: 0; font-size: 13px; color: #334155;">
              ${tracksListHtml}
            </ul>
          </div>
          <p>Please keep this email safe. You can access your assessments directly on the scheduled date.</p>
        `,
        ctaText: 'Access Event Portal',
        ctaUrl: primaryDirectUrl
      }).catch(mailErr => console.warn('Registration confirmation email warning:', mailErr.message));
    } catch (e) {
      console.warn('Email dispatch warning:', e.message);
    }

    return res.json({
      success: true,
      message: `Successfully registered for "${primaryEventName}" with ${registeredTracks.length} quiz track(s)!`,
      event: {
        event_name: primaryEventName,
        direct_url: primaryDirectUrl,
        tracks: registeredTracks
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
