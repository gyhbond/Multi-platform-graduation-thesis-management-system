const { Sequelize } = require('sequelize')
require('dotenv').config()

const sequelize = new Sequelize(
  process.env.DB_NAME || 'thesis_system',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || 'your_password',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: console.log,
    define: {
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
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