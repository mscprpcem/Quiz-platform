const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BrandSettings = sequelize.define('BrandSettings', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  club_name: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Microsoft Student Club'
  },
  chapter_name: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'MSC-PRPCEM Chapter'
  },
  logo_path: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null
  },
  primary_color: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '#0078d4'
  },
  footer_text: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Powered by Microsoft Student Club Quiz Platform'
  }
});

module.exports = BrandSettings;
