const express = require('express')
const router = express.Router()
const Topic = require('../models/Topic')
const User = require('../models/User')
const auth = require('../middleware/auth')
const { isTeacher, isStudent } = require('../middleware/role')
const { Op } = require('sequelize')
const sequelize = require('../config/database')
const TopicSelection = require('../models/TopicSelection')

// 教师获取自己的课题列表
router.get('/topics', auth, isTeacher, async (req, res) => {
  try {
    const topics = await Topic.findAll({
      where: { teacherId: req.user.id },
      include: [{
        model: User,
        as: 'teacher',
        attributes: ['name']
      }]
    })

    const formattedTopics = topics.map(topic => ({
      id: topic.id,
      title: topic.title,
      description: topic.description,
      maxStudents: topic.maxStudents,
      selectedCount: topic.selectedCount,
      status: topic.status,
      deadline: topic.deadline
    }))

    res.json({ data: formattedTopics })
  } catch (error) {
    res.status(500).json({ message: '服务器错误' })
  }
})

// 教师创建课题
router.post('/topics', auth, isTeacher, async (req, res) => {
  try {
    const topic = await Topic.create({
      ...req.body,
      teacherId: req.user.id
    })
    res.status(201).json({ message: '创建成功', data: topic })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

// 教师更新课题
router.put('/topics/:id', auth, isTeacher, async (req, res) => {
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
    res.json({ message: '更新成功', data: topic })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

// 教师更新课题状态
router.put('/topics/:id/status', auth, isTeacher, async (req, res) => {
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

    await topic.update({ status: req.body.status })
    res.json({ message: '更新成功', data: topic })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

// 学生获取可选课题列表
router.get('/topics/available', auth, isStudent, async (req, res) => {
  try {
    const topics = await Topic.findAll({
      where: {
        status: 'open',
        deadline: { [Op.gt]: new Date() },
        selectedCount: { [Op.lt]: sequelize.col('maxStudents') }
      },
      include: [{
        model: User,
        as: 'teacher',
        attributes: ['name']
      }]
    })

    const formattedTopics = topics.map(topic => ({
      id: topic.id,
      title: topic.title,
      description: topic.description,
      requirements: topic.requirements,
      teacher: topic.teacher.name,
      maxStudents: topic.maxStudents,
      selectedCount: topic.selectedCount,
      deadline: topic.deadline
    }))

    res.json({ data: formattedTopics })
  } catch (error) {
    res.status(500).json({ message: '服务器错误' })
  }
})

// 学生选择课题
router.post('/topics/select', auth, isStudent, async (req, res) => {
  try {
    const topic = await Topic.findByPk(req.body.topicId)
    if (!topic) {
      return res.status(404).json({ message: '课题不存在' })
    }

    if (topic.status !== 'open') {
      return res.status(400).json({ message: '该课题已关闭' })
    }

    if (topic.deadline < new Date()) {
      return res.status(400).json({ message: '选题已截止' })
    }

    if (topic.selectedCount >= topic.maxStudents) {
      return res.status(400).json({ message: '该课题已满' })
    }

    // 检查学生是否已经选择了其他课题
    const existingSelection = await TopicSelection.findOne({
      where: { studentId: req.user.id }
    })

    if (existingSelection) {
      return res.status(400).json({ message: '你已经选择了其他课题' })
    }

    // 创建选题记录并更新选题人数
    await sequelize.transaction(async (t) => {
      await TopicSelection.create({
        topicId: topic.id,
        studentId: req.user.id
      }, { transaction: t })

      await topic.increment('selectedCount', { transaction: t })
    })

    res.json({ message: '选题成功' })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

// 学生获取自己的选题
router.get('/topics/my-selection', auth, isStudent, async (req, res) => {
  try {
    const selection = await TopicSelection.findOne({
      where: { studentId: req.user.id },
      include: [{
        model: Topic,
        include: [{
          model: User,
          as: 'teacher',
          attributes: ['name']
        }]
      }]
    })

    if (!selection) {
      return res.json({ data: null })
    }

    const topic = selection.Topic
    const formattedTopic = {
      id: topic.id,
      title: topic.title,
      description: topic.description,
      requirements: topic.requirements,
      teacher: topic.teacher.name,
      deadline: topic.deadline,
      status: topic.status
    }

    res.json({ data: formattedTopic })
  } catch (error) {
    res.status(500).json({ message: '服务器错误' })
  }
})

module.exports = router 