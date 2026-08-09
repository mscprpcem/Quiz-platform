const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ScheduledOccurrence = sequelize.define('ScheduledOccurrence', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  quiz_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  occurrence_number: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'PAUSED'),
    defaultValue: 'SCHEDULED'
  }
});

module.exports = ScheduledOccurrence;
