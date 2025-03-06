require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { sequelize, initDatabase } = require('./config/database')
const path = require('path')
const app = express()

// 路由
const authRouter = require('./routes/auth')
const studentRouter = require('./routes/student')
const teacherRouter = require('./routes/teacher')
const thesisRouter = require('./routes/thesis')
const userRouter = require('./routes/user')

// 基础中间件
app.use(cors())
app.use(express.json())  //这是Express的一个内置中间件，用于解析请求体中的JSON数据。当客户端发送POST或PUT请求，并且请求头Content-Type设置为application/json时，这个中间件会将请求体中的JSON字符串转换为JavaScript对象，并挂载到req.body上，供后续的路由处理函数使用。

// 配置静态文件服务，确保上传目录可以访问
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
// 确保论文目录可以访问
app.use('/uploads/thesis', express.static(path.join(__dirname, 'uploads/thesis')))

// API 路由前缀
app.use('/api/auth', authRouter)
app.use('/api/student', studentRouter)
app.use('/api/teacher', teacherRouter)
app.use('/api/thesis', thesisRouter)
app.use('/api/user', userRouter)

// 请求日志中间件
app.use((req, res, next) => {
  console.log('Request:', {
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body,
    headers: req.headers
  })
  next()
})

// 404 处理
app.use((req, res) => {
  console.log('404 Not Found:', {
    method: req.method,
    path: req.path,
    headers: req.headers
  })
  res.status(404).json({ message: '接口不存在' })
})

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({ message: '服务器内部错误' })
})

// 数据库连接和服务器启动
async function startServer () {
  try {
    // 初始化数据库
    await initDatabase()

    // 验证连接
    await sequelize.authenticate()  //sequelize.authenticate() 是 Sequelize 提供的方法，用于测试数据库连接。如果连接失败，会抛出错误并被 catch 捕获。
    console.log('数据库连接成功')

    // 加载模型关联
    require('./models/index')
    console.log('模型关联加载完成')

    // 修改同步策略，不自动修改表结构
    // alter: true：允许 Sequelize 自动修改现有表（如添加新字段、修改字段类型），但可能导致数据丢失或意外行为。
    // alter: false（默认值）：禁止自动修改表结构，仅创建缺失的表（安全模式）。
    await sequelize.sync({ alter: false })
    console.log('数据库模型同步完成')

    // 启动服务器
    const PORT = process.env.PORT || 3000
    app.listen(PORT, () => {
      console.log(`服务器运行在端口 ${PORT}`)
    })
  } catch (error) {
    console.error('启动失败:', error)
    process.exit(1)
  }
}

// 启动应用
startServer() 