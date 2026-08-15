const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { User, Quiz, ScheduledOccurrence, QuizAttempt, Participant } = require('../models');
const { sendCustomBroadcastEmail } = require('../services/emailService');
const { Op } = require('sequelize');

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
    .replace(/\{quiz_title\}/gi, data.quizTitle || 'Quiz Challenge')
    .replace(/\{event_name\}/gi, data.eventName || 'MSC Tech Event')
    .replace(/\{score\}/gi, data.score !== undefined && data.score !== null ? String(data.score) : 'N/A')
    .replace(/\{status\}/gi, data.status || 'Registered');
};

/**
 * GET /api/admin/email-dispatch/audiences
 * Returns audience list and summary counts
 */
router.get('/audiences', authMiddleware, async (req, res) => {
  try {
    // 1. Get all registered students
    let students = [];
    try {
      students = await User.findAll({
        attributes: ['id', 'name', 'email', 'username', 'college', 'createdAt'],
        order: [['createdAt', 'DESC']]
      });
    } catch (uErr) {
      console.warn('Fallback finding users for email dispatch:', uErr.message);
      students = await User.findAll();
    }

    // 2. Get all quizzes (Live + Scheduled) with occurrences and event names
    let quizzes = [];
    try {
      quizzes = await Quiz.findAll({
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
      });
    } catch (qErr) {
      console.warn('Fallback finding quizzes without occurrences:', qErr.message);
      quizzes = await Quiz.findAll({
        order: [['createdAt', 'DESC']]
      });
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
      }))
    });
  } catch (err) {
    console.error('Error fetching email audiences:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch email audiences.' });
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
              // Update college if existing
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

/**
 * POST /api/admin/email-dispatch/send
 * Dispatches personalized custom email to selected participants with {name}, {college}, {quiz_title}, {event_name} placeholder replacement
 */
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const {
      audienceType, // 'all_students' | 'quiz_participants' | 'custom'
      quizId,
      occurrenceId,
      participantFilter = 'all', // 'all' | 'completed' | 'in_progress' | 'registered'
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
      quizDetails = await Quiz.findByPk(quizId, {
        attributes: ['id', 'title', 'event_name', 'mode', 'join_code']
      });
    }

    const quizTitle = quizDetails?.title || 'MSC Quiz Challenge';
    const eventName = quizDetails?.event_name || 'MSC Tech Event';

    const excludedSet = new Set((excludedEmails || []).map(e => e.toLowerCase().trim()));
    const targetRecipientsMap = new Map(); // email -> { name, email, college, score, status }

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

            // Filter by participantFilter if set
            if (participantFilter === 'completed' && st !== 'completed' && st !== 'finished') continue;
            if (participantFilter === 'in_progress' && st !== 'in_progress' && st !== 'started') continue;
            if (participantFilter === 'registered' && (st === 'completed' || st === 'finished')) continue;

            if (!excludedSet.has(clean)) {
              targetRecipientsMap.set(clean, {
                email: clean,
                name: att.participant_name || clean.split('@')[0],
                score: att.score,
                status: att.status
              });
            }
          }
        }
      } catch (attErr) {
        console.warn('Error querying attempts:', attErr.message);
      }

      // 2. Live participants
      if (quizId && participantFilter !== 'completed') {
        try {
          const liveP = await Participant.findAll({
            where: { quiz_id: quizId },
            attributes: ['name', 'email', 'college', 'score']
          });
          for (const p of liveP) {
            if (p.email && p.email.includes('@')) {
              const clean = p.email.toLowerCase().trim();
              if (!excludedSet.has(clean)) {
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
          console.warn('Error querying live participants:', pErr.message);
        }
      }
    } else if (audienceType === 'custom') {
      const emailList = Array.isArray(customEmails) 
        ? customEmails 
        : (customEmails || '').split(/[\n,;]+/).map(e => e.trim()).filter(Boolean);

      for (const raw of emailList) {
        if (raw.includes('@')) {
          const clean = raw.toLowerCase().trim();
          if (!excludedSet.has(clean)) {
            targetRecipientsMap.set(clean, {
              email: clean,
              name: clean.split('@')[0],
              college: 'PRPCEM',
              status: 'Custom'
            });
          }
        }
      }
    }

    const recipients = Array.from(targetRecipientsMap.values());

    if (recipients.length === 0) {
      return res.status(400).json({ error: 'No recipients matched the selected criteria.' });
    }

    console.log(`[EMAIL DISPATCH] Broadcasting to ${recipients.length} recipients. Subject: "${subject}"`);

    let sentCount = 0;
    let failedCount = 0;
    const errors = [];

    // Dispatch in chunks of 5 with dynamic placeholder replacements
    const CHUNK_SIZE = 5;
    for (let i = 0; i < recipients.length; i += CHUNK_SIZE) {
      const chunk = recipients.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map(async (rec) => {
          try {
            const contextData = {
              name: rec.name,
              email: rec.email,
              college: rec.college,
              score: rec.score,
              status: rec.status,
              quizTitle,
              eventName
            };

            const pSubject = replacePlaceholders(subject, contextData).trim();
            const pHeading = replacePlaceholders(heading || subject, contextData).trim();
            const rawBody = replacePlaceholders(messageBody, contextData);
            
            let messageHtml = rawBody;
            if (!rawBody.includes('<p>') && !rawBody.includes('<div>')) {
              messageHtml = rawBody
                .split('\n\n')
                .map(p => `<p style="margin: 0 0 12px 0;">${p.replace(/\n/g, '<br/>')}</p>`)
                .join('');
            }

            const pCtaText = ctaText ? replacePlaceholders(ctaText, contextData).trim() : null;
            const pCtaUrl = ctaUrl ? replacePlaceholders(ctaUrl, contextData).trim() : null;

            await sendCustomBroadcastEmail({
              to: rec.email,
              recipientName: rec.name,
              subject: pSubject,
              heading: pHeading,
              messageHtml,
              ctaText: pCtaText,
              ctaUrl: pCtaUrl
            });
            sentCount++;
          } catch (err) {
            console.error(`[EMAIL DISPATCH] Failed sending to ${rec.email}:`, err.message);
            failedCount++;
            errors.push({ email: rec.email, error: err.message });
          }
        })
      );
    }

    res.json({
      success: true,
      message: `Email broadcast delivered to ${sentCount} recipient(s).` + (failedCount > 0 ? ` (${failedCount} failed)` : ''),
      totalRecipients: recipients.length,
      sentCount,
      failedCount,
      errors: errors.slice(0, 10)
    });
  } catch (err) {
    console.error('Error dispatching custom email broadcast:', err);
    res.status(500).json({ error: err.message || 'Failed to dispatch email broadcast.' });
  }
});

module.exports = router;
