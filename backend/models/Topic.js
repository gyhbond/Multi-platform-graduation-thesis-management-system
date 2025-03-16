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
// 作用：定义一个 Topic 可以拥有多个 TopicSelection。
// 外键位置：在 TopicSelection 表中创建 topic_id 字段，指向 Topic 的主键（默认是 id）。
// 查询能力：允许通过 include 查询某个 Topic 时，自动加载其关联的所有 TopicSelection 记录。
Topic.hasMany(TopicSelection, { foreignKey: 'topic_id' })
// 作用：定义一个 TopicSelection 属于一个 Topic。
// 外键位置：明确 TopicSelection 表中的 topic_id 是关联到 Topic 的外键。
// 查询能力：允许通过 include 查询 TopicSelection 时，自动加载其关联的 Topic。
TopicSelection.belongsTo(Topic, { foreignKey: 'topic_id' })
// 为什么需要两者同时定义？
// 双向关联：Sequelize 需要双方模型都声明关联关系，以确保查询时能正确加载数据（如 include 双向生效）。
// 明确外键：虽然 Sequelize 可以自动推断外键名，但显式声明 foreignKey: 'topic_id' 能避免命名歧义，确保双方使用同一个外键字段。

// 在Topic.hasMany(TopicSelection)中，外键应该位于TopicSelection模型中，也就是目标模型。因此，这里的foreignKey: 'topic_id'是在指定TopicSelection表中的外键字段名为topic_id，指向Topic的主键。
// 而在TopicSelection.belongsTo(Topic)中，同样需要指定外键的位置。通常，belongsTo关联中外键是放在源模型，也就是这里的TopicSelection，因此这里的foreignKey同样指向TopicSelection表中的topic_id字段。
// 所以，这两个配置实际上是相同的，都是告诉Sequelize在TopicSelection表中使用topic_id作为外键。它们共同锁定同一个外键 topic_id，确保双向查询的可靠性。

module.exports = Topic 