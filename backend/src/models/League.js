const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const League = sequelize.define('League', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('LIVE_REALTIME', 'SCHEDULED_LEAGUE'),
    defaultValue: 'SCHEDULED_LEAGUE'
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  recurrence: {
    type: DataTypes.ENUM('daily', 'weekly_1day', 'weekly_multiple', 'specific_dates'),
    defaultValue: 'weekly_1day'
  },
  repeatDays: {
    type: DataTypes.TEXT, // Array of days e.g. ['Monday', 'Wednesday'] as JSON
    defaultValue: '["Monday"]',
    get() {
      const raw = this.getDataValue('repeatDays');
      if (!raw) return ['Monday'];
      try {
        return typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch (e) {
        return ['Monday'];
      }
    },
    set(val) {
      this.setDataValue('repeatDays', typeof val === 'object' ? JSON.stringify(val) : val);
    }
  },
  customDates: {
    type: DataTypes.TEXT, // Array of custom ISO date strings
    defaultValue: '[]',
    get() {
      const raw = this.getDataValue('customDates');
      if (!raw) return [];
      try {
        return typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch (e) {
        return [];
      }
    },
    set(val) {
      this.setDataValue('customDates', typeof val === 'object' ? JSON.stringify(val) : val);
    }
  },
  numberOfWeeks: {
    type: DataTypes.INTEGER,
    defaultValue: 8
  },
  status: {
    type: DataTypes.ENUM('draft', 'active', 'completed', 'archived'),
    defaultValue: 'active'
  },
  settings: {
    type: DataTypes.TEXT,
    defaultValue: JSON.stringify({
      includeAllWeeks: true,
      minWeeksRequired: 1,
      dropLowestScore: false,
      scoringWeights: {},
      leaderboardPrivacy: {
        showFullLeaderboard: true,
        showTop10Only: false,
        showUserRank: true,
        showScores: true,
        showNames: true
      }
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

module.exports = League;
