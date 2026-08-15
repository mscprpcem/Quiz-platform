const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  poster_url: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'https://mscprpcem.blob.core.windows.net/events/clean_529287766.png'
  },
  category: {
    type: DataTypes.STRING,
    defaultValue: 'Technical Workshop'
  },
  mode: {
    type: DataTypes.STRING,
    defaultValue: 'Offline' // 'Offline' | 'Online' | 'Hybrid'
  },
  venue: {
    type: DataTypes.STRING,
    defaultValue: 'PRPCEM Amravati'
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rewards: {
    type: DataTypes.STRING,
    defaultValue: 'Certificates & Swags'
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'upcoming'
  }
});

module.exports = Event;
