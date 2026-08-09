const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const QuizAttempt = sequelize.define('QuizAttempt', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  user_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  user_college: {
    type: DataTypes.STRING,
    allowNull: true
  },
  quiz_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  league_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  league_week_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  attempt_number: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  started_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  submitted_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('in_progress', 'completed', 'expired', 'auto_submitted', 'disqualified'),
    defaultValue: 'in_progress'
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
  time_taken: {
    type: DataTypes.INTEGER, // in seconds
    defaultValue: 0
  },
  question_order: {
    type: DataTypes.TEXT, // Array of Question UUIDs stored as JSON
    defaultValue: '[]',
    get() {
      const raw = this.getDataValue('question_order');
      if (!raw) return [];
      try {
        return typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch (e) {
        return [];
      }
    },
    set(val) {
      this.setDataValue('question_order', typeof val === 'object' ? JSON.stringify(val) : val);
    }
  },
  option_order: {
    type: DataTypes.TEXT, // Object mapping questionId -> randomized options ['B', 'A', 'D', 'C']
    defaultValue: '{}',
    get() {
      const raw = this.getDataValue('option_order');
      if (!raw) return {};
      try {
        return typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch (e) {
        return {};
      }
    },
    set(val) {
      this.setDataValue('option_order', typeof val === 'object' ? JSON.stringify(val) : val);
    }
  },
  violation_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

module.exports = QuizAttempt;
