const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  subject_id: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  username: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  college: {
    type: DataTypes.STRING,
    allowNull: true
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'student'
  },
  otp: {
    type: DataTypes.STRING,
    allowNull: true
  },
  otp_expiry: {
    type: DataTypes.DATE,
    allowNull: true
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  hooks: {
    beforeCreate: async (user) => {
      if (!user.subject_id) {
        const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
        user.subject_id = `usr_${randomHex}`;
      }
      if (user.password && !user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
      if (user.email) {
        user.email = user.email.toLowerCase().trim();
      }
      if (user.username) {
        user.username = user.username.toLowerCase().trim();
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
      if (user.changed('email') && user.email) {
        user.email = user.email.toLowerCase().trim();
      }
      if (user.changed('username') && user.username) {
        user.username = user.username.toLowerCase().trim();
      }
    }
  }
});

User.prototype.comparePassword = async function (candidatePassword) {
  if (!this.password || !candidatePassword) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = User;
