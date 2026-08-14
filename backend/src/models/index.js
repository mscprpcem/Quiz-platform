const sequelize = require('../config/database');
const Admin = require('./Admin');
const User = require('./User');
const Quiz = require('./Quiz');
const Question = require('./Question');
const Participant = require('./Participant');
const Answer = require('./Answer');
const Violation = require('./Violation');
const ScheduledOccurrence = require('./ScheduledOccurrence');
const QuizAttempt = require('./QuizAttempt');
const AttemptAnswer = require('./AttemptAnswer');
const AttemptViolation = require('./AttemptViolation');

// Relationships

// Quiz <-> Question
Quiz.hasMany(Question, { foreignKey: 'quiz_id', as: 'questions', onDelete: 'CASCADE' });
Question.belongsTo(Quiz, { foreignKey: 'quiz_id', as: 'quiz' });

// Quiz <-> Participant (Live Quiz)
Quiz.hasMany(Participant, { foreignKey: 'quiz_id', as: 'participants', onDelete: 'CASCADE' });
Participant.belongsTo(Quiz, { foreignKey: 'quiz_id', as: 'quiz' });

// Participant <-> Answer (Live Quiz)
Participant.hasMany(Answer, { foreignKey: 'participant_id', as: 'answers', onDelete: 'CASCADE' });
Answer.belongsTo(Participant, { foreignKey: 'participant_id', as: 'participant' });

// Question <-> Answer
Question.hasMany(Answer, { foreignKey: 'question_id', as: 'answers', onDelete: 'CASCADE' });
Answer.belongsTo(Question, { foreignKey: 'question_id', as: 'question' });

// Participant <-> Violation (Live Quiz)
Participant.hasMany(Violation, { foreignKey: 'participant_id', as: 'violations', onDelete: 'CASCADE' });
Violation.belongsTo(Participant, { foreignKey: 'participant_id', as: 'participant' });

// Quiz <-> Violation (Live Quiz)
Quiz.hasMany(Violation, { foreignKey: 'quiz_id', as: 'violations', onDelete: 'CASCADE' });
Violation.belongsTo(Quiz, { foreignKey: 'quiz_id', as: 'quiz' });

// ── Scheduled Quiz Associations ──

// Quiz <-> ScheduledOccurrence
Quiz.hasMany(ScheduledOccurrence, { foreignKey: 'quiz_id', as: 'occurrences', onDelete: 'CASCADE' });
ScheduledOccurrence.belongsTo(Quiz, { foreignKey: 'quiz_id', as: 'quiz' });

// ScheduledOccurrence <-> QuizAttempt
ScheduledOccurrence.hasMany(QuizAttempt, { foreignKey: 'occurrence_id', as: 'attempts', onDelete: 'CASCADE' });
QuizAttempt.belongsTo(ScheduledOccurrence, { foreignKey: 'occurrence_id', as: 'occurrence' });

// Quiz <-> QuizAttempt
Quiz.hasMany(QuizAttempt, { foreignKey: 'quiz_id', as: 'scheduled_attempts', onDelete: 'CASCADE' });
QuizAttempt.belongsTo(Quiz, { foreignKey: 'quiz_id', as: 'quiz' });

// QuizAttempt <-> AttemptAnswer
QuizAttempt.hasMany(AttemptAnswer, { foreignKey: 'attempt_id', as: 'answers', onDelete: 'CASCADE' });
AttemptAnswer.belongsTo(QuizAttempt, { foreignKey: 'attempt_id', as: 'attempt' });

// QuizAttempt <-> AttemptViolation
QuizAttempt.hasMany(AttemptViolation, { foreignKey: 'attempt_id', as: 'violations', onDelete: 'CASCADE' });
AttemptViolation.belongsTo(QuizAttempt, { foreignKey: 'attempt_id', as: 'attempt' });

module.exports = {
  sequelize,
  Admin,
  User,
  Quiz,
  Question,
  Participant,
  Answer,
  Violation,
  ScheduledOccurrence,
  QuizAttempt,
  AttemptAnswer,
  AttemptViolation
};
