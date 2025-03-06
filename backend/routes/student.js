const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const Topic = require('../models/Topic')
const User = require('../models/User')
const { Op, col } = require('sequelize')
const { sequelize } = require('../config/database')
const TopicSelection = require('../models/TopicSelection')

// 获取可选课题列表  中间件: auth.studentOnly 确保只有学生角色的用户能访问此接口。 先执行 auth.studentOnly，再执行后面的路由处理函数。
router.get('/topics/available', auth.studentOnly, async (req, res) => {
  try {
    const topics = await Topic.findAll({
      where: {
        status: 'open',
        selectedCount: {
          [Op.lt]: sequelize.col('max_students')
        }
      },
      include: [{
        model: User,
        as: 'teacher',
        attributes: ['id', 'name', 'title', 'research_area', 'department'],
        required: true // 确保只返回有教师信息的课题
      }]
    })

    // 格式化返回数据，确保教师信息完整
    const formattedTopics = topics.map(topic => {
      const plainTopic = topic.get({ plain: true })
      return {
        ...plainTopic,
        teacher: {
          id: plainTopic.teacher.id,
          name: plainTopic.teacher.name,
          title: plainTopic.teacher.title,
          research_area: plainTopic.teacher.research_area,
          department: plainTopic.teacher.department
        }
      }
    })

    res.json({
      success: true,
      data: formattedTopics
    })
  } catch (error) {
    console.error('获取可选课题失败:', error)
    res.status(500).json({
      success: false,
      message: '获取可选课题失败'
    })
  }
})

// 获取已选课题
router.get('/topics/selected', auth.studentOnly, async (req, res) => {
  try {
    const selectedTopics = await Topic.findAll({
      include: [{
        model: User,
        as: 'students',
        where: { id: req.user.id },
        through: { attributes: ['status'] }
      }, {
        model: User,
        as: 'teacher',
        attributes: ['id', 'name', 'department']
      }]
    })

    res.json({
      success: true,
      data: selectedTopics
    })
  } catch (error) {
    console.error('获取已选课题失败:', error)
    res.status(500).json({
      success: false,
      message: '获取已选课题失败'
    })
  }
})

// 选择课题
router.post('/topics/select', auth.studentOnly, async (req, res) => {
  try {
    const { topicId } = req.body

    // 检查课题是否存在且开放
    const topic = await Topic.findOne({
      where: {
        id: topicId,
        status: 'open'
      }
    })

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: '课题不存在或已关闭'
      })
    }

    // 检查是否已达到最大选题人数
    if (topic.selectedCount >= topic.maxStudents) {
      return res.status(400).json({
        success: false,
        message: '该课题已达到最大选题人数'
      })
    }

    // 检查学生是否已有选题 - 添加日志调试
    console.log('Checking existing selection for student:', req.user.id)
    const existingSelection = await TopicSelection.findOne({
      where: {
        student_id: req.user.id,
        status: {
          [Op.in]: ['pending', 'approved']
        }
      }
    })

    // 添加日志输出查询结果
    console.log('Existing selection:', existingSelection)

    if (existingSelection) {
      return res.status(400).json({
        success: false,
        message: '你已经选择了课题，请等待审核或选择其他课题'
      })
    }

    // 创建选题记录
    const selection = await TopicSelection.create({
      topic_id: topicId,
      student_id: req.user.id,
      status: 'pending'
    })

    // 更新课题选择人数
    await topic.increment('selectedCount')

    // 添加日志输出新创建的选题
    console.log('New selection created:', selection)

    res.json({
      success: true,
      message: '选题申请已提交，请等待教师审核',
      data: selection
    })
  } catch (error) {
    console.error('选题失败:', error)
    res.status(500).json({
      success: false,
      message: '选题失败: ' + error.message
    })
  }
})

// 获取学生的选题信息
router.get('/topics/my-selection', auth.studentOnly, async (req, res) => {
  try {
    const selection = await TopicSelection.findOne({
      where: {
        student_id: req.user.id
      },
      include: [{
        model: Topic,
        include: [{
          model: User,
          as: 'teacher',
          attributes: ['name', 'title']
        }]
      }]
    })

    res.json({
      success: true,
      data: selection
    })
  } catch (error) {
    console.error('获取选题信息失败:', error)
    res.status(500).json({
      success: false,
      message: '获取选题信息失败'
    })
  }
})

// 取消选题
router.delete('/topics/cancel', auth.studentOnly, async (req, res) => {
  try {
    const selection = await TopicSelection.findOne({
      where: {
        student_id: req.user.id,
        status: {
          [Op.in]: ['pending', 'approved']
        }
      },
      include: [{
        model: Topic,
        attributes: ['id', 'title', 'selectedCount']
      }]
    })

    if (!selection) {
      return res.status(404).json({
        success: false,
        message: '未找到选题记录'
      })
    }

    // 开启事务
    const transaction = await sequelize.transaction()

    try {
      // 减少课题的已选人数
      await Topic.decrement('selectedCount', {
        where: { id: selection.topic_id },
        transaction
      })

      // 删除选题记录
      await selection.destroy({ transaction })

      await transaction.commit()

      res.json({
        success: true,
        message: '取消选题成功'
      })
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  } catch (error) {
    console.error('取消选题失败:', error)
    res.status(500).json({
      success: false,
      message: '取消选题失败'
    })
  }
})

// 添加一个新的路由来检查选题状态
router.get('/topics/selection-status', auth.studentOnly, async (req, res) => {
  try {
    const selection = await TopicSelection.findOne({
      where: {
        student_id: req.user.id,
        status: {
          [Op.in]: ['pending', 'approved']
        }
      },
      include: [{
        model: Topic,
        attributes: ['title']
      }]
    })

    res.json({
      success: true,
      data: selection
    })
  } catch (error) {
    console.error('获取选题状态失败:', error)
    res.status(500).json({
      success: false,
      message: '获取选题状态失败'
    })
  }
})

module.exports = router 