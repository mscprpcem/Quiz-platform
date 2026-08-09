const sequelize = require('../config/database');
const Admin = require('./Admin');
const Quiz = require('./Quiz');
const Question = require('./Question');
const Participant = require('./Participant');
const Answer = require('./Answer');
const Violation = require('./Violation');
const League = require('./League');
const LeagueWeek = require('./LeagueWeek');
const QuizAttempt = require('./QuizAttempt');
const AttemptAnswer = require('./AttemptAnswer');
const AttemptViolation = require('./AttemptViolation');
const WeeklyResult = require('./WeeklyResult');

// =======================
// Existing Live Quiz Relationships
// =======================

// Quiz <-> Question
Quiz.hasMany(Question, { foreignKey: 'quiz_id', as: 'questions', onDelete: 'CASCADE' });
Question.belongsTo(Quiz, { foreignKey: 'quiz_id', as: 'quiz' });

// Quiz <-> Participant
Quiz.hasMany(Participant, { foreignKey: 'quiz_id', as: 'participants', onDelete: 'CASCADE' });
Participant.belongsTo(Quiz, { foreignKey: 'quiz_id', as: 'quiz' });

// Participant <-> Answer
Participant.hasMany(Answer, { foreignKey: 'participant_id', as: 'answers', onDelete: 'CASCADE' });
Answer.belongsTo(Participant, { foreignKey: 'participant_id', as: 'participant' });

// Question <-> Answer
Question.hasMany(Answer, { foreignKey: 'question_id', as: 'answers', onDelete: 'CASCADE' });
Answer.belongsTo(Question, { foreignKey: 'question_id', as: 'question' });

// Participant <-> Violation
Participant.hasMany(Violation, { foreignKey: 'participant_id', as: 'violations', onDelete: 'CASCADE' });
Violation.belongsTo(Participant, { foreignKey: 'participant_id', as: 'participant' });

// Quiz <-> Violation
Quiz.hasMany(Violation, { foreignKey: 'quiz_id', as: 'violations', onDelete: 'CASCADE' });
Violation.belongsTo(Quiz, { foreignKey: 'quiz_id', as: 'quiz' });

// =======================
// Weekly Tech League Relationships
// =======================

// League <-> LeagueWeek
League.hasMany(LeagueWeek, { foreignKey: 'league_id', as: 'weeks', onDelete: 'CASCADE' });
LeagueWeek.belongsTo(League, { foreignKey: 'league_id', as: 'league' });

// Quiz <-> LeagueWeek
Quiz.hasMany(LeagueWeek, { foreignKey: 'quiz_id', as: 'leagueWeeks' });
LeagueWeek.belongsTo(Quiz, { foreignKey: 'quiz_id', as: 'quiz' });

// League <-> QuizAttempt
League.hasMany(QuizAttempt, { foreignKey: 'league_id', as: 'attempts', onDelete: 'CASCADE' });
QuizAttempt.belongsTo(League, { foreignKey: 'league_id', as: 'league' });

// LeagueWeek <-> QuizAttempt
LeagueWeek.hasMany(QuizAttempt, { foreignKey: 'league_week_id', as: 'attempts', onDelete: 'CASCADE' });
QuizAttempt.belongsTo(LeagueWeek, { foreignKey: 'league_week_id', as: 'leagueWeek' });

// Quiz <-> QuizAttempt
Quiz.hasMany(QuizAttempt, { foreignKey: 'quiz_id', as: 'attempts' });
QuizAttempt.belongsTo(Quiz, { foreignKey: 'quiz_id', as: 'quiz' });

// QuizAttempt <-> AttemptAnswer
QuizAttempt.hasMany(AttemptAnswer, { foreignKey: 'attempt_id', as: 'answers', onDelete: 'CASCADE' });
AttemptAnswer.belongsTo(QuizAttempt, { foreignKey: 'attempt_id', as: 'attempt' });

// Question <-> AttemptAnswer
Question.hasMany(AttemptAnswer, { foreignKey: 'question_id', as: 'attemptAnswers', onDelete: 'CASCADE' });
AttemptAnswer.belongsTo(Question, { foreignKey: 'question_id', as: 'question' });

// QuizAttempt <-> AttemptViolation
QuizAttempt.hasMany(AttemptViolation, { foreignKey: 'attempt_id', as: 'violations', onDelete: 'CASCADE' });
AttemptViolation.belongsTo(QuizAttempt, { foreignKey: 'attempt_id', as: 'attempt' });

// League <-> WeeklyResult
League.hasMany(WeeklyResult, { foreignKey: 'league_id', as: 'weeklyResults', onDelete: 'CASCADE' });
WeeklyResult.belongsTo(League, { foreignKey: 'league_id', as: 'league' });

// LeagueWeek <-> WeeklyResult
LeagueWeek.hasMany(WeeklyResult, { foreignKey: 'league_week_id', as: 'weeklyResults', onDelete: 'CASCADE' });
WeeklyResult.belongsTo(LeagueWeek, { foreignKey: 'league_week_id', as: 'leagueWeek' });

module.exports = {
  sequelize,
  Admin,
  Quiz,
  Question,
  Participant,
  Answer,
  Violation,
  League,
  LeagueWeek,
  QuizAttempt,
  AttemptAnswer,
  AttemptViolation,
  WeeklyResult
};
