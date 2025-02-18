const express = require('express')
const router = express.Router()
const Thesis = require('../models/Thesis')
const TopicSelection = require('../models/TopicSelection')
const auth = require('../middleware/auth')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const Topic = require('../models/Topic')
const User = require('../models/User')
const { Op } = require('sequelize')

// 确保上传目录存在
const uploadDir = path.join(__dirname, '..', 'uploads/thesis')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    // 保留原始文件扩展名
    const ext = path.extname(file.originalname)
    cb(null, `thesis-${uniqueSuffix}${ext}`)
  }
})

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 允许上传 PDF 和 Word 文件
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',                     // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'  // .docx
  ]

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('只允许上传 PDF 或 Word 文件'), false)
  }
}

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 限制文件大小为10MB
  }
})

// 学生提交论文
router.post('/submit', auth.studentOnly, upload.single('thesis'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请选择要上传的论文文件'
      })
    }

    // 检查是否已选题
    const selection = await TopicSelection.findOne({
      where: {
        student_id: req.user.id,
        status: 'approved'
      }
    })

    if (!selection) {
      return res.status(400).json({
        success: false,
        message: '你还没有通过的选题，无法提交论文'
      })
    }

    // 检查是否已提交过论文
    const existingThesis = await Thesis.findOne({
      where: {
        student_id: req.user.id,
        topic_id: selection.topic_id
      }
    })

    if (existingThesis) {
      // 如果已存在论文，删除旧文件
      if (existingThesis.file_url) {
        const oldFilePath = path.join(__dirname, '..', 'uploads', existingThesis.file_url)
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath)
        }
      }
      // 修改文件路径存储方式
      const fileUrl = `thesis/${path.basename(req.file.path)}`
      // 更新论文记录
      await existingThesis.update({
        file_url: fileUrl,
        status: 'submitted',
        submitted_at: new Date()
      })
      return res.json({
        success: true,
        data: existingThesis,
        message: '论文更新成功'
      })
    }

    // 修改文件路径存储方式，包含 thesis 目录
    const fileUrl = `thesis/${path.basename(req.file.path)}`

    // 创建新的论文记录
    const thesis = await Thesis.create({
      topic_id: selection.topic_id,
      student_id: req.user.id,
      file_url: fileUrl,  // 存储包含 thesis 目录的路径
      status: 'submitted',
      submitted_at: new Date()
    })

    res.status(201).json({
      success: true,
      data: thesis,
      message: '论文提交成功'
    })
  } catch (error) {
    console.error('论文提交错误:', error)
    // 处理 Multer 错误
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: '文件大小不能超过10MB'
        })
      }
      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          message: '无效的文件上传字段'
        })
      }
    }

    res.status(500).json({
      success: false,
      message: error.message || '论文提交失败'
    })
  }
})

// 获取学生的论文信息
router.get('/my-thesis', auth.studentOnly, async (req, res) => {
  try {
    const thesis = await Thesis.findOne({
      where: {
        student_id: req.user.id
      }
    })

    res.json({
      success: true,
      data: thesis
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取论文信息失败'
    })
  }
})

// 教师评分和批注
router.put('/:id/review', auth.teacherOnly, async (req, res) => {
  try {
    const thesis = await Thesis.findByPk(req.params.id)
    if (!thesis) {
      return res.status(404).json({
        success: false,
        message: '论文不存在'
      })
    }

    await thesis.update({
      score: req.body.score,
      feedback: req.body.feedback,
      status: 'reviewed'
    })

    res.json({
      success: true,
      data: thesis,
      message: '评阅完成'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '评阅失败'
    })
  }
})

// 获取教师的论文列表
router.get('/teacher/list', auth.teacherOnly, async (req, res) => {
  try {
    const theses = await Thesis.findAll({
      include: [
        {
          model: Topic,
          as: 'topic',
          where: { teacherId: req.user.id },
          attributes: ['title']
        },
        {
          model: User,
          as: 'student',
          attributes: ['name', 'student_id']
        }
      ],
      order: [['submitted_at', 'DESC']]
    })

    res.json({
      success: true,
      data: theses
    })
  } catch (error) {
    console.error('获取论文列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取论文列表失败'
    })
  }
})

// 学生下载自己的论文或教师下载学生论文
router.get('/download/:id', auth.authenticate, async (req, res) => {
  try {
    const thesis = await Thesis.findOne({
      where: {
        id: req.params.id,
        [Op.or]: [
          { student_id: req.user.id },
          { '$topic.teacher_id$': req.user.id }
        ]
      },
      include: [{
        model: Topic,
        as: 'topic'
      }, {
        model: User,
        as: 'student'
      }]
    })

    if (!thesis) {
      return res.status(404).json({
        success: false,
        message: '论文不存在或无权访问'
      })
    }

    const filePath = path.join(__dirname, '..', 'uploads', thesis.file_url)
    console.log('Attempting to download file:', filePath)

    if (!fs.existsSync(filePath)) {
      console.error('文件不存在:', filePath)
      return res.status(404).json({
        success: false,
        message: '论文文件不存在'
      })
    }

    // 根据文件扩展名设置正确的 Content-Type
    const ext = path.extname(filePath).toLowerCase()
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }
    const contentType = mimeTypes[ext] || 'application/octet-stream'

    // 使用 encodeURIComponent 处理文件名中的中文字符
    const fileName = encodeURIComponent(`${thesis.student.name}-thesis${ext}`)

    // 设置响应头，强制下载
    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${fileName}`)

    // 使用文件流发送文件
    const fileStream = fs.createReadStream(filePath)
    fileStream.pipe(res)

    // 处理流错误
    fileStream.on('error', (error) => {
      console.error('文件流错误:', error)
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: '下载失败'
        })
      }
    })
  } catch (error) {
    console.error('下载论文失败:', error)
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: '下载论文失败'
      })
    }
  }
})

// 添加或更新批注
router.post('/:id/annotations', auth.teacherOnly, async (req, res) => {
  try {
    const thesis = await Thesis.findOne({
      where: {
        id: req.params.id
      },
      include: [{
        model: Topic,
        as: 'topic',
        where: { teacherId: req.user.id }
      }]
    })

    if (!thesis) {
      return res.status(404).json({
        success: false,
        message: '论文不存在或无权访问'
      })
    }

    // 更新批注
    await thesis.update({
      annotations: req.body.annotations
    })

    res.json({
      success: true,
      message: '批注保存成功',
      data: thesis
    })
  } catch (error) {
    console.error('保存批注失败:', error)
    res.status(500).json({
      success: false,
      message: '保存批注失败'
    })
  }
})

module.exports = router