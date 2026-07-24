const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Quiz = sequelize.define('Quiz', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  event_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  join_code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('draft', 'waiting_lobby', 'in_progress', 'completed'),
    defaultValue: 'draft'
  },
  current_question_index: {
    type: DataTypes.INTEGER,
    defaultValue: -1 // -1 means lobby. 0 means question 1.
  },
  current_question_status: {
    type: DataTypes.ENUM('closed', 'released', 'timer_ended'),
    defaultValue: 'closed'
  },
  scheduled_start: {
    type: DataTypes.DATE,
    allowNull: true
  },
  verification_synced: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  verification_synced_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  verification_event_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  verification_error: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  svg_template: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

module.exports = Quiz;
