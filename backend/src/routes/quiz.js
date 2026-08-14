const express = require('express');
const router = express.Router();
const multer = require('multer');
const ExcelJS = require('exceljs');
const { Quiz, Question, Participant, Answer, Violation, ScheduledOccurrence } = require('../models');
const authMiddleware = require('../middleware/auth');
const { Op } = require('sequelize');


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
          subject: quiz.subject || 'DBMS',
          description: quiz.description,
          join_code: quiz.join_code,
          status: quiz.status,
          scheduled_start: quiz.scheduled_start,
          scheduled_end: quiz.scheduled_end,
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

// Create 1-click Instant DBMS Preset Quiz (Admin)
router.post('/preset/dbms', authMiddleware, async (req, res) => {
  try {
    const { title, event_name, scheduled_start, scheduled_end } = req.body;

    const join_code = await generateJoinCode();

    // Default 1-day schedule if not provided
    const now = new Date();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const quiz = await Quiz.create({
      title: title || 'Database Management Systems (DBMS) Challenge',
      event_name: event_name || 'MSC DBMS Special Quiz',
      subject: 'DBMS',
      description: 'Comprehensive quiz covering SQL, Normalization, ACID transactions, Indexing, and Relational Algebra.',
      join_code,
      status: 'draft',
      scheduled_start: scheduled_start || now,
      scheduled_end: scheduled_end || endOfDay
    });

    const defaultQuestions = [
      {
        quiz_id: quiz.id,
        question: 'Which SQL command is used to retrieve data from a relational database table?',
        option_a: 'UPDATE',
        option_b: 'SELECT',
        option_c: 'INSERT',
        option_d: 'DELETE',
        correct_answer: 'B',
        timer: 30,
        marks: 500,
        order_index: 1
      },
      {
        quiz_id: quiz.id,
        question: 'In database normalization, which Normal Form eliminates partial dependencies on a composite primary key?',
        option_a: '1NF (First Normal Form)',
        option_b: '2NF (Second Normal Form)',
        option_c: '3NF (Third Normal Form)',
        option_d: 'BCNF (Boyce-Codd Normal Form)',
        correct_answer: 'B',
        timer: 30,
        marks: 500,
        order_index: 2
      },
      {
        quiz_id: quiz.id,
        question: 'Which ACID property guarantees that once a transaction completes successfully, changes are permanently saved?',
        option_a: 'Atomicity',
        option_b: 'Consistency',
        option_c: 'Isolation',
        option_d: 'Durability',
        correct_answer: 'D',
        timer: 30,
        marks: 500,
        order_index: 3
      },
      {
        quiz_id: quiz.id,
        question: 'Which type of SQL JOIN returns all records from the left table and matching records from the right table?',
        option_a: 'INNER JOIN',
        option_b: 'LEFT (OUTER) JOIN',
        option_c: 'RIGHT (OUTER) JOIN',
        option_d: 'FULL (OUTER) JOIN',
        correct_answer: 'B',
        timer: 30,
        marks: 500,
        order_index: 4
      },
      {
        quiz_id: quiz.id,
        question: 'What is the primary data structure commonly used by relational databases for table indexing?',
        option_a: 'Binary Search Tree',
        option_b: 'B-Tree / B+ Tree',
        option_c: 'Linked List',
        option_d: 'Min-Heap',
        correct_answer: 'B',
        timer: 30,
        marks: 500,
        order_index: 5
      }
    ];

    await Question.bulkCreate(defaultQuestions);

    return res.status(201).json({ message: 'Instant DBMS quiz created successfully!', quiz });
  } catch (error) {
    console.error('Create DBMS preset quiz error:', error);
    return res.status(500).json({ error: 'Server error creating DBMS preset quiz' });
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

// Delete quiz (Admin)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const participants = await Participant.findAll({ where: { quiz_id: quiz.id } });
    const participantIds = participants.map(p => p.id);

    if (participantIds.length > 0) {
      await Answer.destroy({ where: { participant_id: participantIds } });
      await Violation.destroy({ where: { participant_id: participantIds } });
      await Participant.destroy({ where: { quiz_id: quiz.id } });
    }

    await Question.destroy({ where: { quiz_id: quiz.id } });
    await quiz.destroy();

    return res.json({ success: true, message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Delete quiz error:', error);
    return res.status(500).json({ error: 'Server error deleting quiz' });
  }
});

// Create new quiz
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, event_name, subject, description, scheduled_start, scheduled_end, custom_slug, badge_title } = req.body;

    if (!title || !event_name) {
      return res.status(400).json({ error: 'Title and event name are required' });
    }

    const join_code = await generateJoinCode();
    const cleanSlug = custom_slug ? custom_slug.trim().replace(/^\//, '') : null;

    if (cleanSlug) {
      await Quiz.update({ custom_slug: null }, { where: { custom_slug: cleanSlug } });
    }

    const quiz = await Quiz.create({
      title,
      event_name,
      subject: subject || 'DBMS',
      description,
      join_code,
      custom_slug: cleanSlug,
      status: 'draft',
      badge_title: badge_title || null,
      scheduled_start: scheduled_start || null,
      scheduled_end: scheduled_end || null
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
    const { title, event_name, subject, description, scheduled_start, scheduled_end, custom_slug, badge_title } = req.body;
    const quiz = await Quiz.findByPk(req.params.id);

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const cleanSlug = custom_slug !== undefined ? (custom_slug ? custom_slug.trim().replace(/^\//, '') : null) : quiz.custom_slug;

    if (cleanSlug) {
      await Quiz.update({ custom_slug: null }, {
        where: {
          custom_slug: cleanSlug,
          id: { [Op.ne]: quiz.id }
        }
      });
    }

    await quiz.update({
      title: title || quiz.title,
      event_name: event_name || quiz.event_name,
      subject: subject || quiz.subject,
      custom_slug: cleanSlug,
      badge_title: badge_title !== undefined ? (badge_title || null) : quiz.badge_title,
      description: description !== undefined ? description : quiz.description,
      scheduled_start: scheduled_start !== undefined ? (scheduled_start || null) : quiz.scheduled_start,
      scheduled_end: scheduled_end !== undefined ? (scheduled_end || null) : quiz.scheduled_end
    });

    // Synchronize existing occurrences if schedule times were updated
    if (scheduled_start || scheduled_end) {
      const occurrences = await ScheduledOccurrence.findAll({ where: { quiz_id: quiz.id } });
      for (const occ of occurrences) {
        await occ.update({
          start_time: scheduled_start ? new Date(scheduled_start) : occ.start_time,
          end_time: scheduled_end ? new Date(scheduled_end) : occ.end_time
        });
      }
    }

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

module.exports = router;
