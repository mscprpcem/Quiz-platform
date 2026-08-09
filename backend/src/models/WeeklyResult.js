const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WeeklyResult = sequelize.define('WeeklyResult', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  league_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  league_week_id: {
    type: DataTypes.UUID,
    allowNull: false
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
  best_attempt_id: {
    type: DataTypes.UUID,
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
  time_taken: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  rank: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
});

module.exports = WeeklyResult;
