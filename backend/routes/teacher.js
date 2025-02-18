const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const Topic = require('../models/Topic')
const User = require('../models/User')
const TopicSelection = require('../models/TopicSelection')

// 获取教师的课题列表
router.get('/topics', auth.teacherOnly, async (req, res) => {
  try {
    const topics = await Topic.findAll({
      where: { teacherId: req.user.id },
      include: [{
        model: User,
        as: 'students',
        attributes: ['id', 'name', 'student_id'],
        through: {
          model: TopicSelection,
          attributes: ['status']
        }
      }],
      order: [['created_at', 'DESC']]
    })

    // 格式化返回数据
    const formattedTopics = topics.map(topic => ({
      id: topic.id,
      title: topic.title,
      description: topic.description,
      requirements: topic.requirements,
      maxStudents: topic.maxStudents,
      selectedCount: topic.selectedCount,
      status: topic.status,
      deadline: topic.deadline,
      students: topic.students?.map(student => ({
        id: student.id,
        name: student.name,
        studentId: student.student_id,
        selectionStatus: student.TopicSelection.status
      })) || []
    }))

    res.json({
      success: true,
      data: formattedTopics
    })
  } catch (error) {
    console.error('获取课题列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取课题列表失败'
    })
  }
})

// 创建新课题
router.post('/topics', auth.teacherOnly, async (req, res) => {
  try {
    const topic = await Topic.create({
      title: req.body.title,
      description: req.body.description,
      requirements: req.body.requirements,
      maxStudents: req.body.maxStudents,
      teacherId: req.user.id,
      deadline: req.body.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 如果没有提供截止日期，默认30天后
      status: 'open'
    })
    res.status(201).json(topic)
  } catch (error) {
    console.error('创建课题失败:', error)
    res.status(500).json({ message: '创建课题失败' })
  }
})

// 更新课题
router.put('/topics/:id', auth.teacherOnly, async (req, res) => {
  try {
    const topic = await Topic.findOne({
      where: {
        id: req.params.id,
        teacherId: req.user.id
      }
    })

    if (!topic) {
      return res.status(404).json({ message: '课题不存在' })
    }

    await topic.update(req.body)
    res.json(topic)
  } catch (error) {
    console.error('更新课题失败:', error)
    res.status(500).json({ message: '更新课题失败' })
  }
})

// 更新课题状态
router.put('/topics/:id/status', auth.teacherOnly, async (req, res) => {
  try {
    const topic = await Topic.findOne({
      where: {
        id: req.params.id,
        teacherId: req.user.id
      }
    })

    if (!topic) {
      return res.status(404).json({ message: '课题不存在' })
    }

    await topic.update({
      status: req.body.status
    })

    res.json({
      message: '课题状态更新成功',
      topic
    })
  } catch (error) {
    console.error('更新课题状态失败:', error)
    res.status(500).json({ message: '更新课题状态失败' })
  }
})

// 处理学生选题申请
router.put('/selections/:id', auth.teacherOnly, async (req, res) => {
  try {
    const selection = await TopicSelection.findOne({
      where: {
        id: req.params.id
      },
      include: [{
        model: Topic,
        where: {
          teacherId: req.user.id
        }
      }]
    })

    if (!selection) {
      return res.status(404).json({ message: '选题记录不存在' })
    }

    await selection.update({
      status: req.body.status,
      feedback: req.body.feedback
    })

    res.json(selection)
  } catch (error) {
    console.error('处理选题申请失败:', error)
    res.status(500).json({ message: '处理选题申请失败' })
  }
})

// 获取单个课题详情
router.get('/topics/:id', auth.teacherOnly, async (req, res) => {
  try {
    const topic = await Topic.findOne({
      where: {
        id: req.params.id,
        teacherId: req.user.id
      },
      include: [{
        model: User,
        as: 'students',
        attributes: ['id', 'name', ['student_id', 'studentId']],
        through: {
          model: TopicSelection,
          attributes: ['status']
        }
      }]
    })

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: '课题不存在'
      })
    }

    // 格式化返回数据
    const formattedTopic = {
      id: topic.id,
      title: topic.title,
      description: topic.description,
      requirements: topic.requirements,
      maxStudents: topic.maxStudents,
      selectedCount: topic.selectedCount,
      status: topic.status,
      deadline: topic.deadline,
      students: topic.students?.map(student => ({
        id: student.id,
        name: student.name,
        studentId: student.get('studentId'),
        selectionStatus: student.TopicSelection.status
      }))
    }

    res.json({
      success: true,
      data: formattedTopic
    })
  } catch (error) {
    console.error('获取课题详情失败:', error)
    res.status(500).json({
      success: false,
      message: '获取课题详情失败',
      error: error.message
    })
  }
})

// 审核学生选题
router.put('/topics/:topicId/selections/:studentId', auth.teacherOnly, async (req, res) => {
  try {
    const { topicId, studentId } = req.params
    const { status } = req.body

    // 检查课题是否属于该教师
    const topic = await Topic.findOne({
      where: {
        id: topicId,
        teacherId: req.user.id
      }
    })

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: '课题不存在或无权操作'
      })
    }

    // 更新选题状态
    const selection = await TopicSelection.findOne({
      where: {
        topic_id: topicId,
        student_id: studentId
      }
    })

    if (!selection) {
      return res.status(404).json({
        success: false,
        message: '选题记录不存在'
      })
    }

    await selection.update({ status })

    res.json({
      success: true,
      message: '更新成功'
    })
  } catch (error) {
    console.error('更新选题状态失败:', error)
    res.status(500).json({
      success: false,
      message: '更新选题状态失败'
    })
  }
})

module.exports = router 