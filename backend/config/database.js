const { Sequelize } = require('sequelize') // 引入 Sequelize 库，用于与数据库进行交互
require('dotenv').config()

const sequelize = new Sequelize(
  // 数据库名称，从环境变量中获取，如果没有设置则使用默认值 'thesis_system'
  process.env.DB_NAME || 'thesis_system',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || 'your_password',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql', // 使用的数据库类型，这里指定为 MySQL
    logging: console.log, // 是否启用日志记录，这里使用 console.log 输出日志
    define: {
      underscored: true, // 是否使用下划线命名法，例如 created_at 而不是 createdAt
      timestamps: true, // 是否启用时间戳，自动添加 createdAt 和 updatedAt 字段
      createdAt: 'created_at', // 创建时间字段名
      updatedAt: 'updated_at' // 更新时间字段名
    }
  }
)

// 初始化数据库
async function initDatabase () {
  try {
    // 创建数据库
    await sequelize.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'thesis_system'}`)
    console.log('数据库初始化成功')
  } catch (error) {
    console.error('数据库初始化失败:', error)
    throw error
  }
}

module.exports = {
  sequelize,
  initDatabase
} 