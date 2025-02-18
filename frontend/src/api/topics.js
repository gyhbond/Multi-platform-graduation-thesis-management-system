import request from '../utils/request'

// 教师相关接口
export const getTeacherTopics = () => {
  return request({
    url: '/api/teacher/topics',
    method: 'get'
  })
}

export const createTopic = (data) => {
  return request({
    url: '/api/teacher/topics',
    method: 'post',
    data
  })
}

export const updateTopic = (id, data) => {
  return request({
    url: `/api/teacher/topics/${id}`,
    method: 'put',
    data
  })
}

export const getTopicDetail = (id) => {
  return request({
    url: `/api/teacher/topics/${id}`,
    method: 'get'
  })
}

export const updateTopicStatus = (id, status) => {
  return request({
    url: `/api/teacher/topics/${id}/status`,
    method: 'put',
    data: { status }
  })
}

// 学生相关接口
export const getAvailableTopics = () => {
  return request({
    url: '/api/student/topics/available',
    method: 'get'
  })
}

export const getSelectedTopics = () => {
  return request({
    url: '/api/student/topics/selected',
    method: 'get'
  })
}

export const selectTopic = (topicId) => {
  return request({
    url: '/api/student/topics/select',
    method: 'post',
    data: { topicId }
  })
}

export const getMySelection = () => {
  return request({
    url: '/api/student/topics/my-selection',
    method: 'get'
  })
}

export const updateTopicSelection = (topicId, studentId, status) => {
  return request({
    url: `/api/teacher/topics/${topicId}/selections/${studentId}`,
    method: 'put',
    data: { status }
  })
}

// 获取选题状态
export const getSelectionStatus = () => {
  return request({
    url: '/api/student/topics/selection-status',
    method: 'get'
  })
}

// 取消选题
export const cancelTopicSelection = () => {
  return request({
    url: '/api/student/topics/cancel',
    method: 'delete'
  })
} 