const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')
const TopicSelection = require('./TopicSelection')

const Topic = sequelize.define('Topic', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  requirements: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  maxStudents: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  selectedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('open', 'closed', 'deleted'),
    defaultValue: 'open'
  },
  deadline: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'topics',
  timestamps: true
})

// 添加关联
Topic.hasMany(TopicSelection, { foreignKey: 'topic_id' })
TopicSelection.belongsTo(Topic, { foreignKey: 'topic_id' })

module.exports = Topic 