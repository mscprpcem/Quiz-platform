const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LeagueWeek = sequelize.define('LeagueWeek', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  league_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  week_number: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  technology: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  quiz_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  start_date_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_date_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('upcoming', 'open', 'closed', 'finalized'),
    defaultValue: 'upcoming'
  },
  published: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  settings: {
    type: DataTypes.TEXT,
    defaultValue: JSON.stringify({
      timeLimit: 30, // in minutes
      maxAttempts: 1, // 1, 2, 3, 0 for unlimited
      attemptScoringPolicy: 'best', // 'best', 'latest', 'first', 'average'
      shuffleQuestions: true,
      shuffleAnswers: true,
      requireFullscreen: true,
      detectFullscreenExit: true,
      detectTabSwitch: true,
      detectWindowBlur: true,
      detectVisibilityChange: true,
      detectCopyPaste: true,
      detectRightClick: true,
      autoSubmitOnViolationThreshold: 0, // 0 = just log, 3 = submit on 3rd violation
      marksPerCorrect: 4,
      marksPerWrong: -1,
      marksUnanswered: 0,
      includeInCumulative: true,
      weekWeight: 100 // percentage weight
    }),
    get() {
      const rawValue = this.getDataValue('settings');
      if (!rawValue) return {};
      try {
        return typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
      } catch (e) {
        return {};
      }
    },
    set(value) {
      this.setDataValue('settings', typeof value === 'object' ? JSON.stringify(value) : value);
    }
  }
});

module.exports = LeagueWeek;
