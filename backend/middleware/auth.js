const jwt = require('jsonwebtoken')
const User = require('../models/User')

// 通用身份验证中间件
const authenticate = async (req, res, next) => {
  try {
    // 首先尝试从Authorization头获取Token
    let token = req.headers.authorization?.split(' ')[1]

    // 如果没有在头中找到，尝试从查询参数中获取
    if (!token && req.query.token) {
      token = req.query.token
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '未提供身份验证令牌'
      })
    }

    // 使用环境变量中的密钥解密令牌，确保未被篡改。verify() 方法会返回解码后的用户信息。成功时: 返回一个 JavaScript 对象，包含 JWT 令牌中存储的所有声明（claims）。失败时: 抛出错误（如令牌无效、过期、签名不匹配等），需通过 try/catch 捕获。
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    // 通过模型定义的主键字段（默认是 id）查询唯一记录。
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