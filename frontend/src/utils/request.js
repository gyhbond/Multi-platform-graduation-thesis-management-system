import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建 axios 实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000', // 确保这里配置正确
  timeout: 15000
})

// 请求拦截器  发送请求前处理
service.interceptors.request.use(
  config => {  //config 是 Axios 请求的 配置对象，包含了所有和当前请求相关的设置信息。
    // 添加 token
    const token = localStorage.getItem('token')
    //如果 token 存在，将其添加到请求头的 Authorization 字段中（格式为 Bearer {token}，符合 JWT 标准）。
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  error => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器  接收响应后处理
service.interceptors.response.use(
  response => {  //response 是 Axios 收到的 响应对象，包含了服务端返回的所有数据。
    const res = response.data
    if (res.success === false) {
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res   //如果请求成功，将响应数据返回给调用者。
  },
  error => {
    console.error('Response error:', error)
    ElMessage.error(error.response?.data?.message || '请求失败')
    return Promise.reject(error)
  }
)

export default service 