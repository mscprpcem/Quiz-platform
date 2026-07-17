const sequelize = require('../config/database');
const Admin = require('./Admin');
const Quiz = require('./Quiz');
const Question = require('./Question');
const Participant = require('./Participant');
const Answer = require('./Answer');
const Violation = require('./Violation');

// Relationships

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

module.exports = {
  sequelize,
  Admin,
  Quiz,
  Question,
  Participant,
  Answer,
  Violation
};
