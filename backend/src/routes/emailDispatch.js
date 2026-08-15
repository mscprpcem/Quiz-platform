const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/auth');
const { User, Quiz, ScheduledOccurrence, QuizAttempt, Participant, Event, EventRegistration } = require('../models');
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
  console.warn('Could not read static events.json in emailDispatch:', e.message);
}

/**
 * Helper to replace dynamic placeholders in templates
 */
const replacePlaceholders = (text, data = {}) => {
  if (!text) return '';
  return text
    .replace(/\{name\}/gi, data.name || 'Learner')
    .replace(/\{student_name\}/gi, data.name || 'Learner')
    .replace(/\{email\}/gi, data.email || '')
    .replace(/\{college\}/gi, data.college || 'PRPCEM')
    .replace(/\{quiz_title\}/gi, data.quizTitle || data.eventName || 'Challenge Quiz')
    .replace(/\{event_name\}/gi, data.eventName || 'MSC Technical Event')
    .replace(/\{score\}/gi, data.score !== undefined && data.score !== null ? String(data.score) : 'N/A')
    .replace(/\{status\}/gi, data.status || 'Registered');
};

/**
 * GET /api/admin/email-dispatch/audiences
 * Returns audience list and summary counts (Students, Quizzes, Events)
 */
router.get('/audiences', authMiddleware, async (req, res) => {
  try {
    // 1. Get all registered students
    const students = await User.findAll({
      attributes: ['id', 'name', 'email', 'username', 'college', 'createdAt'],
      order: [['createdAt', 'DESC']]
    }).catch(() => []);

    // 2. Get all quizzes (Live + Scheduled)
    const quizzes = await Quiz.findAll({
      attributes: ['id', 'title', 'event_name', 'mode', 'status', 'join_code', 'subject', 'category', 'createdAt'],
      include: [
        {
          model: ScheduledOccurrence,
          as: 'occurrences',
          attributes: ['id', 'start_time', 'end_time', 'status'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    }).catch(() => []);

    // 3. Get all Events & Event Registrations
    const [events, registrations] = await Promise.all([
      Event.findAll({ order: [['createdAt', 'DESC']] }).catch(() => []),
      EventRegistration.findAll({ order: [['createdAt', 'DESC']] }).catch(() => [])
    ]);

    const eventsFormatted = [];
    const dbNames = new Set(events.map(e => (e.name || '').toLowerCase().trim()));
    const dbIds = new Set(events.map(e => String(e.id)));

    // Format DB Events
    for (const ev of events) {
      const evNameLower = (ev.name || '').toLowerCase().trim();
      const regCount = registrations.filter(r =>
        r.event_id === ev.id || r.event_id === ev.slug || (r.event_name && r.event_name.toLowerCase().trim() === evNameLower)
      ).length;

      eventsFormatted.push({
        id: ev.id,
        name: ev.name,
        slug: ev.slug || ev.id,
        category: ev.category || 'Innovation Challenge',
        registration_count: regCount,
        status: ev.status || 'upcoming'
      });
    }

    // Format Static JSON Events (if not already in DB)
    for (const se of staticEvents) {
      const seTitle = se.title || se.name;
      const seKey = seTitle.toLowerCase().trim();

      if (!dbNames.has(seKey) && !dbIds.has(se.id)) {
        const regCount = registrations.filter(r =>
          r.event_id === se.id || (r.event_name && (r.event_name.toLowerCase().includes(seKey) || seKey.includes(r.event_name.toLowerCase())))
        ).length;

        eventsFormatted.push({
          id: se.id,
          name: seTitle,
          slug: se.id,
          category: se.category || 'Flagship Event',
          registration_count: regCount,
          status: se.status === 'past' ? 'completed' : (se.status || 'upcoming')
        });
      }
    }

    res.json({
      success: true,
      all_students_count: students.length,
      students: students.map(s => ({
        id: s.id,
        name: s.name || s.email.split('@')[0],
        email: (s.email || '').toLowerCase().trim(),
        username: s.username || '',
        college: s.college || '',
        createdAt: s.createdAt
      })),
      quizzes: quizzes.map(q => ({
        id: q.id,
        title: q.title || 'Untitled Quiz',
        event_name: q.event_name || 'MSC Tech Event',
        mode: q.mode || 'LIVE',
        status: q.status || 'draft',
        join_code: q.join_code || '',
        subject: q.subject || q.category || 'Technical',
        occurrences: q.occurrences || []
      })),
      events: eventsFormatted
    });
  } catch (err) {
    console.error('Error fetching email audiences:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch email audiences.' });
  }
});

/**
 * GET /api/admin/email-dispatch/event-participants
 * Fetch all students registered for a specific Event
 */
router.get('/event-participants', authMiddleware, async (req, res) => {
  try {
    const { eventId, eventName } = req.query;
    if (!eventId && !eventName) {
      return res.status(400).json({ error: 'eventId or eventName is required.' });
    }

    const participantsMap = new Map();
    const targetQuery = (eventId || eventName || '').trim().toLowerCase();
    const targetAlphanum = targetQuery.replace(/[^a-z0-9]/g, '');

    // 1. Fetch from EventRegistration table
    const allRegs = await EventRegistration.findAll({ order: [['createdAt', 'DESC']] });
    const matchingRegs = allRegs.filter(r => {
      const rId = String(r.event_id || '').toLowerCase().trim();
      const rName = String(r.event_name || '').toLowerCase().trim();
      return (
        rId === targetQuery ||
        rId.replace(/[^a-z0-9]/g, '') === targetAlphanum ||
        rName.includes(targetQuery) ||
        targetQuery.includes(rName) ||
        rName.replace(/[^a-z0-9]/g, '') === targetAlphanum
      );
    });

    for (const r of matchingRegs) {
      if (r.email && r.email.includes('@')) {
        const clean = r.email.toLowerCase().trim();
        participantsMap.set(clean, {
          email: clean,
          name: r.full_name || clean.split('@')[0],
          college: r.college || 'PRPCEM',
          phone: r.phone || '',
          branch: r.branch || '',
          year: r.year_of_study || '',
          source: 'Website Registration',
          status: 'Registered'
        });
      }
    }

    // 2. Fetch from matching Quiz Participants if quizzes exist for this event
    const allQuizzes = await Quiz.findAll();
    const matchingQuizzes = allQuizzes.filter(q => {
      const qEvId = String(q.event_id || '').toLowerCase().trim();
      const qEvName = String(q.event_name || '').toLowerCase().trim();
      return (
        qEvId === targetQuery ||
        qEvName.includes(targetQuery) ||
        targetQuery.includes(qEvName) ||
        qEvName.replace(/[^a-z0-9]/g, '') === targetAlphanum
      );
    });

    for (const q of matchingQuizzes) {
      const liveParts = await Participant.findAll({ where: { quiz_id: q.id } }).catch(() => []);
      for (const lp of liveParts) {
        if (lp.email && lp.email.includes('@')) {
          const clean = lp.email.toLowerCase().trim();
          if (!participantsMap.has(clean)) {
            participantsMap.set(clean, {
              email: clean,
              name: lp.name || clean.split('@')[0],
              college: lp.college || 'PRPCEM',
              source: `Quiz: ${q.title}`,
              status: 'Quiz Registered'
            });
          }
        }
      }

      const attempts = await QuizAttempt.findAll({ where: { quiz_id: q.id } }).catch(() => []);
      for (const att of attempts) {
        if (att.participant_email && att.participant_email.includes('@')) {
          const clean = att.participant_email.toLowerCase().trim();
          if (!participantsMap.has(clean)) {
            participantsMap.set(clean, {
              email: clean,
              name: att.participant_name || clean.split('@')[0],
              college: 'PRPCEM',
              source: `Assessment: ${q.title}`,
              status: (att.status || 'completed').toLowerCase(),
              score: att.score
            });
          }
        }
      }
    }

    // 3. Fallback: If no direct registrations found yet, also check registered students in User table
    if (participantsMap.size === 0) {
      const users = await User.findAll({ limit: 50, order: [['createdAt', 'DESC']] });
      for (const u of users) {
        if (u.email && u.email.includes('@')) {
          const clean = u.email.toLowerCase().trim();
          participantsMap.set(clean, {
            email: clean,
            name: u.name || clean.split('@')[0],
            college: u.college || 'PRPCEM',
            source: 'Student Portal User',
            status: 'Student'
          });
        }
      }
    }

    const participants = Array.from(participantsMap.values());

    res.json({
      success: true,
      eventId,
      eventName,
      count: participants.length,
      participants
    });
  } catch (err) {
    console.error('Error fetching event participants:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch event participants.' });
  }
});

/**
 * GET /api/admin/email-dispatch/quiz-participants
 * Fetch participant list for a specific quiz with status and score attributes
 */
router.get('/quiz-participants', authMiddleware, async (req, res) => {
  try {
    const { quizId, occurrenceId } = req.query;

    if (!quizId && !occurrenceId) {
      return res.status(400).json({ error: 'quizId or occurrenceId is required.' });
    }

    let quizDetails = null;
    if (quizId) {
      quizDetails = await Quiz.findByPk(quizId, {
        attributes: ['id', 'title', 'event_name', 'mode', 'join_code', 'subject', 'category']
      });
    }

    const participantsMap = new Map();

    // 1. Check Scheduled Quiz Attempts
    try {
      const attemptWhere = {};
      if (occurrenceId) attemptWhere.occurrence_id = occurrenceId;
      if (quizId) attemptWhere.quiz_id = quizId;

      const attempts = await QuizAttempt.findAll({
        where: attemptWhere,
        attributes: ['id', 'participant_name', 'participant_email', 'status', 'score', 'started_at', 'submitted_at']
      });

      for (const att of attempts) {
        if (att.participant_email && att.participant_email.includes('@')) {
          const clean = att.participant_email.toLowerCase().trim();
          participantsMap.set(clean, {
            email: clean,
            name: att.participant_name || clean.split('@')[0],
            source: 'Scheduled Attempt',
            status: (att.status || 'completed').toLowerCase(),
            score: att.score,
            startedAt: att.started_at,
            submittedAt: att.submitted_at
          });
        }
      }
    } catch (attErr) {
      console.warn('Error fetching QuizAttempts for dispatch:', attErr.message);
    }

    // 2. Check Live Quiz Participants
    if (quizId) {
      try {
        const liveParticipants = await Participant.findAll({
          where: { quiz_id: quizId },
          attributes: ['id', 'name', 'email', 'college', 'score']
        });

        for (const p of liveParticipants) {
          if (p.email && p.email.includes('@')) {
            const clean = p.email.toLowerCase().trim();
            if (!participantsMap.has(clean)) {
              participantsMap.set(clean, {
                email: clean,
                name: p.name || clean.split('@')[0],
                college: p.college || '',
                source: 'Live Participant',
                status: 'registered',
                score: p.score
              });
            } else {
              const existing = participantsMap.get(clean);
              if (p.college) existing.college = p.college;
            }
          }
        }
      } catch (pErr) {
        console.warn('Error fetching Live Participants for dispatch:', pErr.message);
      }
    }

    // 3. Enrich with student college if in User table
    const emailsList = Array.from(participantsMap.keys());
    if (emailsList.length > 0) {
      try {
        const registeredUsers = await User.findAll({
          where: { email: { [Op.in]: emailsList } },
          attributes: ['email', 'college', 'name']
        });
        for (const u of registeredUsers) {
          const clean = u.email.toLowerCase().trim();
          if (participantsMap.has(clean)) {
            const p = participantsMap.get(clean);
            if (!p.college && u.college) p.college = u.college;
            if ((!p.name || p.name === clean.split('@')[0]) && u.name) p.name = u.name;
          }
        }
      } catch (uErr) {
        console.warn('Error enriching participant college:', uErr.message);
      }
    }

    const participants = Array.from(participantsMap.values());

    res.json({
      success: true,
      quiz: quizDetails ? {
        id: quizDetails.id,
        title: quizDetails.title,
        event_name: quizDetails.event_name,
        mode: quizDetails.mode,
        join_code: quizDetails.join_code,
        subject: quizDetails.subject || quizDetails.category
      } : null,
      count: participants.length,
      participants
    });
  } catch (err) {
    console.error('Error fetching quiz participants for email dispatch:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch quiz participants.' });
  }
});

const isValidUUID = (val) => {
  return typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val.trim());
};

/**
 * POST /api/admin/email-dispatch/send
 * Dispatches personalized custom email to selected participants
 */
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const {
      audienceType, // 'all_students' | 'quiz_participants' | 'event_registrants' | 'custom'
      quizId,
      eventId,
      eventName: reqEventName,
      occurrenceId,
      participantFilter = 'all',
      customEmails,
      excludedEmails = [],
      subject,
      heading,
      messageBody,
      ctaText,
      ctaUrl
    } = req.body;

    if (!subject || !subject.trim()) {
      return res.status(400).json({ error: 'Email Subject is required.' });
    }
    if (!messageBody || !messageBody.trim()) {
      return res.status(400).json({ error: 'Email Message Body is required.' });
    }

    let quizDetails = null;
    if (quizId) {
      if (isValidUUID(quizId)) {
        quizDetails = await Quiz.findByPk(quizId, {
          attributes: ['id', 'title', 'event_name', 'mode', 'join_code']
        }).catch(() => null);
      } else {
        quizDetails = await Quiz.findOne({
          where: { custom_slug: quizId },
          attributes: ['id', 'title', 'event_name', 'mode', 'join_code']
        }).catch(() => null);
      }
    }

    let eventDetails = null;
    if (eventId) {
      if (isValidUUID(eventId)) {
        eventDetails = await Event.findByPk(eventId).catch(() => null);
      } else {
        eventDetails = await Event.findOne({ where: { slug: eventId } }).catch(() => null);
      }
      if (!eventDetails) {
        const se = staticEvents.find(s =>
          String(s.id).toLowerCase() === String(eventId).toLowerCase() ||
          (s.title && s.title.toLowerCase() === String(eventId).toLowerCase()) ||
          (s.title && s.title.toLowerCase() === String(reqEventName || '').toLowerCase())
        );
        if (se) eventDetails = { name: se.title || se.name };
      }
    }

    const quizTitle = quizDetails?.title || 'MSC Quiz Challenge';
    const eventName = eventDetails?.name || reqEventName || quizDetails?.event_name || 'MSC Tech Event';

    const excludedSet = new Set((excludedEmails || []).map(e => e.toLowerCase().trim()));
    const targetRecipientsMap = new Map();

    if (audienceType === 'all_students') {
      const students = await User.findAll({
        attributes: ['name', 'email', 'college']
      });
      for (const s of students) {
        if (s.email && s.email.includes('@')) {
          const clean = s.email.toLowerCase().trim();
          if (!excludedSet.has(clean)) {
            targetRecipientsMap.set(clean, {
              email: clean,
              name: s.name || clean.split('@')[0],
              college: s.college || 'PRPCEM',
              status: 'Registered Student'
            });
          }
        }
      }
    } else if (audienceType === 'event_registrants') {
      const targetQuery = (eventId || reqEventName || '').trim().toLowerCase();
      const allRegs = await EventRegistration.findAll();
      const matchingRegs = allRegs.filter(r => {
        const rId = String(r.event_id || '').toLowerCase().trim();
        const rName = String(r.event_name || '').toLowerCase().trim();
        return rId === targetQuery || rName.includes(targetQuery) || targetQuery.includes(rName);
      });

      for (const r of matchingRegs) {
        if (r.email && r.email.includes('@')) {
          const clean = r.email.toLowerCase().trim();
          if (!excludedSet.has(clean)) {
            targetRecipientsMap.set(clean, {
              email: clean,
              name: r.full_name || clean.split('@')[0],
              college: r.college || 'PRPCEM',
              status: 'Registered'
            });
          }
        }
      }

      // If no registrations in table yet, fallback to all users
      if (targetRecipientsMap.size === 0) {
        const allUsers = await User.findAll({ limit: 50 });
        for (const u of allUsers) {
          if (u.email && u.email.includes('@')) {
            const clean = u.email.toLowerCase().trim();
            if (!excludedSet.has(clean)) {
              targetRecipientsMap.set(clean, {
                email: clean,
                name: u.name || clean.split('@')[0],
                college: u.college || 'PRPCEM',
                status: 'Registered Student'
              });
            }
          }
        }
      }
    } else if (audienceType === 'quiz_participants') {
      if (!quizId && !occurrenceId) {
        return res.status(400).json({ error: 'Please select a quiz to dispatch emails.' });
      }

      // 1. Scheduled attempts
      try {
        const attemptWhere = {};
        if (occurrenceId) attemptWhere.occurrence_id = occurrenceId;
        if (quizId) attemptWhere.quiz_id = quizId;

        const attempts = await QuizAttempt.findAll({
          where: attemptWhere,
          attributes: ['participant_name', 'participant_email', 'status', 'score']
        });

        for (const att of attempts) {
          if (att.participant_email && att.participant_email.includes('@')) {
            const clean = att.participant_email.toLowerCase().trim();
            const st = (att.status || '').toLowerCase();

            if (participantFilter === 'completed' && st !== 'completed' && st !== 'finished') continue;
            if (participantFilter === 'in_progress' && st !== 'in_progress' && st !== 'started') continue;
            if (participantFilter === 'registered' && (st === 'completed' || st === 'finished')) continue;

            if (!excludedSet.has(clean)) {
              targetRecipientsMap.set(clean, {
                email: clean,
                name: att.participant_name || clean.split('@')[0],
                score: att.score,
                status: att.status || 'Completed'
              });
            }
          }
        }
      } catch (attErr) {
        console.warn('Error querying attempts for email send:', attErr.message);
      }

      // 2. Live participants
      if (quizId) {
        try {
          const liveParticipants = await Participant.findAll({
            where: { quiz_id: quizId },
            attributes: ['name', 'email', 'college', 'score']
          });

          for (const p of liveParticipants) {
            if (p.email && p.email.includes('@')) {
              const clean = p.email.toLowerCase().trim();
              if (!excludedSet.has(clean) && !targetRecipientsMap.has(clean)) {
                targetRecipientsMap.set(clean, {
                  email: clean,
                  name: p.name || clean.split('@')[0],
                  college: p.college || 'PRPCEM',
                  score: p.score,
                  status: 'Registered'
                });
              }
            }
          }
        } catch (pErr) {
          console.warn('Error querying live participants for email send:', pErr.message);
        }
      }
    } else if (audienceType === 'custom') {
      const rawList = String(customEmails || '').split(/[\n,;]+/).map(e => e.trim().toLowerCase());
      for (const e of rawList) {
        if (e && e.includes('@') && !excludedSet.has(e)) {
          targetRecipientsMap.set(e, {
            email: e,
            name: e.split('@')[0],
            college: 'PRPCEM',
            status: 'Recipient'
          });
        }
      }
    }

    const recipientList = Array.from(targetRecipientsMap.values());

    if (recipientList.length === 0) {
      return res.status(400).json({ error: 'No valid recipient email addresses found for the selected audience.' });
    }

    let successCount = 0;
    let failedCount = 0;
    const errors = [];

    // Send emails
    for (const recipient of recipientList) {
      try {
        const studentData = {
          name: recipient.name || 'Learner',
          email: recipient.email,
          college: recipient.college || 'PRPCEM',
          quizTitle,
          eventName,
          score: recipient.score,
          status: recipient.status || 'Registered'
        };

        const personalizedSubject = replacePlaceholders(subject, studentData);
        const personalizedHeading = replacePlaceholders(heading || subject, studentData);
        const personalizedMessage = replacePlaceholders(messageBody, studentData);
        const formattedHtml = `<div style="font-size:14px;line-height:1.6;color:#334155;">${personalizedMessage.replace(/\n/g, '<br/>')}</div>`;

        await sendCustomBroadcastEmail({
          to: recipient.email,
          recipientName: studentData.name,
          subject: personalizedSubject,
          heading: personalizedHeading,
          messageHtml: formattedHtml,
          ctaText: ctaText ? replacePlaceholders(ctaText, studentData) : undefined,
          ctaUrl: ctaUrl ? replacePlaceholders(ctaUrl, studentData) : undefined
        });

        successCount++;
      } catch (mailErr) {
        failedCount++;
        errors.push({ email: recipient.email, error: mailErr.message });
      }
    }

    res.json({
      success: true,
      message: `Dispatched ${successCount} emails successfully (${failedCount} failed).`,
      totalTargeted: recipientList.length,
      successCount,
      failedCount,
      errors: errors.slice(0, 10)
    });
  } catch (err) {
    console.error('Error dispatching emails:', err);
    res.status(500).json({ error: err.message || 'Failed to dispatch emails.' });
  }
});

module.exports = router;
