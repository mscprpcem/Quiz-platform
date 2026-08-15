const express = require('express');
const router = express.Router();
const { Event, Quiz, Question, Participant, QuizAttempt, ScheduledOccurrence, User } = require('../models');
const authMiddleware = require('../middleware/auth');
const { sendCustomBroadcastEmail } = require('../services/emailService');
const { Op } = require('sequelize');

// Public base URL for Quiz platform links
const getQuizPlatformBaseUrl = () => {
  return (process.env.PUBLIC_QUIZ_URL || process.env.FRONTEND_URL || 'https://quiz.mscprpcem.tech').replace(/\/+$/, '');
};

// ----------------------------------------------------
// GET /api/events (Admin / Authenticated Route or fallback)
// Returns all managed events with associated quiz tracks
// ----------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const baseUrl = getQuizPlatformBaseUrl();
    
    // 1. Fetch from Event table
    let dbEvents = [];
    try {
      dbEvents = await Event.findAll({
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: Quiz,
            as: 'quizzes',
            attributes: ['id', 'title', 'mode', 'join_code', 'status', 'custom_slug'],
            required: false
          }
        ]
      });
    } catch (e) {
      console.warn('Fallback finding Events:', e.message);
    }

    // 2. Also fetch distinct event_name from Quizzes not yet mapped to an Event
    const quizzes = await Quiz.findAll({
      attributes: ['id', 'title', 'event_name', 'mode', 'join_code', 'status', 'custom_slug', 'event_id'],
      order: [['createdAt', 'DESC']]
    });

    const eventNamesInDb = new Set(dbEvents.map(e => e.name.toLowerCase().trim()));
    const unmappedQuizzesMap = new Map();

    for (const q of quizzes) {
      if (q.event_name && !eventNamesInDb.has(q.event_name.toLowerCase().trim())) {
        const key = q.event_name.trim();
        if (!unmappedQuizzesMap.has(key)) {
          unmappedQuizzesMap.set(key, []);
        }
        unmappedQuizzesMap.get(key).push(q);
      }
    }

    // Combine both
    const formattedEvents = dbEvents.map(ev => ({
      id: ev.id,
      name: ev.name,
      slug: ev.slug || ev.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: ev.description,
      poster_url: ev.poster_url || 'https://mscprpcem.blob.core.windows.net/events/clean_529287766.png',
      category: ev.category || 'Technical Workshop',
      mode: ev.mode || 'Offline',
      venue: ev.venue || 'PRPCEM Amravati',
      start_date: ev.start_date,
      end_date: ev.end_date,
      rewards: ev.rewards || 'Certificates & Swags',
      status: ev.status || 'upcoming',
      quizzes: (ev.quizzes || []).map(q => ({
        id: q.id,
        title: q.title,
        mode: q.mode,
        join_code: q.join_code,
        status: q.status,
        direct_url: q.mode === 'SCHEDULED' ? `${baseUrl}/q/${q.custom_slug || q.id}` : `${baseUrl}/join/${q.join_code}`
      })),
      total_quizzes: (ev.quizzes || []).length
    }));

    // Add unmapped quiz event groups
    for (const [name, qList] of unmappedQuizzesMap.entries()) {
      formattedEvents.push({
        id: `auto-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: `Official technical event tracks for ${name}.`,
        poster_url: 'https://mscprpcem.blob.core.windows.net/events/clean_529287766.png',
        category: 'Technical Challenge',
        mode: 'Online Assessment',
        venue: 'PRPCEM Campus',
        rewards: 'Certificates & Badges',
        status: 'upcoming',
        quizzes: qList.map(q => ({
          id: q.id,
          title: q.title,
          mode: q.mode,
          join_code: q.join_code,
          status: q.status,
          direct_url: q.mode === 'SCHEDULED' ? `${baseUrl}/q/${q.custom_slug || q.id}` : `${baseUrl}/join/${q.join_code}`
        })),
        total_quizzes: qList.length
      });
    }

    res.json({
      success: true,
      count: formattedEvents.length,
      events: formattedEvents
    });
  } catch (err) {
    console.error('Error fetching admin events:', err);
    res.status(500).json({ error: 'Failed to fetch events.' });
  }
});

// ----------------------------------------------------
// POST /api/events (Create a New Event in Admin Panel)
// ----------------------------------------------------
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      name,
      description,
      poster_url,
      category,
      mode,
      venue,
      start_date,
      end_date,
      rewards,
      status
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Event Name is required.' });
    }

    const cleanName = name.trim();
    const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const newEvent = await Event.create({
      name: cleanName,
      slug,
      description: description ? description.trim() : null,
      poster_url: poster_url || 'https://mscprpcem.blob.core.windows.net/events/clean_529287766.png',
      category: category || 'Technical Workshop',
      mode: mode || 'Offline',
      venue: venue || 'PRPCEM Amravati',
      start_date: start_date ? new Date(start_date) : null,
      end_date: end_date ? new Date(end_date) : null,
      rewards: rewards || 'Certificates & Swags',
      status: status || 'upcoming'
    });

    res.json({
      success: true,
      message: `Event "${cleanName}" created successfully!`,
      event: newEvent
    });
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({ error: err.message || 'Failed to create event.' });
  }
});

// ----------------------------------------------------
// PUT /api/events/:id (Update Event)
// ----------------------------------------------------
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const {
      name,
      description,
      poster_url,
      category,
      mode,
      venue,
      start_date,
      end_date,
      rewards,
      status
    } = req.body;

    if (name) {
      event.name = name.trim();
      event.slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (description !== undefined) event.description = description;
    if (poster_url !== undefined) event.poster_url = poster_url;
    if (category !== undefined) event.category = category;
    if (mode !== undefined) event.mode = mode;
    if (venue !== undefined) event.venue = venue;
    if (start_date !== undefined) event.start_date = start_date ? new Date(start_date) : null;
    if (end_date !== undefined) event.end_date = end_date ? new Date(end_date) : null;
    if (rewards !== undefined) event.rewards = rewards;
    if (status !== undefined) event.status = status;

    await event.save();

    res.json({
      success: true,
      message: 'Event updated successfully!',
      event
    });
  } catch (err) {
    console.error('Error updating event:', err);
    res.status(500).json({ error: err.message || 'Failed to update event.' });
  }
});

// ----------------------------------------------------
// DELETE /api/events/:id (Delete Event)
// ----------------------------------------------------
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    await event.destroy();
    res.json({ success: true, message: 'Event deleted successfully.' });
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ error: err.message || 'Failed to delete event.' });
  }
});

// ----------------------------------------------------
// GET /api/events/public
// Public events feed for mscprpcem-website
// ----------------------------------------------------
router.get('/public', async (req, res) => {
  try {
    const now = new Date();
    const baseUrl = getQuizPlatformBaseUrl();

    // 1. Fetch managed events from Event table
    let dbEvents = [];
    try {
      dbEvents = await Event.findAll({
        where: { status: { [Op.ne]: 'archived' } },
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: Quiz,
            as: 'quizzes',
            required: false,
            include: [
              {
                model: ScheduledOccurrence,
                as: 'occurrences',
                required: false,
                attributes: ['id', 'start_time', 'end_time', 'status']
              }
            ]
          }
        ]
      });
    } catch (e) {
      console.warn('Fallback finding DB events:', e.message);
    }

    // 2. Fetch all quizzes
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

    const eventsMap = new Map();

    // Add DB events first
    for (const dev of dbEvents) {
      const devKey = dev.name.toLowerCase().trim();
      eventsMap.set(devKey, {
        id: dev.id,
        event_name: dev.name,
        title: dev.name,
        description: dev.description || `Official challenges and technical sessions for ${dev.name}.`,
        poster: dev.poster_url || "https://mscprpcem.blob.core.windows.net/events/clean_529287766.png",
        category: dev.category || 'Technical Workshop',
        mode: dev.mode || 'Offline',
        rewards: dev.rewards || 'Verified Certificate & Badges',
        start_time: dev.start_date || dev.createdAt,
        end_time: dev.end_date,
        is_live: false,
        is_upcoming: true,
        status: dev.status || 'upcoming',
        quizzes: [],
        total_quizzes_count: 0,
        total_registration_count: 0,
        direct_quiz_url: null,
        register: `/register/${dev.slug || dev.id}`
      });
    }

    // Process all quizzes and attach to event groups
    for (const q of quizzes) {
      if (!q) continue;
      if (['cancelled', 'archived'].includes((q.status || '').toLowerCase())) continue;

      const eventKey = (q.event_name || q.title || 'MSC Tech Event').toLowerCase().trim();
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
        }
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

      if (!eventsMap.has(eventKey)) {
        const originalName = q.event_name || q.title || 'MSC Tech Event';
        eventsMap.set(eventKey, {
          id: `event-${eventKey.replace(/[^a-z0-9]+/g, '-')}`,
          event_name: originalName,
          title: originalName,
          description: q.description || `Official technical challenges for ${originalName}.`,
          poster: "https://mscprpcem.blob.core.windows.net/events/clean_529287766.png",
          category: q.category || q.subject || 'Technical Event',
          mode: isScheduled ? 'Online Assessment' : 'Live Interactive Quiz',
          rewards: 'Verified Certificate & Badges',
          start_time: startTime,
          end_time: endTime,
          is_live: isLiveNow,
          is_upcoming: isUpcoming,
          status: isLiveNow ? 'upcoming' : 'upcoming',
          quizzes: [quizTrack],
          total_quizzes_count: 1,
          total_registration_count: regCount,
          direct_quiz_url: directUrl,
          register: `/register/event-${eventKey.replace(/[^a-z0-9]+/g, '-')}`
        });
      } else {
        const group = eventsMap.get(eventKey);
        group.quizzes.push(quizTrack);
        group.total_quizzes_count += 1;
        group.total_registration_count += regCount;
        if (isLiveNow) group.is_live = true;
        if (!group.direct_quiz_url) group.direct_quiz_url = directUrl;
      }
    }

    const events = Array.from(eventsMap.values());

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

// ----------------------------------------------------
// POST /api/events/register
// ----------------------------------------------------
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

    // 4. Send Confirmation Email
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
