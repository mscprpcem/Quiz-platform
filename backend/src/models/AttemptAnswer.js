const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AttemptAnswer = sequelize.define('AttemptAnswer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  attempt_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  question_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  selected_option: {
    type: DataTypes.STRING, // 'A', 'B', 'C', 'D' or option value
    allowNull: false
  },
  is_correct: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  points: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  answered_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

module.exports = AttemptAnswer;
