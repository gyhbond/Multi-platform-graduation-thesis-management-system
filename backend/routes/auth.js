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

    console.log('Login successful:', username)
    res.json({
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
    const { username, password, name, role, student_id, department } = req.body
    console.log('Register attempt:', { username, role })

    // 检查用户名是否已存在
    const existingUser = await User.findOne({ where: { username } })
    if (existingUser) {
      return res.status(400).json({ message: '用户名已存在' })
    }

    // 如果是学生，检查学号是否已存在且必填
    if (role === 'student') {
      if (!student_id) {
        return res.status(400).json({ message: '学生必须填写学号' })
      }
      const existingStudent = await User.findOne({ where: { student_id } })
      if (existingStudent) {
        return res.status(400).json({ message: '学号已存在' })
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

    // 只有学生才添加学号字段
    if (role === 'student') {
      userData.student_id = student_id
    }

    const user = await User.create(userData)

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