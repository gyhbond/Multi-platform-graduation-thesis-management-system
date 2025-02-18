const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const Thesis = sequelize.define('Thesis', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  topic_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  file_url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('submitted', 'reviewed', 'rejected'),
    defaultValue: 'submitted'
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  submitted_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  annotations: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: '论文批注'
  }
}, {
  tableName: 'theses',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['topic_id']
    },
    {
      fields: ['student_id']
    }
  ]
})

module.exports = Thesis 