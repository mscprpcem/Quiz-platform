const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { Event, Quiz, Question, Participant, QuizAttempt, ScheduledOccurrence, User } = require('../models');
const authMiddleware = require('../middleware/auth');
const { sendCustomBroadcastEmail } = require('../services/emailService');
const { Op } = require('sequelize');

// Load static/old events from events.json
let staticEvents = [];
try {
  const jsonPath = path.join(__dirname, '../data/events.json');
  if (fs.existsSync(jsonPath)) {
    staticEvents = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  }
} catch (e) {
  console.warn('Could not read static events.json:', e.message);
}

// Public base URL for Quiz platform links
const getQuizPlatformBaseUrl = () => {
  return (process.env.PUBLIC_QUIZ_URL || process.env.FRONTEND_URL || 'https://quiz.mscprpcem.tech').replace(/\/+$/, '');
};

const POSTER_PRESETS = [
  { match: 'vision', url: 'https://mscprpcem.blob.core.windows.net/events/VisionX.png' },
  { match: 'spark', url: 'https://mscprpcem.blob.core.windows.net/events/clean_529287766.png' },
  { match: 'dotnet', url: 'https://mscprpcem.blob.core.windows.net/events/12.png' },
  { match: '.net', url: 'https://mscprpcem.blob.core.windows.net/events/12.png' },
  { match: 'gitlit', url: 'https://mscprpcem.blob.core.windows.net/events/gitlit.jpg' },
  { match: 'buildathon', url: 'https://mscprpcem.blob.core.windows.net/events/js_ai.png' },
  { match: 'javascript', url: 'https://mscprpcem.blob.core.windows.net/events/js_ai.png' },
  { match: 'js', url: 'https://mscprpcem.blob.core.windows.net/events/js_ai.png' },
  { match: 'ai', url: 'https://mscprpcem.blob.core.windows.net/events/aiskillfest.png' },
  { match: 'skill', url: 'https://mscprpcem.blob.core.windows.net/events/aiskillfest.png' }
];

function resolveEventPoster(posterUrl, eventName) {
  if (posterUrl && posterUrl.startsWith('http') && !posterUrl.includes('spark-2026.png')) {
    return posterUrl;
  }
  const cleanName = (eventName || '').toLowerCase();
  for (const preset of POSTER_PRESETS) {
    if (cleanName.includes(preset.match)) {
      return preset.url;
    }
  }
  return 'https://mscprpcem.blob.core.windows.net/events/clean_529287766.png';
}

// ----------------------------------------------------
// GET /api/events (Admin / Authenticated Route)
// Returns ALL events (New DB Events + Old Static Events)
// ----------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const baseUrl = getQuizPlatformBaseUrl();
    
    // 1. Fetch DB Events
    const dbEvents = await Event.findAll({
      order: [['createdAt', 'DESC']]
    });

    const dbEventNames = new Set(dbEvents.map(e => (e.name || '').toLowerCase().trim()));
    const dbEventIds = new Set(dbEvents.map(e => e.id));

    const formattedEvents = [];

    // Format DB events
    for (const ev of dbEvents) {
      const linkedQuizzes = await Quiz.findAll({
        where: {
          [Op.or]: [
            { event_id: ev.id },
            { event_name: ev.name }
          ],
          status: { [Op.ne]: 'cancelled' }
        },
        attributes: ['id', 'title', 'mode', 'join_code', 'status', 'custom_slug']
      });

      formattedEvents.push({
        id: ev.id,
        name: ev.name,
        slug: ev.slug || ev.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: ev.description || `Official challenges and sessions for ${ev.name}.`,
        poster_url: resolveEventPoster(ev.poster_url, ev.name),
        category: ev.category || 'Innovation Challenge',
        mode: ev.mode || 'Hybrid',
        venue: ev.venue || 'PRPCEM Amravati',
        start_date: ev.start_date,
        end_date: ev.end_date,
        rewards: ev.rewards || 'Certificates & Swags',
        status: ev.status || 'upcoming',
        source: 'database',
        quizzes: linkedQuizzes.map(q => ({
          id: q.id,
          title: q.title,
          mode: q.mode,
          join_code: q.join_code,
          status: q.status,
          direct_url: q.mode === 'SCHEDULED' ? `${baseUrl}/q/${q.custom_slug || q.id}` : `${baseUrl}/join/${q.join_code}`
        })),
        total_quizzes: linkedQuizzes.length
      });
    }

    // 2. Format Old Events from JSON (if not already in DB)
    for (const se of staticEvents) {
      const seTitle = se.title || se.name;
      const seKey = seTitle.toLowerCase().trim();

      if (!dbEventNames.has(seKey) && !dbEventIds.has(se.id)) {
        // Check if any quiz is linked to this static event name or id
        const linkedQuizzes = await Quiz.findAll({
          where: {
            [Op.or]: [
              { event_name: { [Op.iLike || Op.like]: `%${seTitle}%` } },
              { event_id: se.id }
            ],
            status: { [Op.ne]: 'cancelled' }
          },
          attributes: ['id', 'title', 'mode', 'join_code', 'status', 'custom_slug']
        });

        formattedEvents.push({
          id: se.id,
          name: seTitle,
          slug: se.id,
          description: se.description || `Official technical sessions for ${seTitle}.`,
          poster_url: resolveEventPoster(se.poster, seTitle),
          category: se.category || (se.mode === 'Online' ? 'Virtual Challenge' : 'Flagship Event'),
          mode: se.mode || 'Offline',
          venue: se.venue || 'PRPCEM Campus',
          start_date: se.startDate ? new Date(se.startDate) : null,
          end_date: null,
          rewards: se.rewards || 'Certificates & Swags',
          status: se.status || 'past',
          source: 'json',
          quizzes: linkedQuizzes.map(q => ({
            id: q.id,
            title: q.title,
            mode: q.mode,
            join_code: q.join_code,
            status: q.status,
            direct_url: q.mode === 'SCHEDULED' ? `${baseUrl}/q/${q.custom_slug || q.id}` : `${baseUrl}/join/${q.join_code}`
          })),
          total_quizzes: linkedQuizzes.length
        });
      }
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
    const finalPoster = resolveEventPoster(poster_url, cleanName);

    const newEvent = await Event.create({
      name: cleanName,
      slug,
      description: description ? description.trim() : `Official technical event and challenges for ${cleanName}.`,
      poster_url: finalPoster,
      category: category || 'Innovation Challenge',
      mode: mode || 'Hybrid',
      venue: venue || 'PRPCEM Campus & Virtual',
      start_date: start_date ? new Date(start_date) : new Date(),
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
    let event = await Event.findByPk(id);
    
    // If updating a static event that was in JSON, create or migrate it into DB
    if (!event) {
      const staticMatch = staticEvents.find(s => s.id === id);
      if (staticMatch) {
        event = await Event.create({
          id,
          name: staticMatch.title,
          slug: staticMatch.id,
          description: staticMatch.description,
          poster_url: resolveEventPoster(staticMatch.poster, staticMatch.title),
          category: staticMatch.category || 'Technical Workshop',
          mode: staticMatch.mode || 'Offline',
          venue: staticMatch.venue || 'PRPCEM Campus',
          start_date: staticMatch.startDate ? new Date(staticMatch.startDate) : new Date(),
          rewards: staticMatch.rewards || 'Certificates & Swags',
          status: staticMatch.status || 'past'
        });
      } else {
        return res.status(404).json({ error: 'Event not found.' });
      }
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
    if (poster_url !== undefined) {
      event.poster_url = resolveEventPoster(poster_url, event.name);
    }
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
    if (event) {
      await event.destroy();
    }
    res.json({ success: true, message: 'Event deleted successfully.' });
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ error: err.message || 'Failed to delete event.' });
  }
});

// ----------------------------------------------------
// GET /api/events/public
// Public events feed for mscprpcem-website
// Combines New DB Events + Old Static Events
// ----------------------------------------------------
router.get('/public', async (req, res) => {
  try {
    const now = new Date();
    const baseUrl = getQuizPlatformBaseUrl();

    // 1. Fetch DB Events
    const dbEvents = await Event.findAll({
      where: { status: { [Op.ne]: 'archived' } },
      order: [['createdAt', 'DESC']]
    });

    const dbEventNames = new Set(dbEvents.map(e => (e.name || '').toLowerCase().trim()));
    const dbEventIds = new Set(dbEvents.map(e => e.id));

    const eventsList = [];

    // Format DB events
    for (const dev of dbEvents) {
      const resolvedPoster = resolveEventPoster(dev.poster_url, dev.name);

      const linkedQuizzes = await Quiz.findAll({
        where: {
          [Op.or]: [
            { event_id: dev.id },
            { event_name: dev.name }
          ],
          status: { [Op.ne]: 'cancelled' }
        },
        include: [
          {
            model: ScheduledOccurrence,
            as: 'occurrences',
            required: false,
            attributes: ['id', 'start_time', 'end_time', 'status']
          }
        ]
      });

      const quizTracks = [];
      let totalRegCount = 0;
      let isLiveNow = false;

      for (const q of linkedQuizzes) {
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
        totalRegCount += regCount;

        const sDate = startTime ? new Date(startTime) : null;
        if (sDate && sDate <= now && (!endTime || new Date(endTime) >= now)) {
          isLiveNow = true;
        }

        quizTracks.push({
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
          status: (sDate && sDate <= now && (!endTime || new Date(endTime) >= now)) ? 'LIVE' : 'UPCOMING'
        });
      }

      eventsList.push({
        id: dev.id,
        event_name: dev.name,
        title: dev.name,
        description: dev.description || `Official challenges and technical sessions for ${dev.name}.`,
        poster: resolvedPoster,
        category: dev.category || 'Innovation Challenge',
        mode: dev.mode || 'Hybrid',
        venue: dev.venue || 'PRPCEM Campus & Virtual',
        rewards: dev.rewards || 'Certificates & Swags',
        start_date: dev.start_date ? new Date(dev.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Coming Soon",
        start_time: dev.start_date || dev.createdAt,
        end_time: dev.end_date,
        is_live: isLiveNow,
        is_upcoming: dev.status === 'upcoming',
        status: dev.status || 'upcoming',
        quizzes: quizTracks,
        total_quizzes_count: quizTracks.length,
        total_registration_count: totalRegCount,
        direct_quiz_url: quizTracks.length > 0 ? quizTracks[0].direct_quiz_url : null,
        register: `/register/${dev.slug || dev.id}`
      });
    }

    // 2. Format Old Events from JSON (if not in DB)
    for (const se of staticEvents) {
      const seTitle = se.title || se.name;
      const seKey = seTitle.toLowerCase().trim();

      if (!dbEventNames.has(seKey) && !dbEventIds.has(se.id)) {
        eventsList.push({
          id: se.id,
          event_name: seTitle,
          title: seTitle,
          description: se.description,
          poster: resolveEventPoster(se.poster, seTitle),
          category: se.category || 'Flagship Event',
          mode: se.mode || 'Offline',
          venue: se.venue || 'PRPCEM Campus',
          rewards: se.rewards || 'Certificates & Swags',
          start_date: se.date || (se.startDate ? new Date(se.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Past Event"),
          start_time: se.startDate ? new Date(se.startDate) : new Date(2025, 0, 1),
          end_time: null,
          is_live: false,
          is_upcoming: se.status === 'upcoming',
          status: se.status || 'past',
          quizzes: [],
          total_quizzes_count: 0,
          total_registration_count: 0,
          direct_quiz_url: null,
          register: se.register || `/register/${se.id}`
        });
      }
    }

    res.json({
      success: true,
      count: eventsList.length,
      events: eventsList
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

    // 1. Locate matching event or quizzes
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
            { event_id: eventId || null }
          ]
        }
      });
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

    // 3. Register as Participant in matching quiz tracks if any exist
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

    const primaryEventName = (matchingQuizzes[0]?.event_name) || eventName || 'MSC Event';
    const primaryDirectUrl = registeredTracks[0]?.direct_url || `${baseUrl}/login`;

    // 4. Send Confirmation Email
    try {
      const tracksListHtml = registeredTracks.length > 0
        ? registeredTracks.map(t => `
          <li style="margin-bottom: 8px;">
            <strong>${t.title}</strong> — Join Code: <code style="color:#2563eb;font-weight:bold;">${t.join_code}</code><br/>
            <a href="${t.direct_url}" style="color:#2563eb;font-size:12px;">Launch Assessment ↗</a>
          </li>
        `).join('')
        : `<p style="font-size: 13px; color: #475569;">You are registered for <strong>${primaryEventName}</strong>. Any live assessments or challenges will be sent directly to this email.</p>`;

      sendCustomBroadcastEmail({
        to: cleanEmail,
        recipientName: cleanName,
        subject: `Registration Confirmed: ${primaryEventName}`,
        heading: `Event Registration Confirmed`,
        messageHtml: `
          <p>Hello <strong>${cleanName}</strong>,</p>
          <p>You have successfully registered for <strong>${primaryEventName}</strong> organized by the Microsoft Student Club PRPCEM.</p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0;">
            ${tracksListHtml}
          </div>
          <p>Please keep this email safe. We look forward to seeing you at the event!</p>
        `,
        ctaText: 'Access Student Portal',
        ctaUrl: primaryDirectUrl
      }).catch(mailErr => console.warn('Registration confirmation email warning:', mailErr.message));
    } catch (e) {
      console.warn('Email dispatch warning:', e.message);
    }

    return res.json({
      success: true,
      message: `Successfully registered for "${primaryEventName}"!`,
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
