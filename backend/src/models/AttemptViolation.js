const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AttemptViolation = sequelize.define('AttemptViolation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  attempt_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  violation_type: {
    type: DataTypes.STRING, // 'TAB_SWITCH', 'FULLSCREEN_EXIT', 'COPY', 'PASTE', 'WINDOW_BLUR'
    allowNull: false
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

module.exports = AttemptViolation;
