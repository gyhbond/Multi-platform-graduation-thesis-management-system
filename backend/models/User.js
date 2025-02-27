const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')
const bcrypt = require('bcryptjs')

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,  // 主键
    autoIncrement: true // 自动递增
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {  //长度验证
      len: [3, 50]
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    set (value) {   //使用 bcrypt 对密码进行哈希处理，并存储哈希后的密码。
      const hashedPassword = bcrypt.hashSync(value, 10)   // 使用 bcrypt 对密码进行哈希处理，并存储哈希后的密码,10是哈希的次数。
      this.setDataValue('password', hashedPassword)
    }
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('student', 'teacher', 'admin'),
    defaultValue: 'student'
  },
  student_id: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: true
  },
  teacher_id: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: true
  },
  department: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  title: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  research_area: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      isEmail: true  //验证邮箱格式
    }
  },
  office_location: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  gender: {
    type: DataTypes.ENUM('male', 'female'),
    allowNull: true,
    comment: '性别'
  },
  major: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '专业'
  },
  political_status: {
    type: DataTypes.ENUM('群众', '共青团员', '中共党员'),
    allowNull: true,
    comment: '政治面貌'
  }
}, {
  tableName: 'users',  //表名
  timestamps: true,  //是否启用时间戳
  underscored: true,  //是否使用下划线命名法
  indexes: [
    {
      unique: true,  //唯一索引
      fields: ['username']  //索引字段
    }
  ]
})

// 添加实例方法用于验证密码
User.prototype.validatePassword = function (password) {
  return bcrypt.compareSync(password, this.password)  //比较密码
}

module.exports = User