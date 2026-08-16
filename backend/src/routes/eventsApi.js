const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const multer = require('multer');
const { Event, Quiz, Question, Participant, QuizAttempt, ScheduledOccurrence, User, EventRegistration } = require('../models');
const { ensureEventsTableSchema } = require('../services/schemaMigration');
const { sendCustomBroadcastEmail } = require('../services/emailService');
const { uploadImageToAzureBlob } = require('../services/azureBlobService');
const { Op } = require('sequelize');
const authMiddleware = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'msc_quiz_secret_key_2026';

// Strict admin auth handler
const adminAuth = authMiddleware;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype && (file.mimetype.startsWith('image/') || file.mimetype === 'application/octet-stream')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (PNG, JPG, JPEG, WEBP, GIF, SVG) are allowed.'), false);
    }
  }
});

// ----------------------------------------------------
// POST /api/events/upload-poster (Upload Event Poster to Azure Blob Storage)
// ----------------------------------------------------
router.post('/upload-poster', adminAuth, upload.single('poster'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please select an image file to upload.' });
    }

    const uploadResult = await uploadImageToAzureBlob(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      'event-poster'
    );

    return res.json({
      success: true,
      message: 'Poster uploaded successfully!',
      url: uploadResult.url,
      blobName: uploadResult.blobName,
      storageType: uploadResult.storageType
    });
  } catch (err) {
    console.error('Error uploading poster image:', err);
    return res.status(500).json({ error: 'Failed to upload image: ' + err.message });
  }
});

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

/**
 * Normalizes an event's date into a numerical millisecond timestamp for chronological sorting.
 * Checks start_date, startDate, start_time, registration_start_date, date, and createdAt.
 */
function getEventSortTimestamp(ev) {
  if (!ev) return 0;
  const candidates = [
    ev.start_date,
    ev.startDate,
    ev.start_time,
    ev.registration_start_date,
    ev.date,
    ev.createdAt
  ];

  for (const candidate of candidates) {
    if (candidate) {
      const parsed = new Date(candidate).getTime();
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
  }
  return 0;
}

/**
 * Sorts an array of events descending so latest date appears first.
 */
function sortEventsLatestFirst(events) {
  return events.sort((a, b) => {
    const timeA = getEventSortTimestamp(a);
    const timeB = getEventSortTimestamp(b);
    if (timeB !== timeA) {
      return timeB - timeA; // Descending: latest date first
    }
    const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (createdB !== createdA) {
      return createdB - createdA;
    }
    return (a.name || a.title || '').localeCompare(b.name || b.title || '');
  });
}

// ----------------------------------------------------
// GET /api/events (Admin / Authenticated Route)
// Returns ALL events (New DB Events + Old Static Events)
// ----------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const baseUrl = getQuizPlatformBaseUrl();
    const now = new Date();
    
    // 1. Fetch all DB events, all quizzes, and registrations
    const [dbEvents, allQuizzes, allRegistrations] = await Promise.all([
      Event.findAll({ order: [['start_date', 'DESC'], ['createdAt', 'DESC']] }).catch(() => []),
      Quiz.findAll({ order: [['createdAt', 'DESC']] }).catch(() => []),
      EventRegistration.findAll({ order: [['createdAt', 'DESC']] }).catch(() => [])
    ]);

    const dbEventNames = new Set(dbEvents.map(e => (e.name || '').toLowerCase().trim()));
    const dbEventIds = new Set(dbEvents.map(e => e.id));

    const formattedEvents = [];

    // Format DB events
    for (const ev of dbEvents) {
      const evNameLower = (ev.name || '').toLowerCase().trim();
      const linkedQuizzes = allQuizzes.filter(q =>
        q.event_id === ev.id || (q.event_name && q.event_name.toLowerCase().trim() === evNameLower)
      );

      const eventRegs = allRegistrations.filter(r =>
        r.event_id === ev.id || r.event_id === ev.slug || (r.event_name && r.event_name.toLowerCase().trim() === evNameLower)
      );

      const regCount = eventRegs.length;
      const maxRegs = ev.max_registrations ? parseInt(ev.max_registrations, 10) : null;
      const isRegDeadlinePassed = ev.registration_end_date ? new Date(ev.registration_end_date) < now : false;
      const isEventDateEnded = ev.end_date 
        ? new Date(ev.end_date) < now 
        : (ev.start_date ? new Date(ev.start_date) < now : false);

      const isRegNotStartedYet = ev.registration_start_date ? new Date(ev.registration_start_date) > now : false;
      const isCapacityFull = maxRegs !== null && maxRegs !== undefined && regCount >= maxRegs;

      const computedStatus = (ev.status === 'completed' || ev.status === 'past' || isEventDateEnded)
        ? 'completed'
        : (ev.status || 'upcoming');

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
        registration_start_date: ev.registration_start_date,
        registration_end_date: ev.registration_end_date,
        max_registrations: maxRegs,
        fee: ev.fee || 'Free',
        is_registration_open: ev.is_registration_open !== false && !isEventDateEnded && !isRegDeadlinePassed,
        rewards: ev.rewards || 'Certificates & Swags',
        status: computedStatus,
        source: 'database',
        registration_count: regCount,
        seats_remaining: maxRegs ? Math.max(0, maxRegs - regCount) : null,
        is_registration_ended: isRegDeadlinePassed || isEventDateEnded,
        is_registration_pending: isRegNotStartedYet,
        is_capacity_full: isCapacityFull,
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
        const linkedQuizzes = allQuizzes.filter(q =>
          q.event_id === se.id || (q.event_name && (q.event_name.toLowerCase().includes(seKey) || seKey.includes(q.event_name.toLowerCase().trim())))
        );

        const eventRegs = allRegistrations.filter(r =>
          r.event_id === se.id || (r.event_name && r.event_name.toLowerCase().trim() === seKey)
        );

        const isStaticEnded = se.endDate 
          ? new Date(se.endDate) < now 
          : (se.startDate ? new Date(se.startDate) < now : (se.status === 'past' || se.status === 'completed'));
        const staticStatus = isStaticEnded ? 'completed' : (se.status || 'upcoming');

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
          end_date: se.endDate ? new Date(se.endDate) : null,
          registration_start_date: null,
          registration_end_date: null,
          max_registrations: null,
          fee: 'Free',
          is_registration_open: !isStaticEnded,
          rewards: se.rewards || 'Certificates & Swags',
          status: staticStatus,
          source: 'json',
          registration_count: eventRegs.length,
          seats_remaining: null,
          is_registration_ended: isStaticEnded,
          is_registration_pending: false,
          is_capacity_full: false,
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

    // Sort all events so the latest date comes first
    sortEventsLatestFirst(formattedEvents);

    res.json({
      success: true,
      count: formattedEvents.length,
      events: formattedEvents
    });
  } catch (err) {
    console.error('Error fetching admin events:', err);
    res.status(500).json({ error: 'Failed to fetch events: ' + err.message });
  }
});

// ----------------------------------------------------
// GET /api/events/details/:idOrSlug (Single Event Details)
// ----------------------------------------------------
router.get('/details/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const baseUrl = getQuizPlatformBaseUrl();
    const now = new Date();

    let event = null;
    if (isValidUUID(idOrSlug)) {
      event = await Event.findByPk(idOrSlug).catch(() => null);
    }
    if (!event) {
      event = await Event.findOne({
        where: {
          [Op.or]: [
            { slug: idOrSlug },
            { slug: idOrSlug.toLowerCase() },
            { name: idOrSlug }
          ]
        }
      }).catch(() => null);
    }

    if (!event) {
      // Check static events fallback
      const staticMatch = staticEvents.find(s => s.id === idOrSlug || (s.title && s.title.toLowerCase() === idOrSlug.toLowerCase()));
      if (staticMatch) {
        return res.json({
          success: true,
          event: {
            id: staticMatch.id,
            name: staticMatch.title,
            slug: staticMatch.id,
            description: staticMatch.description,
            poster_url: resolveEventPoster(staticMatch.poster, staticMatch.title),
            category: staticMatch.category || 'Technical Workshop',
            mode: staticMatch.mode || 'Offline',
            venue: staticMatch.venue || 'PRPCEM Campus',
            start_date: staticMatch.startDate ? new Date(staticMatch.startDate) : null,
            end_date: null,
            registration_start_date: null,
            registration_end_date: null,
            max_registrations: null,
            fee: 'Free',
            is_registration_open: true,
            rewards: staticMatch.rewards || 'Certificates & Swags',
            status: staticMatch.status || 'upcoming',
            registration_count: 0,
            quizzes: []
          }
        });
      }
      return res.status(404).json({ error: `Event "${idOrSlug}" not found.` });
    }

    const [allQuizzes, allRegistrations] = await Promise.all([
      Quiz.findAll({ order: [['createdAt', 'DESC']] }).catch(() => []),
      EventRegistration.findAll({
        where: {
          [Op.or]: [
            { event_id: event.id },
            { event_id: event.slug || '' },
            { event_name: event.name }
          ]
        }
      }).catch(() => [])
    ]);

    const linkedQuizzes = allQuizzes.filter(q =>
      q.event_id === event.id || (q.event_name && q.event_name.toLowerCase().trim() === event.name.toLowerCase().trim())
    );

    const regCount = allRegistrations.length;
    const maxRegs = event.max_registrations ? parseInt(event.max_registrations, 10) : null;
    const isRegDeadlinePassed = event.registration_end_date ? new Date(event.registration_end_date) < now : false;
    const isEventDateEnded = event.end_date 
      ? new Date(event.end_date) < now 
      : (event.start_date ? new Date(event.start_date) < now : false);

    const isRegNotStartedYet = event.registration_start_date ? new Date(event.registration_start_date) > now : false;
    const isCapacityFull = maxRegs !== null && maxRegs !== undefined && regCount >= maxRegs;

    const computedStatus = (event.status === 'completed' || event.status === 'past' || isEventDateEnded)
      ? 'completed'
      : (event.status || 'upcoming');

    res.json({
      success: true,
      event: {
        id: event.id,
        name: event.name,
        slug: event.slug,
        description: event.description,
        poster_url: resolveEventPoster(event.poster_url, event.name),
        category: event.category,
        mode: event.mode,
        venue: event.venue,
        start_date: event.start_date,
        end_date: event.end_date,
        registration_start_date: event.registration_start_date,
        registration_end_date: event.registration_end_date,
        max_registrations: maxRegs,
        fee: event.fee || 'Free',
        is_registration_open: event.is_registration_open !== false && !isEventDateEnded && !isRegDeadlinePassed,
        rewards: event.rewards,
        status: computedStatus,
        registration_count: regCount,
        seats_remaining: maxRegs ? Math.max(0, maxRegs - regCount) : null,
        is_registration_ended: isRegDeadlinePassed || isEventDateEnded,
        is_registration_pending: isRegNotStartedYet,
        is_capacity_full: isCapacityFull,
        quizzes: linkedQuizzes.map(q => ({
          id: q.id,
          title: q.title,
          mode: q.mode,
          join_code: q.join_code,
          status: q.status,
          direct_url: q.mode === 'SCHEDULED' ? `${baseUrl}/q/${q.custom_slug || q.id}` : `${baseUrl}/join/${q.join_code}`
        }))
      }
    });
  } catch (err) {
    console.error('Error fetching single event details:', err);
    res.status(500).json({ error: 'Failed to fetch event details: ' + err.message });
  }
});

// ----------------------------------------------------
// GET /api/events/:id/registrations (Fetch Event Registrants)
// ----------------------------------------------------
router.get('/:id/registrations', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const registrations = await EventRegistration.findAll({
      where: {
        [Op.or]: [
          { event_id: id },
          { event_id: id.toLowerCase() }
        ]
      },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: registrations.length,
      registrations
    });
  } catch (err) {
    console.error('Error fetching event registrations:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch registrations.' });
  }
});

// ----------------------------------------------------
// DELETE /api/events/registrations/:regId (Admin: Delete an Event Registration)
// ----------------------------------------------------
router.delete('/registrations/:regId', adminAuth, async (req, res) => {
  try {
    const { regId } = req.params;
    if (!regId) {
      return res.status(400).json({ error: 'Registration ID is required.' });
    }

    const registration = await EventRegistration.findByPk(regId);
    if (!registration) {
      return res.status(404).json({ error: 'Event registration not found.' });
    }

    await registration.destroy();
    return res.json({
      success: true,
      message: 'Registration deleted successfully.'
    });
  } catch (err) {
    console.error('Error deleting registration:', err);
    return res.status(500).json({ error: err.message || 'Failed to delete registration.' });
  }
});

// ----------------------------------------------------
// POST /api/events (Create a New Event in Admin Panel)
// ----------------------------------------------------
router.post('/', adminAuth, async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      poster_url,
      category,
      mode,
      venue,
      start_date,
      end_date,
      registration_start_date,
      registration_end_date,
      max_registrations,
      fee,
      is_registration_open,
      rewards,
      status
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Event Name is required.' });
    }

    const cleanName = name.trim();
    const cleanSlug = slug && slug.trim()
      ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      : cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const finalPoster = resolveEventPoster(poster_url, cleanName);

    const parsedStartDate = start_date ? new Date(start_date) : new Date();
    const parsedEndDate = end_date ? new Date(end_date) : null;
    const parsedRegStartDate = registration_start_date ? new Date(registration_start_date) : null;
    const parsedRegEndDate = registration_end_date ? new Date(registration_end_date) : null;
    const parsedMaxRegs = max_registrations !== undefined && max_registrations !== '' && max_registrations !== null
      ? parseInt(max_registrations, 10)
      : null;

    if (parsedStartDate && parsedEndDate && parsedEndDate < parsedStartDate) {
      return res.status(400).json({ error: 'Event End Date & Time cannot be earlier than Event Start Date & Time.' });
    }

    let newEvent;
    try {
      newEvent = await Event.create({
        name: cleanName,
        slug: cleanSlug,
        description: description ? description.trim() : `Official technical event and challenges for ${cleanName}.`,
        poster_url: finalPoster,
        category: category || 'Innovation Challenge',
        mode: mode || 'Hybrid',
        venue: venue || 'PRPCEM Campus & Virtual',
        start_date: parsedStartDate,
        end_date: parsedEndDate,
        registration_start_date: parsedRegStartDate,
        registration_end_date: parsedRegEndDate,
        max_registrations: parsedMaxRegs,
        fee: fee || 'Free',
        is_registration_open: is_registration_open !== false,
        rewards: rewards || 'Certificates & Swags',
        status: status || 'upcoming'
      });
    } catch (createErr) {
      if (createErr.message && (/is_registration_open/i.test(createErr.message) || /column.*does not exist/i.test(createErr.message) || /no such column/i.test(createErr.message))) {
        console.warn('⚠️ Missing column detected in Events table. Running on-the-fly schema repair...');
        await ensureEventsTableSchema(Event.sequelize);
        newEvent = await Event.create({
          name: cleanName,
          slug: cleanSlug,
          description: description ? description.trim() : `Official technical event and challenges for ${cleanName}.`,
          poster_url: finalPoster,
          category: category || 'Innovation Challenge',
          mode: mode || 'Hybrid',
          venue: venue || 'PRPCEM Campus & Virtual',
          start_date: parsedStartDate,
          end_date: parsedEndDate,
          registration_start_date: parsedRegStartDate,
          registration_end_date: parsedRegEndDate,
          max_registrations: parsedMaxRegs,
          fee: fee || 'Free',
          is_registration_open: is_registration_open !== false,
          rewards: rewards || 'Certificates & Swags',
          status: status || 'upcoming'
        });
      } else {
        throw createErr;
      }
    }

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

const isValidUUID = (val) => {
  return typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
};

// ----------------------------------------------------
// PUT /api/events/:id (Update Event)
// ----------------------------------------------------
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    let event = null;
    if (isValidUUID(id)) {
      event = await Event.findByPk(id).catch(() => null);
    } else {
      event = await Event.findOne({ where: { slug: id } }).catch(() => null);
    }
    
    // If updating a static event that was in JSON, migrate it into DB
    if (!event) {
      const staticMatch = staticEvents.find(s => s.id === id || (s.title && s.title.toLowerCase() === id.toLowerCase()));
      if (staticMatch) {
        try {
          event = await Event.create({
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
        } catch (staticCreateErr) {
          if (staticCreateErr.message && (/is_registration_open/i.test(staticCreateErr.message) || /column.*does not exist/i.test(staticCreateErr.message) || /no such column/i.test(staticCreateErr.message))) {
            await ensureEventsTableSchema(Event.sequelize);
            event = await Event.create({
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
            throw staticCreateErr;
          }
        }
      } else {
        return res.status(404).json({ error: 'Event not found.' });
      }
    }

    const {
      name,
      slug,
      description,
      poster_url,
      category,
      mode,
      venue,
      start_date,
      end_date,
      registration_start_date,
      registration_end_date,
      max_registrations,
      fee,
      is_registration_open,
      rewards,
      status
    } = req.body;

    if (name) {
      event.name = name.trim();
    }
    if (slug !== undefined && slug.trim()) {
      event.slug = slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    } else if (name && !event.slug) {
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
    if (registration_start_date !== undefined) event.registration_start_date = registration_start_date ? new Date(registration_start_date) : null;
    if (registration_end_date !== undefined) event.registration_end_date = registration_end_date ? new Date(registration_end_date) : null;
    if (max_registrations !== undefined) {
      event.max_registrations = max_registrations !== '' && max_registrations !== null ? parseInt(max_registrations, 10) : null;
    }
    if (fee !== undefined) event.fee = fee || 'Free';
    if (is_registration_open !== undefined) event.is_registration_open = Boolean(is_registration_open);
    if (rewards !== undefined) event.rewards = rewards;
    if (status !== undefined) event.status = status;

    if (event.start_date && event.end_date && new Date(event.end_date) < new Date(event.start_date)) {
      return res.status(400).json({ error: 'Event End Date & Time cannot be earlier than Event Start Date & Time.' });
    }

    try {
      await event.save();
    } catch (saveErr) {
      if (saveErr.message && (/is_registration_open/i.test(saveErr.message) || /column.*does not exist/i.test(saveErr.message) || /no such column/i.test(saveErr.message))) {
        console.warn('⚠️ Missing column detected on event save. Running on-the-fly schema repair...');
        await ensureEventsTableSchema(Event.sequelize);
        await event.save();
      } else {
        throw saveErr;
      }
    }

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
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    let event = null;
    if (isValidUUID(id)) {
      event = await Event.findByPk(id).catch(() => null);
    } else {
      event = await Event.findOne({ where: { slug: id } }).catch(() => null);
    }
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
// ----------------------------------------------------
router.get('/public', async (req, res) => {
  try {
    const now = new Date();
    const baseUrl = getQuizPlatformBaseUrl();

    // 1. Fetch DB Events, Quizzes, and Registrations safely
    const [dbEvents, allQuizzes, allRegistrations] = await Promise.all([
      Event.findAll({ order: [['start_date', 'DESC'], ['createdAt', 'DESC']] }).catch(() => []),
      Quiz.findAll({
        include: [
          {
            model: ScheduledOccurrence,
            as: 'occurrences',
            required: false,
            attributes: ['id', 'start_time', 'end_time', 'status']
          }
        ]
      }).catch(() => []),
      EventRegistration.findAll().catch(() => [])
    ]);

    const dbEventNames = new Set(dbEvents.map(e => (e.name || '').toLowerCase().trim()));
    const dbEventIds = new Set(dbEvents.map(e => e.id));

    const eventsList = [];

    // Format DB events
    for (const dev of dbEvents) {
      const devNameLower = (dev.name || '').toLowerCase().trim();
      const resolvedPoster = resolveEventPoster(dev.poster_url, dev.name);

      const linkedQuizzes = allQuizzes.filter(q =>
        q.event_id === dev.id || (q.event_name && q.event_name.toLowerCase().trim() === devNameLower)
      );

      const eventRegs = allRegistrations.filter(r =>
        r.event_id === dev.id || r.event_id === dev.slug || (r.event_name && r.event_name.toLowerCase().trim() === devNameLower)
      );

      const quizTracks = [];
      let totalRegCount = eventRegs.length;
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
        if (regCount > totalRegCount) totalRegCount = regCount;

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

      const maxRegs = dev.max_registrations ? parseInt(dev.max_registrations, 10) : null;
      const isRegDeadlinePassed = dev.registration_end_date ? new Date(dev.registration_end_date) < now : false;
      const isRegNotStartedYet = dev.registration_start_date ? new Date(dev.registration_start_date) > now : false;
      const isCapacityFull = maxRegs ? totalRegCount >= maxRegs : false;

      const isEventDateEnded = dev.end_date 
        ? new Date(dev.end_date) < now 
        : (dev.start_date ? new Date(dev.start_date) < now : false);

      const isCompleted = dev.status === 'completed' || dev.status === 'past' || isEventDateEnded;
      const finalStatus = isCompleted ? 'completed' : (isLiveNow ? 'live' : (dev.status || 'upcoming'));

      eventsList.push({
        id: dev.id,
        event_name: dev.name,
        title: dev.name,
        slug: dev.slug,
        description: dev.description || `Official challenges and technical sessions for ${dev.name}.`,
        poster: resolvedPoster,
        category: dev.category || 'Innovation Challenge',
        mode: dev.mode || 'Hybrid',
        venue: dev.venue || 'PRPCEM Campus & Virtual',
        rewards: dev.rewards || 'Certificates & Swags',
        start_date: dev.start_date ? new Date(dev.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Coming Soon",
        start_time: dev.start_date || dev.createdAt,
        end_time: dev.end_date,
        registration_start_date: dev.registration_start_date,
        registration_end_date: dev.registration_end_date,
        max_registrations: maxRegs,
        seats_remaining: maxRegs ? Math.max(0, maxRegs - totalRegCount) : null,
        fee: dev.fee || 'Free',
        is_registration_open: dev.is_registration_open !== false && !isCompleted && !isRegDeadlinePassed,
        is_registration_ended: isRegDeadlinePassed || isEventDateEnded,
        is_registration_pending: isRegNotStartedYet,
        is_capacity_full: isCapacityFull,
        is_live: isLiveNow,
        is_upcoming: finalStatus === 'upcoming',
        status: finalStatus,
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
        const eventRegs = allRegistrations.filter(r =>
          r.event_id === se.id || (r.event_name && r.event_name.toLowerCase().trim() === seKey)
        );

        const isStaticEnded = se.endDate 
          ? new Date(se.endDate) < now 
          : (se.startDate ? new Date(se.startDate) < now : (se.status === 'past' || se.status === 'completed'));
        const staticStatus = isStaticEnded ? 'completed' : (se.status || 'upcoming');

        eventsList.push({
          id: se.id,
          event_name: seTitle,
          title: seTitle,
          slug: se.id,
          description: se.description,
          poster: resolveEventPoster(se.poster, seTitle),
          category: se.category || 'Flagship Event',
          mode: se.mode || 'Offline',
          venue: se.venue || 'PRPCEM Campus',
          rewards: se.rewards || 'Certificates & Swags',
          start_date: se.date || (se.startDate ? new Date(se.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Past Event"),
          start_time: se.startDate ? new Date(se.startDate) : new Date(2025, 0, 1),
          end_time: se.endDate ? new Date(se.endDate) : null,
          registration_start_date: null,
          registration_end_date: null,
          max_registrations: null,
          seats_remaining: null,
          fee: 'Free',
          is_registration_open: !isStaticEnded,
          is_registration_ended: isStaticEnded,
          is_registration_pending: false,
          is_capacity_full: false,
          is_live: false,
          is_upcoming: staticStatus === 'upcoming',
          status: staticStatus,
          quizzes: [],
          total_quizzes_count: 0,
          total_registration_count: eventRegs.length,
          direct_quiz_url: null,
          register: se.register || `/register/${se.id}`
        });
      }
    }

    // Sort all public events so the latest date comes first
    sortEventsLatestFirst(eventsList);

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
      eventTitle,
      quizId,
      slug,
      name,
      fullName,
      email,
      college = 'PRPCEM Amravati',
      phone,
      year,
      yearOfStudy,
      branch,
      rollNo,
      notes
    } = req.body;

    const cleanName = (fullName || name || '').trim();
    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanCollege = (college || 'PRPCEM Amravati').trim();
    const cleanPhone = (phone || '').trim();
    const cleanYear = (yearOfStudy || year || '').trim();
    const cleanBranch = (branch || '').trim();
    const cleanRollNo = (rollNo || '').trim();
    const cleanNotes = (notes || '').trim();
    const targetEventId = (eventId || slug || 'msc-event').trim();
    const targetEventName = (eventName || eventTitle || targetEventId).trim();

    if (!cleanName) {
      return res.status(400).json({ error: 'Participant Full Name is required.' });
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return res.status(400).json({ error: 'Valid Email address is required.' });
    }

    // 1. Look up target event in DB for validation
    let targetEvent = null;
    if (isValidUUID(targetEventId)) {
      targetEvent = await Event.findByPk(targetEventId).catch(() => null);
    }
    if (!targetEvent) {
      targetEvent = await Event.findOne({
        where: {
          [Op.or]: [
            { slug: targetEventId },
            { slug: targetEventId.toLowerCase() },
            { name: targetEventName }
          ]
        }
      }).catch(() => null);
    }

    const now = new Date();

    if (targetEvent) {
      // Check if registration manually closed
      if (targetEvent.is_registration_open === false) {
        return res.status(400).json({ error: `Registration for "${targetEvent.name}" is currently closed by the organizers.` });
      }

      // Check if event is concluded or cancelled
      if (['completed', 'past', 'concluded', 'cancelled'].includes((targetEvent.status || '').toLowerCase())) {
        return res.status(400).json({ error: `Registration is unavailable because "${targetEvent.name}" has ${targetEvent.status}.` });
      }

      // Check registration opening date
      if (targetEvent.registration_start_date && new Date(targetEvent.registration_start_date) > now) {
        const openStr = new Date(targetEvent.registration_start_date).toLocaleString();
        return res.status(400).json({ error: `Registration for "${targetEvent.name}" opens on ${openStr}.` });
      }

      // Check registration deadline (Last Date)
      if (targetEvent.registration_end_date && new Date(targetEvent.registration_end_date) < now) {
        const deadlineStr = new Date(targetEvent.registration_end_date).toLocaleString();
        return res.status(400).json({ error: `Registration deadline for "${targetEvent.name}" passed on ${deadlineStr}.` });
      }

      // Check capacity limit
      if (targetEvent.max_registrations && targetEvent.max_registrations > 0) {
        const existingThisUser = await EventRegistration.findOne({
          where: {
            email: cleanEmail,
            [Op.or]: [
              { event_id: targetEvent.id },
              { event_id: targetEvent.slug || '' },
              { event_id: targetEventId }
            ]
          }
        });

        if (!existingThisUser) {
          const currentCount = await EventRegistration.count({
            where: {
              [Op.or]: [
                { event_id: targetEvent.id },
                { event_id: targetEvent.slug || '' },
                { event_id: targetEventId },
                { event_name: targetEvent.name }
              ]
            }
          });

          if (currentCount >= targetEvent.max_registrations) {
            return res.status(400).json({ error: `Registration capacity reached for "${targetEvent.name}" (Limit: ${targetEvent.max_registrations} seats).` });
          }
        }
      }
    }

    // 2. If User account already exists, sync college/branch if needed
    if (User) {
      const existingUser = await User.findOne({ where: { email: cleanEmail } });
      if (existingUser && !existingUser.college && cleanCollege) {
        await existingUser.update({ college: cleanCollege }).catch(() => {});
      }
    }

    // 3. Record Event Registration in DB
    let registration = await EventRegistration.findOne({
      where: {
        email: cleanEmail,
        [Op.or]: [
          { event_id: targetEventId },
          { event_id: targetEventId.toLowerCase() },
          ...(targetEvent ? [{ event_id: targetEvent.id }] : [])
        ]
      }
    });

    if (!registration) {
      registration = await EventRegistration.create({
        event_id: targetEvent ? targetEvent.id : targetEventId,
        event_name: targetEvent ? targetEvent.name : targetEventName,
        user_id: req.user?.id || null,
        full_name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        college: cleanCollege,
        branch: cleanBranch,
        year_of_study: cleanYear,
        roll_no: cleanRollNo,
        notes: cleanNotes,
        status: 'registered'
      });
    } else {
      // Update phone or college if missing
      await registration.update({
        full_name: cleanName,
        phone: cleanPhone || registration.phone,
        college: cleanCollege || registration.college,
        branch: cleanBranch || registration.branch,
        year_of_study: cleanYear || registration.year_of_study
      }).catch(() => {});
    }

    // 4. Find Matching Quizzes for this Event
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

    if (matchingQuizzes.length === 0 && (targetEventName || targetEventId)) {
      const matchSearch = targetEventName.replace(/^event-/, '').replace(/-/g, ' ').toLowerCase();
      const allQuizzes = await Quiz.findAll();
      matchingQuizzes = allQuizzes.filter(q =>
        q.event_id === targetEventId ||
        (targetEvent && q.event_id === targetEvent.id) ||
        (q.event_name && (q.event_name.toLowerCase().includes(matchSearch) || matchSearch.includes(q.event_name.toLowerCase())))
      );
    }

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

    const primaryEventName = (targetEvent && targetEvent.name) || targetEventName || (matchingQuizzes[0]?.event_name) || 'MSC Event';
    const primaryDirectUrl = registeredTracks[0]?.direct_url || `${baseUrl}/login`;

    // 5. Send Instant Confirmation Email
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
      registration: {
        id: registration.id,
        name: cleanName,
        email: cleanEmail,
        college: cleanCollege,
        phone: cleanPhone,
        branch: cleanBranch,
        year: cleanYear
      },
      participant: {
        id: req.user?.id || registration.id,
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
