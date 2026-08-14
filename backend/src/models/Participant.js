const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Participant = sequelize.define('Participant', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  quiz_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  sso_user_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: {
        msg: "Must be a valid email address"
      }
    }
  },
  college: {
    type: DataTypes.STRING,
    allowNull: false
  },
  tab_switch_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  connection_status: {
    type: DataTypes.ENUM('connected', 'disconnected'),
    defaultValue: 'connected'
  },
  disqualified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

module.exports = Participant;
