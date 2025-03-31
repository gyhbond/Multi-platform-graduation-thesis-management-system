exports.isStudent = (req, res, next) => {  //exports.xxx 表示导出一个具名中间件函数，并且可以直接导出（本质是一个函数）
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: '需要学生权限' })
  }
  next()
}

exports.isTeacher = (req, res, next) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ message: '需要教师权限' })
  }
  next()
} 