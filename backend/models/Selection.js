const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const Selection = sequelize.define('Selection', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  topicId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
})

module.exports = Selection 