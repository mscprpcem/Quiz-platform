const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { User, Quiz, ScheduledOccurrence, QuizAttempt, Participant } = require('../models');
const { sendCustomBroadcastEmail } = require('../services/emailService');
const { Op } = require('sequelize');

/**
 * GET /api/admin/email-dispatch/audiences
 * Returns audience list and summary counts
 */
router.get('/audiences', authMiddleware, async (req, res) => {
  try {
    // 1. Get total registered students
    const students = await User.findAll({
      where: {
        role: 'student'
      },
      attributes: ['id', 'name', 'email', 'username', 'college', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    // 2. Get all quizzes (Live + Scheduled)
    const quizzes = await Quiz.findAll({
      attributes: ['id', 'title', 'event_name', 'mode', 'status', 'join_code'],
      include: [
        {
          model: ScheduledOccurrence,
          as: 'occurrences',
          attributes: ['id', 'occurrence_id', 'start_time', 'end_time']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      all_students_count: students.length,
      students,
      quizzes
    });
  } catch (err) {
    console.error('Error fetching email audiences:', err);
    res.status(500).json({ error: 'Failed to fetch email audiences.' });
  }
});

/**
 * GET /api/admin/email-dispatch/quiz-participants
 * Fetch participant list for a specific quiz / occurrence
 */
router.get('/quiz-participants', authMiddleware, async (req, res) => {
  try {
    const { quizId, occurrenceId } = req.query;

    if (!quizId && !occurrenceId) {
      return res.status(400).json({ error: 'quizId or occurrenceId is required.' });
    }

    const participantsMap = new Map();

    // 1. Check Scheduled Quiz Attempts
    const attemptWhere = {};
    if (occurrenceId) attemptWhere.occurrence_id = occurrenceId;
    if (quizId) attemptWhere.quiz_id = quizId;

    const attempts = await QuizAttempt.findAll({
      where: attemptWhere,
      attributes: ['id', 'participant_name', 'participant_email', 'status', 'score', 'started_at']
    });

    for (const att of attempts) {
      if (att.participant_email && att.participant_email.includes('@')) {
        const clean = att.participant_email.toLowerCase().trim();
        if (!participantsMap.has(clean)) {
          participantsMap.set(clean, {
            email: clean,
            name: att.participant_name || clean.split('@')[0],
            source: 'Scheduled Attempt',
            status: att.status
          });
        }
      }
    }

    // 2. Check Live Quiz Participants
    if (quizId) {
      const liveParticipants = await Participant.findAll({
        where: { quiz_id: quizId },
        attributes: ['id', 'name', 'email', 'college']
      });

      for (const p of liveParticipants) {
        if (p.email && p.email.includes('@')) {
          const clean = p.email.toLowerCase().trim();
          if (!participantsMap.has(clean)) {
            participantsMap.set(clean, {
              email: clean,
              name: p.name || clean.split('@')[0],
              source: 'Live Participant',
              status: 'registered'
            });
          }
        }
      }
    }

    const participants = Array.from(participantsMap.values());

    res.json({
      success: true,
      count: participants.length,
      participants
    });
  } catch (err) {
    console.error('Error fetching quiz participants for email dispatch:', err);
    res.status(500).json({ error: 'Failed to fetch quiz participants.' });
  }
});

/**
 * POST /api/admin/email-dispatch/send
 * Dispatches custom email to selected participants
 */
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const {
      audienceType, // 'all_students' | 'quiz_participants' | 'custom'
      quizId,
      occurrenceId,
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

    const excludedSet = new Set((excludedEmails || []).map(e => e.toLowerCase().trim()));
    const targetRecipientsMap = new Map(); // email -> { name, email }

    if (audienceType === 'all_students') {
      const students = await User.findAll({
        where: { role: 'student' },
        attributes: ['name', 'email']
      });
      for (const s of students) {
        if (s.email && s.email.includes('@')) {
          const clean = s.email.toLowerCase().trim();
          if (!excludedSet.has(clean)) {
            targetRecipientsMap.set(clean, { email: clean, name: s.name });
          }
        }
      }
    } else if (audienceType === 'quiz_participants') {
      if (!quizId && !occurrenceId) {
        return res.status(400).json({ error: 'Please select a quiz or occurrence to dispatch emails.' });
      }

      // Scheduled attempts
      const attemptWhere = {};
      if (occurrenceId) attemptWhere.occurrence_id = occurrenceId;
      if (quizId) attemptWhere.quiz_id = quizId;

      const attempts = await QuizAttempt.findAll({
        where: attemptWhere,
        attributes: ['participant_name', 'participant_email']
      });

      for (const att of attempts) {
        if (att.participant_email && att.participant_email.includes('@')) {
          const clean = att.participant_email.toLowerCase().trim();
          if (!excludedSet.has(clean)) {
            targetRecipientsMap.set(clean, { email: clean, name: att.participant_name || clean.split('@')[0] });
          }
        }
      }

      // Live participants
      if (quizId) {
        const liveP = await Participant.findAll({
          where: { quiz_id: quizId },
          attributes: ['name', 'email']
        });
        for (const p of liveP) {
          if (p.email && p.email.includes('@')) {
            const clean = p.email.toLowerCase().trim();
            if (!excludedSet.has(clean)) {
              targetRecipientsMap.set(clean, { email: clean, name: p.name || clean.split('@')[0] });
            }
          }
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
            targetRecipientsMap.set(clean, { email: clean, name: clean.split('@')[0] });
          }
        }
      }
    } else {
      return res.status(400).json({ error: 'Invalid audience type.' });
    }

    const recipients = Array.from(targetRecipientsMap.values());

    if (recipients.length === 0) {
      return res.status(400).json({ error: 'No valid recipient email addresses found for dispatch.' });
    }

    // Convert raw messageBody to HTML paragraphs if not already HTML
    let messageHtml = messageBody;
    if (!messageBody.includes('<p>') && !messageBody.includes('<div>')) {
      messageHtml = messageBody
        .split('\n\n')
        .map(p => `<p style="margin: 0 0 12px 0;">${p.replace(/\n/g, '<br/>')}</p>`)
        .join('');
    }

    console.log(`[EMAIL DISPATCH] Starting broadcast to ${recipients.length} recipients. Subject: "${subject}"`);

    let sentCount = 0;
    let failedCount = 0;
    const errors = [];

    // Dispatch in concurrency chunks of 5
    const CHUNK_SIZE = 5;
    for (let i = 0; i < recipients.length; i += CHUNK_SIZE) {
      const chunk = recipients.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map(async (rec) => {
          try {
            await sendCustomBroadcastEmail({
              to: rec.email,
              recipientName: rec.name,
              subject: subject.trim(),
              heading: heading ? heading.trim() : subject.trim(),
              messageHtml,
              ctaText: ctaText ? ctaText.trim() : null,
              ctaUrl: ctaUrl ? ctaUrl.trim() : null
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
      message: `Email broadcast dispatched to ${sentCount} recipient(s).` + (failedCount > 0 ? ` (${failedCount} failed)` : ''),
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
