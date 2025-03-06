const express = require('express')
const router = express.Router()
const User = require('../models/User')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

// 路由调试日志
router.use((req, res, next) => {
  console.log('Auth Route Accessed:', {
    method: req.method,
    path: req.path,
    url: req.url,
    baseUrl: req.baseUrl,
    originalUrl: req.originalUrl,
    body: req.body
  })
  next()
})

// 测试路由
router.get('/test', (req, res) => {
  res.json({ message: 'Auth route is working' })
})

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { username, password, role } = req.body
    console.log('Login attempt:', { username, role })

    const user = await User.findOne({ where: { username } })
    if (!user) {
      console.log('User not found:', username)
      return res.status(401).json({ message: '用户名或密码错误' })
    }

    // 验证用户角色是否匹配
    if (user.role !== role) {
      console.log('Role mismatch:', { expected: role, actual: user.role })
      return res.status(403).json({
        message: `请选择正确的身份登录${user.role === 'student' ? '（学生）' : '（教师）'}`
      })
    }

    const isValidPassword = await user.validatePassword(password)
    if (!isValidPassword) {
      console.log('Invalid password for user:', username)
      return res.status(401).json({ message: '用户名或密码错误' })
    }

    const token = jwt.sign(
      {  //Payload（载荷）：包含要传递的数据。
        id: user.id,
        role: user.role,
        username: user.username,
        name: user.name,
        student_id: user.student_id,
        department: user.department
      },
      process.env.JWT_SECRET, // Secret Key签名密钥，从环境变量中获取
      { expiresIn: '24h' } // Options（可选参数）  如过期时间，24小时后过期
    )

    console.log('Login successful:', username)
    res.json({         //将 JavaScript 对象转换为 JSON 格式，并通过 HTTP 响应发送给客户端。
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        student_id: user.student_id,
        department: user.department
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: '服务器错误' })
  }
})

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { username, password, name, role, student_id, teacher_id, department } = req.body
    console.log('Register attempt:', { username, role })

    // 检查用户名是否已存在
    const existingUser = await User.findOne({ where: { username } })
    if (existingUser) {
      return res.status(400).json({ message: '用户名已存在' })
    }

    // 根据角色验证必填字段
    if (role === 'student') {
      if (!student_id) {
        return res.status(400).json({ message: '学生必须填写学号' })
      }
      const existingStudent = await User.findOne({ where: { student_id } })
      if (existingStudent) {
        return res.status(400).json({ message: '学号已存在' })
      }
    } else if (role === 'teacher') {
      if (!teacher_id) {
        return res.status(400).json({ message: '教师必须填写工号' })
      }
      const existingTeacher = await User.findOne({ where: { teacher_id } })
      if (existingTeacher) {
        return res.status(400).json({ message: '教师工号已存在' })
      }
    }

    // 创建用户
    const userData = {
      username,
      password,
      name,
      role,
      department
    }

    // 根据角色添加对应字段
    if (role === 'student') {
      userData.student_id = student_id
    } else if (role === 'teacher') {
      userData.teacher_id = teacher_id
    }

    const user = await User.create(userData)  //在数据库中创建一条新用户记录

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        username: user.username,
        name: user.name,
        student_id: user.student_id,
        department: user.department
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.status(201).json({
      message: '注册成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        student_id: user.student_id,
        department: user.department
      }
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(400).json({ message: error.message || '注册失败' })
  }
})

module.exports = router 