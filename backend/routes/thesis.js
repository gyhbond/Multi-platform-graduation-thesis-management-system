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

// 确保上传目录存在，如果目录不存在，则创建目录
// path.join()：Node.js 的 path 模块方法，用于拼接路径片段。
// __dirname：Node.js 全局变量，表示当前执行脚本所在的目录路径（例如：/your-project/src / utils）。
// '..'：表示返回上一级目录（即从 src / utils 退到 src）。
// 'uploads/thesis'：在上一级目录下创建 uploads / thesis 子目录。
// 最终路径示例： 假设当前文件在 / your - project / src / utils / upload.js，则 uploadDir 最终路径为： /your-project/uploads / thesis。
const uploadDir = path.join(__dirname, '..', 'uploads/thesis')
//fs.existsSync()：Node.js 文件系统（fs 模块）的同步方法，检查目录是否存在。
//fs.mkdirSync()：Node.js 文件系统（fs 模块）的同步方法，创建目录。
//{ recursive: true }：关键选项，表示递归创建所有不存在的父目录。例如：
// 如果 uploads 目录不存在，会先创建 uploads，再在内部创建 thesis。
// 如果不设置 recursive: true，当父目录（如 uploads）不存在时，会直接报错。
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// 配置文件上传
const storage = multer.diskStorage({  //multer.diskStorage 是 multer 提供的一个用于配置文件存储的选项
  // - req: 当前 HTTP 请求对象（可以获取请求头、用户信息等）
  // - file: 上传的文件信息（包含原始文件名、类型等）
  // - cb: 回调函数（必须调用它来告诉 Multer 最终存储路径）
  destination: function (req, file, cb) {  //destination 是文件存储的目标目录，cb 是回调函数，用于返回存储路径
    cb(null, uploadDir) // 第一个参数传错误（没有错误就传 null），第二个传   存储路径
  },
  //文件名生成策略
  filename: function (req, file, cb) {
    //Date.now()：获取当前时间戳（以毫秒为单位）
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    // 保留原始文件扩展名,path.extname()：Node.js 的 path 模块方法，用于获取文件扩展名,file.originalname 是上传文件的原始文件名
    const ext = path.extname(file.originalname)
    //cb 是回调函数，用于返回生成的文件名,第一个参数传错误（没有错误就传 null），第二个传 文件名 (拓展名前面有点)
    cb(null, `thesis-${uniqueSuffix}${ext}`)
  }
})

// 文件过滤器是一个函数，用于确定哪些文件可以上传
const fileFilter = (req, file, cb) => {
  // 允许上传 PDF 和 Word 文件
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',                     // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'  // .docx，注意：这个是 Open XML 格式的 Word 文档
  ]
  //file.mimetype 是上传文件的 MIME 类型, 栗子：application/pdf → PDF 文档
  //includes()：JavaScript 数组方法，用于检查数组中是否包含指定元素
  //cb 是一个回调函数，用于通知 multer 文件是否应该被接受或拒绝,第一个参数传错误（没有错误就传 null），第二个传 true 表示接受文件，false 表示拒绝文件
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('只允许上传 PDF 或 Word 文件'), false)
  }
}

const upload = multer({  //Multer 实例化
  storage: storage,  // 指定文件存储位置,multer 是 Express 中用于处理文件上传的中间件
  fileFilter: fileFilter,  // 指定文件过滤器,用于过滤上传的文件类型
  limits: {
    fileSize: 10 * 1024 * 1024 // 限制文件大小为10MB,multer 的 limits 选项用于设置上传文件的大小限制,单位是字节
  }
})

// 学生提交论文 , upload.single('thesis') 表示上传文件名为 thesis 的单个文件， 对应 HTML 表单的 <input type="file" name="thesis">，- 成功：附加文件信息到 req.file   失败：抛出 `MulterError`
// 中间件执行顺序：auth.studentOnly → upload.single → 业务逻辑
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
      // 如果已存在论文，删除旧文件,existingThesis.file_url 是论文文件的路径,例如：thesis/thesis-1687290797686-123456789.pdf
      if (existingThesis.file_url) {
        const oldFilePath = path.join(__dirname, '..', 'uploads', existingThesis.file_url)
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath)  // 删除文件，unlinkSync()：Node.js 文件系统（fs 模块）的同步方法，用于删除文件
        }
      }
      // 修改文件路径存储方式，path.basename()：Node.js 的 path 模块方法，用于获取路径中的文件名 ，参数是文件路径，返回值是文件名 ； `thesis/${req.file.filename}`也可
      // 包含 thesis 目录
      const fileUrl = `thesis/${path.basename(req.file.path)}`
      // 更新论文记录，existingThesis.update()：Sequelize 实例方法，用于更新数据库记录
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
    //创建分支 （当 existingThesis 不存在时）
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

// 下载论文
router.get('/:id/download', auth.authenticate, async (req, res) => {
  try {
    const thesisId = req.params.id

    // 查询论文信息
    const thesis = await Thesis.findOne({
      where: { id: thesisId },
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'name']
        }
      ]
    })

    if (!thesis) {
      return res.status(404).json({
        success: false,
        message: '论文不存在'
      })
    }

    // 检查访问权限
    if (req.user.role === 'student' && thesis.student_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '无权访问该论文'
      })
    }

    const filePath = path.join(__dirname, '..', 'uploads', thesis.file_url)
    console.log('尝试下载文件:', filePath)

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

    // 生成合适的文件名，包含学生姓名和扩展名
    const fileName = `${thesis.student.name}-thesis${ext}`

    // 使用 encodeURIComponent 处理文件名中的特殊字符
    const encodedFileName = encodeURIComponent(fileName)

    // 设置响应头，强制下载
    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFileName}`)

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