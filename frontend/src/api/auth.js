import request from './index'

export const login = (data) => {
  return request({
    url: '/api/auth/login',
    method: 'post',
    data
  })
}

export const register = async (data) => {
  try {
    console.log('Sending register request:', {
      url: '/api/auth/register',
      data
    })
    const response = await request({
      url: '/api/auth/register',
      method: 'post',
      data
    })
    console.log('Register response:', response)
    return response
  } catch (error) {
    console.error('Register error:', error)
    if (error.response) {
      console.error('Error response:', error.response.data)
    }
    throw error
  }
} 