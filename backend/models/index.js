const User = require('./User')
const Topic = require('./Topic')
const TopicSelection = require('./TopicSelection')
const Thesis = require('./Thesis')

// 设置关联关系
Topic.belongsTo(User, { as: 'teacher', foreignKey: 'teacherId' })
User.hasMany(Topic, { as: 'topics', foreignKey: 'teacherId' })

Topic.belongsToMany(User, {
  through: TopicSelection,
  as: 'students',
  foreignKey: 'topic_id',
  otherKey: 'student_id'
})

User.belongsToMany(Topic, {
  through: TopicSelection,
  foreignKey: 'student_id',
  otherKey: 'topic_id'
})

// 添加论文相关的关联关系
Thesis.belongsTo(Topic, {
  foreignKey: 'topic_id',
  as: 'topic'
})

Thesis.belongsTo(User, {
  foreignKey: 'student_id',
  as: 'student'
})

Topic.hasOne(Thesis, {
  foreignKey: 'topic_id'
})

User.hasOne(Thesis, {
  foreignKey: 'student_id'
})

module.exports = {
  User,
  Topic,
  TopicSelection,
  Thesis
} 