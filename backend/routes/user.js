const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const User = require('../models/User')
const bcrypt = require('bcryptjs')

// 获取用户信息
router.get('/profile', auth.authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    res.json({
      success: true,
      data: user
    })
  } catch (error) {
    console.error('获取用户信息失败:', error)
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    })
  }
})

// 更新用户信息
router.put('/profile', auth.authenticate, async (req, res) => {
  try {
    const {
      name,
      email,
      department,
      bio,
      title,
      research_area,
      office_location,
      password,
      oldPassword
    } = req.body

    const user = await User.findByPk(req.user.id)

    // 如果要更新密码，先验证原密码
    if (password) {
      if (!oldPassword) {
        return res.status(400).json({
          success: false,
          message: '请提供原密码'
        })
      }

      // 验证原密码是否正确
      const isValidPassword = await user.validatePassword(oldPassword)
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: '原密码错误'
        })
      }

      // 检查新密码是否与原密码相同
      const isSamePassword = await user.validatePassword(password)
      if (isSamePassword) {
        return res.status(400).json({
          success: false,
          message: '新密码不能与原密码相同'
        })
      }
    }

    const updateData = {
      name,
      email,
      department,
      bio,
      title,
      research_area,
      office_location
    }

    // 如果提供了新密码，则更新密码
    if (password) {
      updateData.password = password // User 模型中的 password 字段已经配置了自动哈希
    }

    // 移除未定义的字段
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key]
      }
    })

    await user.update(updateData)

    const updatedUser = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    })

    res.json({
      success: true,
      message: '个人信息更新成功',
      data: updatedUser
    })
  } catch (error) {
    console.error('更新用户信息失败:', error)
    res.status(500).json({
      success: false,
      message: '更新用户信息失败'
    })
  }
})

// 获取教师列表
router.get('/teachers', async (req, res) => {
  try {
    const teachers = await User.findAll({
      where: { role: 'teacher' },
      attributes: {
        exclude: ['password', 'student_id']
      }
    })

    res.json({
      success: true,
      data: teachers
    })
  } catch (error) {
    console.error('获取教师列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取教师列表失败'
    })
  }
})

// 获取教师详细信息
router.get('/teachers/:id', async (req, res) => {
  try {
    const teacher = await User.findOne({
      where: {
        id: req.params.id,
        role: 'teacher'
      },
      attributes: {
        exclude: ['password', 'student_id']    //排除敏感或不必要字段不返回 password（安全考虑）和 student_id（教师无需学生ID）。
      }
    })

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: '教师不存在'
      })
    }

    res.json({
      success: true,
      data: teacher
    })
  } catch (error) {
    console.error('获取教师信息失败:', error)
    res.status(500).json({
      success: false,
      message: '获取教师信息失败'
    })
  }
})

module.exports = router 