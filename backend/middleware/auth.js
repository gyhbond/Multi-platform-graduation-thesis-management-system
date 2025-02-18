const jwt = require('jsonwebtoken')
const User = require('../models/User')

// 通用身份验证中间件
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '未提供身份验证令牌'
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findByPk(decoded.id)
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      })
    }

    req.user = user
    next()
  } catch (error) {
    console.error('身份验证失败:', error)
    res.status(401).json({
      success: false,
      message: '身份验证失败'
    })
  }
}

// 学生权限中间件
const studentOnly = async (req, res, next) => {
  try {
    await authenticate(req, res, () => {
      if (req.user.role !== 'student') {
        return res.status(403).json({
          success: false,
          message: '需要学生权限'
        })
      }
      next()
    })
  } catch (error) {
    next(error)
  }
}

// 教师权限中间件
const teacherOnly = async (req, res, next) => {
  try {
    await authenticate(req, res, () => {
      if (req.user.role !== 'teacher') {
        return res.status(403).json({
          success: false,
          message: '需要教师权限'
        })
      }
      next()
    })
  } catch (error) {
    next(error)
  }
}

// 管理员权限中间件
const adminOnly = async (req, res, next) => {
  try {
    await authenticate(req, res, () => {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: '需要管理员权限'
        })
      }
      next()
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  authenticate,
  studentOnly,
  teacherOnly,
  adminOnly
}