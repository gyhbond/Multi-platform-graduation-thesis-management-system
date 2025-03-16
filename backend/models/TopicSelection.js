const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const TopicSelection = sequelize.define('TopicSelection', {
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
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'pending'
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {  // 配置表名、时间戳、下划线命名、索引
  tableName: 'topic_selections',
  timestamps: true,
  underscored: true,
  indexes: [  // 定义索引，提高查询效率
    {  //为 student_id 和 topic_id 字段创建 联合唯一索引。确保同一学生 (student_id) 不能重复选择同一课题 (topic_id)。若尝试插入重复的 (student_id, topic_id) 组合，数据库会抛出唯一性冲突错误。
      unique: true,
      fields: ['student_id', 'topic_id']
    }
  ]
})

module.exports = TopicSelection 