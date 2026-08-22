const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Subscriber = sequelize.define('Subscriber', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  source: {
    type: DataTypes.STRING,
    defaultValue: 'Courses Page'
  },
  topic: {
    type: DataTypes.STRING,
    defaultValue: 'Future Quizzes & Course Releases'
  },
  ip_address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  synced_to_sheet: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  sheet_sync_error: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['email'] },
    { fields: ['createdAt'] }
  ]
});

module.exports = Subscriber;
