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
  type: {
    type: DataTypes.STRING, // 'FULLSCREEN_EXIT', 'TAB_SWITCH', 'WINDOW_BLUR', 'VISIBILITY_CHANGE', 'COPY_ATTEMPT', 'PASTE_ATTEMPT', 'RIGHT_CLICK'
    allowNull: false
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  metadata: {
    type: DataTypes.TEXT,
    get() {
      const raw = this.getDataValue('metadata');
      if (!raw) return {};
      try {
        return typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch (e) {
        return {};
      }
    },
    set(val) {
      this.setDataValue('metadata', typeof val === 'object' ? JSON.stringify(val) : val);
    }
  }
});

module.exports = AttemptViolation;
