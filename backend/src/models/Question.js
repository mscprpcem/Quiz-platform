const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Question = sequelize.define('Question', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  quiz_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  question: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  option_a: {
    type: DataTypes.STRING,
    allowNull: false
  },
  option_b: {
    type: DataTypes.STRING,
    allowNull: false
  },
  option_c: {
    type: DataTypes.STRING,
    allowNull: false
  },
  option_d: {
    type: DataTypes.STRING,
    allowNull: false
  },
  correct_answer: {
    type: DataTypes.ENUM('A', 'B', 'C', 'D'),
    allowNull: false
  },
  timer: {
    type: DataTypes.INTEGER,
    defaultValue: 30, // seconds
    allowNull: false
  },
  marks: {
    type: DataTypes.INTEGER,
    defaultValue: 500,
    allowNull: false
  },
  order_index: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

module.exports = Question;
