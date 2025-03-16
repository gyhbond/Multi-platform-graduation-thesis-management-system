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
    const topics = await Topic.findAll({  // 异步查询所有符合条件的Topic模型记录
      where: {
        status: 'open',
        selectedCount: {
          //[Op.lt] 表示小于操作符（需从Sequelize导入Op),sequelize.col('max_students') 表示直接引用数据库表的列，而不是字面量，max_students 是数据库表中的字段名column
          [Op.lt]: sequelize.col('max_students')  // 使用<操作符比较：已选人数 < 最大学生数
        }
      },
      include: [{  //include 配置表示在查询时 关联加载另一个模型的数据，并附带一些过滤和字段控制。
        model: User,   //关联加载User模型数据
        as: 'teacher', //别名，用于在查询结果中引用关联的User数据
        attributes: ['id', 'name', 'title', 'research_area', 'department'], //指定返回的字段，只返回这些字段的数据
        //required: true ➔ 生成 INNER JOIN 只返回父模型（主表）与关联模型（关联表）存在匹配关系的记录,如果一个课题的 teacher_id 为 NULL，或关联的教师记录已被删除，该课题 不会出现在结果中
        // required: false ➔ 生成 LEFT OUTER JOIN 保留父模型所有记录，即使关联模型没有匹配数据
        required: true

      }]
    })

    // 格式化返回数据，确保教师信息完整
    const formattedTopics = topics.map(topic => {
      const plainTopic = topic.get({ plain: true })  // 将 Sequelize 对象转换为普通 JavaScript 对象，便于后续处理转换前：包含 Sequelize 特有的方法（如 save(), update() 等）,转换后：仅保留数据属性
      return {
        ...plainTopic,  // 展开操作符，将 plainTopic 对象的属性展开并合并到新对象中
        teacher: {   // 显式指定 teacher 对象需要保留的字段
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
        model: User,     //通过 include 实现多表联合查询,关联的students会返回一个数组
        as: 'students',
        where: { id: req.user.id },
        through: { attributes: ['status'] }  // 通过中间表获取额外字段（多对多关系特有）
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
          [Op.in]: ['pending', 'approved']  //筛选出 status 字段值为 pending 或 approved 的记录
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
    //selection 变量将包含新创建记录的详细信息（如自动生成的 id、createdAt 时间戳等）。
    const selection = await TopicSelection.create({
      topic_id: topicId,
      student_id: req.user.id,
      status: 'pending'
    })

    // 更新课题选择人数
    await topic.increment('selectedCount') // 使用 increment 方法，将 selectedCount 字段值增加 1

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