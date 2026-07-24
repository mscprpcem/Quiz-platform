const express = require('express');
const router = express.Router();
const multer = require('multer');
const ExcelJS = require('exceljs');
const { Quiz, Question, Participant, Answer, Violation } = require('../models');
const authMiddleware = require('../middleware/auth');
const { syncQuizCertificates } = require('../services/verificationService');

// Multer memory storage configuration for Excel uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
    }
  }
});

// Helper: Generate Unique Join Code
const generateJoinCode = async () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let isUnique = false;
  let code = '';

  while (!isUnique) {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    const existing = await Quiz.findOne({ where: { join_code: code } });
    if (!existing) {
      isUnique = true;
    }
  }
  return code;
};

// ----------------------------------------------------
// QUIZ ROUTES
// ----------------------------------------------------

// Public quizzes endpoint (for homepage without auth)
router.get('/public', async (req, res) => {
  try {
    const quizzes = await Quiz.findAll({
      order: [['createdAt', 'DESC']]
    });

    const quizzesWithCounts = await Promise.all(
      quizzes.map(async (quiz) => {
        const questionCount = await Question.count({ where: { quiz_id: quiz.id } });
        const participantCount = await Participant.count({ where: { quiz_id: quiz.id } });
        return {
          id: quiz.id,
          title: quiz.title,
          event_name: quiz.event_name,
          description: quiz.description,
          join_code: quiz.join_code,
          status: quiz.status,
          scheduled_start: quiz.scheduled_start,
          createdAt: quiz.createdAt,
          questionCount,
          participantCount
        };
      })
    );

    return res.json(quizzesWithCounts);
  } catch (error) {
    console.error('Fetch public quizzes error:', error);
    return res.status(500).json({ error: 'Server error fetching public quizzes' });
  }
});

// Get all quizzes (admin)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const quizzes = await Quiz.findAll({
      order: [['createdAt', 'DESC']]
    });

    // Fetch question and participant counts for each quiz
    const quizzesWithCounts = await Promise.all(
      quizzes.map(async (quiz) => {
        const questionCount = await Question.count({ where: { quiz_id: quiz.id } });
        const participantCount = await Participant.count({ where: { quiz_id: quiz.id } });
        return {
          ...quiz.toJSON(),
          questionCount,
          participantCount
        };
      })
    );

    return res.json(quizzesWithCounts);
  } catch (error) {
    console.error('Fetch quizzes error:', error);
    return res.status(500).json({ error: 'Server error fetching quizzes' });
  }
});

// Get quiz details (including questions)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.id || req.params.id, {
      include: [
        {
          model: Question,
          as: 'questions'
        }
      ],
      order: [[{ model: Question, as: 'questions' }, 'order_index', 'ASC']]
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    return res.json(quiz);
  } catch (error) {
    console.error('Fetch quiz error:', error);
    return res.status(500).json({ error: 'Server error fetching quiz' });
  }
});

// Create new quiz
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, event_name, description, scheduled_start } = req.body;

    if (!title || !event_name) {
      return res.status(400).json({ error: 'Title and event name are required' });
    }

    const join_code = await generateJoinCode();

    const quiz = await Quiz.create({
      title,
      event_name,
      description,
      join_code,
      status: 'draft',
      scheduled_start: scheduled_start || null
    });

    return res.status(201).json(quiz);
  } catch (error) {
    console.error('Create quiz error:', error);
    return res.status(500).json({ error: 'Server error creating quiz' });
  }
});

// Update quiz details
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, event_name, description, scheduled_start } = req.body;
    const quiz = await Quiz.findByPk(req.params.id);

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    await quiz.update({
      title: title || quiz.title,
      event_name: event_name || quiz.event_name,
      description: description !== undefined ? description : quiz.description,
      scheduled_start: scheduled_start !== undefined ? (scheduled_start || null) : quiz.scheduled_start
    });

    return res.json(quiz);
  } catch (error) {
    console.error('Update quiz error:', error);
    return res.status(500).json({ error: 'Server error updating quiz' });
  }
});

// Publish quiz (changes status from 'draft' to 'waiting_lobby')
router.put('/:id/publish', authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const questionCount = await Question.count({ where: { quiz_id: quiz.id } });
    if (questionCount === 0) {
      return res.status(400).json({ error: 'Cannot publish a quiz with no questions. Please add at least 1 question first.' });
    }

    await quiz.update({ status: 'waiting_lobby' });
    return res.json({ message: 'Quiz published successfully!', quiz });
  } catch (error) {
    console.error('Publish quiz error:', error);
    return res.status(500).json({ error: 'Server error publishing quiz' });
  }
});

// Delete quiz
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Manually cascade-delete all child records since SQLite doesn't
    // reliably enforce ON DELETE CASCADE foreign key constraints.

    // 1. Get all question IDs and participant IDs for this quiz
    const questions = await Question.findAll({ where: { quiz_id: quiz.id }, attributes: ['id'] });
    const questionIds = questions.map(q => q.id);

    const participants = await Participant.findAll({ where: { quiz_id: quiz.id }, attributes: ['id'] });
    const participantIds = participants.map(p => p.id);

    // 2. Delete Answers (linked to both questions and participants)
    if (questionIds.length > 0) {
      await Answer.destroy({ where: { question_id: questionIds } });
    }
    if (participantIds.length > 0) {
      // Also delete any answers linked by participant_id that weren't caught above
      await Answer.destroy({ where: { participant_id: participantIds } });
    }

    // 3. Delete Violations
    await Violation.destroy({ where: { quiz_id: quiz.id } });

    // 4. Delete Participants
    await Participant.destroy({ where: { quiz_id: quiz.id } });

    // 5. Delete Questions
    await Question.destroy({ where: { quiz_id: quiz.id } });

    // 6. Finally delete the Quiz itself
    await quiz.destroy();
    return res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Delete quiz error:', error);
    return res.status(500).json({ error: 'Server error deleting quiz' });
  }
});

// ----------------------------------------------------
// QUESTION ROUTES
// ----------------------------------------------------

// Add a question manually
router.post('/:id/questions', authMiddleware, async (req, res) => {
  try {
    const { question, option_a, option_b, option_c, option_d, correct_answer, timer, marks } = req.body;
    const quiz_id = req.params.id;

    const quiz = await Quiz.findByPk(quiz_id);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    if (!question || !option_a || !option_b || !option_c || !option_d || !correct_answer) {
      return res.status(400).json({ error: 'All fields except timer and marks are required' });
    }

    if (!['A', 'B', 'C', 'D'].includes(correct_answer)) {
      return res.status(400).json({ error: 'Correct answer must be A, B, C, or D' });
    }

    // Get current max order index
    const maxOrder = await Question.max('order_index', { where: { quiz_id } });
    const order_index = (maxOrder || 0) + 1;

    const newQuestion = await Question.create({
      quiz_id,
      question,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer,
      timer: timer || 30,
      marks: marks || 500,
      order_index
    });

    return res.status(201).json(newQuestion);
  } catch (error) {
    console.error('Add question error:', error);
    return res.status(500).json({ error: 'Server error adding question' });
  }
});

// Update a question
router.put('/questions/:id', authMiddleware, async (req, res) => {
  try {
    const { question, option_a, option_b, option_c, option_d, correct_answer, timer, marks } = req.body;
    const existingQuestion = await Question.findByPk(req.params.id);

    if (!existingQuestion) {
      return res.status(404).json({ error: 'Question not found' });
    }

    if (correct_answer && !['A', 'B', 'C', 'D'].includes(correct_answer)) {
      return res.status(400).json({ error: 'Correct answer must be A, B, C, or D' });
    }

    await existingQuestion.update({
      question: question || existingQuestion.question,
      option_a: option_a || existingQuestion.option_a,
      option_b: option_b || existingQuestion.option_b,
      option_c: option_c || existingQuestion.option_c,
      option_d: option_d || existingQuestion.option_d,
      correct_answer: correct_answer || existingQuestion.correct_answer,
      timer: timer !== undefined ? timer : existingQuestion.timer,
      marks: marks !== undefined ? marks : existingQuestion.marks
    });

    return res.json(existingQuestion);
  } catch (error) {
    console.error('Update question error:', error);
    return res.status(500).json({ error: 'Server error updating question' });
  }
});

// Delete a question
router.delete('/questions/:id', authMiddleware, async (req, res) => {
  try {
    const existingQuestion = await Question.findByPk(req.params.id);
    if (!existingQuestion) {
      return res.status(404).json({ error: 'Question not found' });
    }

    await existingQuestion.destroy();
    return res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Delete question error:', error);
    return res.status(500).json({ error: 'Server error deleting question' });
  }
});

// Bulk update timer for all questions of a quiz
router.put('/:id/questions/timer', authMiddleware, async (req, res) => {
  try {
    const { timer } = req.body;
    const quizId = req.params.id;

    if (timer === undefined || isNaN(timer) || timer < 5 || timer > 300) {
      return res.status(400).json({ error: 'Timer must be between 5 and 300 seconds' });
    }

    const quiz = await Quiz.findByPk(quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    await Question.update(
      { timer: parseInt(timer, 10) },
      { where: { quiz_id: quizId } }
    );

    return res.json({ message: `Successfully updated timer to ${timer}s for all questions.` });
  } catch (error) {
    console.error('Bulk update timer error:', error);
    return res.status(500).json({ error: 'Server error updating bulk timer' });
  }
});

// ----------------------------------------------------
// EXCEL QUESTION IMPORT ROUTE
// ----------------------------------------------------

router.post('/:id/import', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const quiz_id = req.params.id;
    const quiz = await Quiz.findByPk(quiz_id);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Excel file is required' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return res.status(400).json({ error: 'Excel file is empty' });
    }

    const parsedQuestions = [];
    const errors = [];

    // Skip row 1 (headers) and read questions starting from row 2
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip headers

      // Expected Column Layout:
      // A (1) - Question
      // B (2) - Option A
      // C (3) - Option B
      // D (4) - Option C
      // E (5) - Option D
      // F (6) - Correct Answer (A, B, C, D)
      // G (7) - Timer (Optional)
      // H (8) - Marks (Optional)

      const questionText = row.getCell(1).text?.trim();
      const optionA = row.getCell(2).text?.trim();
      const optionB = row.getCell(3).text?.trim();
      const optionC = row.getCell(4).text?.trim();
      const optionD = row.getCell(5).text?.trim();
      const correctAns = row.getCell(6).text?.trim()?.toUpperCase();
      const timerVal = row.getCell(7).value;
      const marksVal = row.getCell(8).value;

      // Skip row if it's completely empty
      if (!questionText && !optionA && !optionB && !optionC && !optionD && !correctAns) {
        return;
      }

      const rowError = [];
      if (!questionText) rowError.push('Question text is missing');
      if (!optionA) rowError.push('Option A is missing');
      if (!optionB) rowError.push('Option B is missing');
      if (!optionC) rowError.push('Option C is missing');
      if (!optionD) rowError.push('Option D is missing');
      if (!correctAns) {
        rowError.push('Correct answer is missing');
      } else if (!['A', 'B', 'C', 'D'].includes(correctAns)) {
        rowError.push(`Correct answer must be A, B, C, or D (got '${correctAns}')`);
      }

      let timer = 30;
      if (timerVal !== null && timerVal !== undefined) {
        const parsedTimer = parseInt(timerVal, 10);
        if (isNaN(parsedTimer) || parsedTimer <= 0) {
          rowError.push(`Timer must be a positive integer (got '${timerVal}')`);
        } else {
          timer = parsedTimer;
        }
      }

      let marks = 500;
      if (marksVal !== null && marksVal !== undefined) {
        const parsedMarks = parseInt(marksVal, 10);
        if (isNaN(parsedMarks) || parsedMarks <= 0) {
          rowError.push(`Marks must be a positive integer (got '${marksVal}')`);
        } else {
          marks = parsedMarks;
        }
      }

      if (rowError.length > 0) {
        errors.push(`Row ${rowNumber}: ${rowError.join(', ')}`);
      } else {
        parsedQuestions.push({
          quiz_id,
          question: questionText,
          option_a: optionA,
          option_b: optionB,
          option_c: optionC,
          option_d: optionD,
          correct_answer: correctAns,
          timer,
          marks
        });
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    if (parsedQuestions.length === 0) {
      return res.status(400).json({ error: 'No questions found in Excel file' });
    }

    // Get current max order index
    const maxOrder = await Question.max('order_index', { where: { quiz_id } });
    let currentOrderIndex = (maxOrder || 0) + 1;

    // Assign order indices
    parsedQuestions.forEach((q) => {
      q.order_index = currentOrderIndex++;
    });

    // Bulk create questions
    const createdQuestions = await Question.bulkCreate(parsedQuestions);

    return res.json({
      message: `Successfully imported ${createdQuestions.length} questions`,
      count: createdQuestions.length
    });
  } catch (error) {
    console.error('Import questions error:', error);
    return res.status(500).json({ error: 'Server error during question import' });
  }
});

// Trigger / Retry Verification & Certificate Auto-Sync
router.post('/:id/sync-certificates', authMiddleware, async (req, res) => {
  try {
    const quizId = req.params.id;
    const result = await syncQuizCertificates(quizId);

    return res.json({
      message: result.success
        ? 'Certificates & Event synced successfully with Verification Platform!'
        : 'Sync log recorded (Verification Platform endpoint not reachable directly).',
      synced: result.success,
      details: result
    });
  } catch (error) {
    console.error('Sync certificates error:', error);
    return res.status(500).json({ error: error.message || 'Server error syncing certificates' });
  }
});

// Helper for SVG Certificate Default Template and Placeholder Substitution
function getDefaultSvgTemplate() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1000" height="700" viewBox="0 0 1000 700" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#2563eb"/>
      <stop offset="50%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#60a5fa"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000" flood-opacity="0.3"/>
    </filter>
  </defs>

  <rect width="1000" height="700" fill="url(#bgGrad)"/>
  <rect x="25" y="25" width="950" height="650" fill="none" stroke="url(#accentGrad)" stroke-width="4" rx="16"/>
  <rect x="35" y="35" width="930" height="630" fill="none" stroke="#334155" stroke-width="1" rx="12"/>

  <!-- Brand Header -->
  <g transform="translate(60, 70)">
    <rect x="0" y="0" width="18" height="18" fill="#f25022"/>
    <rect x="22" y="0" width="18" height="18" fill="#7fba00"/>
    <rect x="0" y="22" width="18" height="18" fill="#00a4ef"/>
    <rect x="22" y="22" width="18" height="18" fill="#ffb900"/>
    <text x="54" y="28" fill="#f8fafc" font-family="'Segoe UI', sans-serif" font-size="20" font-weight="800" letter-spacing="1">MICROSOFT STUDENT CLUB</text>
    <text x="54" y="48" fill="#94a3b8" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="600" letter-spacing="2">PRPCEM CHAPTER • OFFICIAL CREDENTIAL</text>
  </g>

  <!-- Title -->
  <text x="500" y="200" fill="#93c5fd" font-family="'Segoe UI', sans-serif" font-size="14" font-weight="800" text-anchor="middle" letter-spacing="4">CERTIFICATE OF ACHIEVEMENT</text>
  <text x="500" y="240" fill="#94a3b8" font-family="'Segoe UI', sans-serif" font-size="15" font-weight="400" text-anchor="middle">PROUDLY PRESENTED TO</text>

  <!-- Recipient Name -->
  <text x="500" y="310" fill="#ffffff" font-family="'Segoe UI', sans-serif" font-size="38" font-weight="900" text-anchor="middle" filter="url(#shadow)">{{name}}</text>
  <line x1="300" y1="330" x2="700" y2="330" stroke="url(#accentGrad)" stroke-width="2"/>

  <!-- Achievement Details -->
  <text x="500" y="375" fill="#cbd5e1" font-family="'Segoe UI', sans-serif" font-size="15" font-weight="400" text-anchor="middle">For outstanding performance in {{event_name}}</text>
  <text x="500" y="420" fill="#60a5fa" font-family="'Segoe UI', sans-serif" font-size="26" font-weight="800" text-anchor="middle">{{title}}</text>
  <text x="500" y="460" fill="#94a3b8" font-family="'Segoe UI', sans-serif" font-size="13" font-weight="600" text-anchor="middle">Category: {{category}} | Rank: #{{rank}} | Score: {{score}} pts</text>

  <!-- Footer -->
  <g transform="translate(80, 560)">
    <text x="0" y="0" fill="#64748b" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700">DATE ISSUED</text>
    <text x="0" y="20" fill="#f8fafc" font-family="'Segoe UI', sans-serif" font-size="14" font-weight="700">{{date}}</text>
  </g>

  <g transform="translate(500, 560)">
    <circle cx="0" cy="0" r="30" fill="#1e3a8a" stroke="url(#accentGrad)" stroke-width="3"/>
    <path d="M-10,-4 L0,12 L12,-10" fill="none" stroke="#60a5fa" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="0" y="45" fill="#94a3b8" font-family="'Segoe UI', sans-serif" font-size="10" font-weight="800" text-anchor="middle">VERIFIED</text>
  </g>

  <g transform="translate(920, 560)">
    <text x="0" y="0" fill="#64748b" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="700" text-anchor="end">CREDENTIAL ID</text>
    <text x="0" y="20" fill="#60a5fa" font-family="Consolas, monospace" font-size="14" font-weight="800" text-anchor="end">{{credential_id}}</text>
  </g>
</svg>`;
}

async function renderSvgPlaceholders(svgContent, data) {
  let svg = svgContent || getDefaultSvgTemplate();
  const escapeXml = (unsafe) => String(unsafe || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

  const name = escapeXml(data.name || data.recipient_name || 'Alex Morgan');
  const title = escapeXml(data.title || data.quizTitle || 'Technical Master Quiz');
  const eventName = escapeXml(data.event_name || data.eventName || 'MSC Tech Fest 2026');
  const date = escapeXml(data.date || data.issue_date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }));
  const score = escapeXml(data.score ?? '150');
  const rank = escapeXml(data.rank ?? '1');
  const category = escapeXml(data.category || (Number(data.rank) === 1 ? '1st Place Winner' : 'Participation Certificate'));
  const credentialId = escapeXml(data.credential_id || data.id || 'MSC-BDG-99481');
  const verificationUrl = escapeXml(data.verification_url || data.verificationUrl || `https://verify.mscprpcem.tech/verify/${credentialId}`);

  let qrDataUri = data.qr_data_uri || data.qrDataUri || '';
  if (!qrDataUri) {
    try {
      const QRCode = require('qrcode');
      qrDataUri = await QRCode.toDataURL(verificationUrl, { margin: 1, width: 200 });
    } catch (e) {
      console.warn('QR Code generation fallback:', e.message);
    }
  }

  const qrImageTag = qrDataUri
    ? `<image href="${qrDataUri}" width="100%" height="100%" />`
    : `<rect width="100%" height="100%" fill="#1e293b" rx="8"/><text x="50%" y="50%" fill="#60a5fa" font-size="10" text-anchor="middle" dominant-baseline="middle">QR CODE</text>`;

  svg = svg.replace(/\{{1,2}\s*(RECIPIENT_NAME|NAME|name)\s*\}{1,2}/gi, name);
  svg = svg.replace(/\{{1,2}\s*(QUIZ_TITLE|TITLE|title)\s*\}{1,2}/gi, title);
  svg = svg.replace(/\{{1,2}\s*(EVENT_NAME|event_name|event)\s*\}{1,2}/gi, eventName);
  svg = svg.replace(/\{{1,2}\s*(ISSUE_DATE|DATE|date)\s*\}{1,2}/gi, date);
  svg = svg.replace(/\{{1,2}\s*(SCORE|score)\s*\}{1,2}/gi, score);
  svg = svg.replace(/\{{1,2}\s*(RANK|rank)\s*\}{1,2}/gi, rank);
  svg = svg.replace(/\{{1,2}\s*(CATEGORY|category)\s*\}{1,2}/gi, category);
  svg = svg.replace(/\{{1,2}\s*(CREDENTIAL_ID|ID|credential_id|id)\s*\}{1,2}/gi, credentialId);
  svg = svg.replace(/\{{1,2}\s*(VERIFICATION_URL|verification_url|url)\s*\}{1,2}/gi, verificationUrl);
  svg = svg.replace(/\{{1,2}\s*(QR_CODE|VERIFICATION_QR|qr_code|verification_qr|qr)\s*\}{1,2}/gi, qrImageTag);

  return svg;
}

// GET /api/quizzes/:id/template — Get Quiz SVG template or default
router.get('/:id/template', authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    return res.json({
      quizId: quiz.id,
      title: quiz.title,
      event_name: quiz.event_name,
      svg_template: quiz.svg_template || getDefaultSvgTemplate(),
      isCustom: Boolean(quiz.svg_template)
    });
  } catch (error) {
    console.error('Fetch SVG template error:', error);
    return res.status(500).json({ error: 'Failed to fetch SVG template' });
  }
});

// POST /api/quizzes/:id/template — Save/Update SVG template
router.post('/:id/template', authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const { svg_template } = req.body;
    await quiz.update({ svg_template: svg_template || null });

    return res.json({
      message: 'SVG Certificate template saved successfully!',
      quizId: quiz.id,
      isCustom: Boolean(quiz.svg_template)
    });
  } catch (error) {
    console.error('Save SVG template error:', error);
    return res.status(500).json({ error: 'Failed to save SVG template' });
  }
});

// POST /api/quizzes/:id/render-preview — Render live certificate SVG preview with sample/real data
router.post('/:id/render-preview', authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const { custom_svg, sample_data } = req.body;
    const templateToUse = custom_svg || quiz.svg_template || getDefaultSvgTemplate();

    const data = {
      title: quiz.title,
      event_name: quiz.event_name,
      ...(sample_data || {})
    };

    const renderedSvg = await renderSvgPlaceholders(templateToUse, data);
    return res.json({
      svg: renderedSvg,
      data
    });
  } catch (error) {
    console.error('Render preview error:', error);
    return res.status(500).json({ error: 'Failed to render certificate preview' });
  }
});

module.exports = router;
