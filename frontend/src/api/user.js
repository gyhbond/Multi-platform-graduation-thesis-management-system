import request from './index'

export const getProfile = () => {
  return request({
    url: '/api/user/profile',
    method: 'get'
  })
}

export const updateProfile = (data) => {
  return request({
    url: '/api/user/profile',
    method: 'put',
    data
  })
}

export const getTeacherInfo = (teacherId) => {
  return request({
    url: `/api/user/teacher/${teacherId}`,
    method: 'get'
  })
} 