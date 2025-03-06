const User = require('./User')
const Topic = require('./Topic')
const TopicSelection = require('./TopicSelection')
const Thesis = require('./Thesis')

// 设置关联关系
Topic.belongsTo(User, { as: 'teacher', foreignKey: 'teacherId' })
User.hasMany(Topic, { as: 'topics', foreignKey: 'teacherId' })

Topic.belongsToMany(User, {
  through: TopicSelection,   // 中间表模型（记录学生选课信息）,中间表是独立的数据表，专门存储两个模型之间的关联关系。如：张三选了语文和数学，那么中间表中就会有两条记录，一条是张三选了语文，一条是张三选了数学。
  as: 'students',   //as: 'students' 是 Sequelize 提供的配置选项，用于指定关联关系的别名。
  foreignKey: 'topic_id',  //当前模型在中间表中的外键字段名。Topic
  otherKey: 'student_id'  //关联模型在中间表中的外键字段名。User
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