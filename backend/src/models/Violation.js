const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Violation = sequelize.define('Violation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  participant_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  quiz_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  violation_type: {
    type: DataTypes.STRING, // 'tab_switch', 'exit_fullscreen', 'focus_loss'
    allowNull: false
  }
});

module.exports = Violation;
