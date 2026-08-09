const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const QuizAttempt = sequelize.define('QuizAttempt', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  occurrence_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  quiz_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  participant_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  participant_email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  attempt_number: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  started_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  submitted_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  score: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  correct_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  incorrect_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  unanswered_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  time_taken_seconds: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  question_order: {
    type: DataTypes.TEXT, // JSON stringified array of question IDs
    allowNull: true
  },
  option_orders: {
    type: DataTypes.TEXT, // JSON stringified map of question ID -> shuffled options
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('in_progress', 'completed', 'expired', 'disqualified'),
    defaultValue: 'in_progress'
  }
});

module.exports = QuizAttempt;
