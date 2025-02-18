<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <h2 class="login-title">毕业论文选题系统</h2>
      </template>

      <el-form :model="loginForm" :rules="rules" ref="loginFormRef">
        <el-form-item prop="username">
          <el-input v-model="loginForm.username" placeholder="用户名" prefix-icon="User">
          </el-input>
        </el-form-item>

        <el-form-item prop="password">
          <el-input v-model="loginForm.password" type="password" placeholder="密码" prefix-icon="Lock" show-password>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-radio-group v-model="loginForm.role">
            <el-radio label="student">学生</el-radio>
            <el-radio label="teacher">教师</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleLogin" class="login-button">
            登录
          </el-button>
        </el-form-item>

        <div class="register-link">
          <el-link type="primary" @click="goToRegister">还没有账号？立即注册</el-link>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { login } from '../api/auth'

const router = useRouter()
const loginFormRef = ref(null)

const loginForm = reactive({
  username: '',
  password: '',
  role: 'student'
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return

  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const response = await login(loginForm)
        console.log('Login response:', response)

        if (response.token) {
          localStorage.setItem('token', response.token)
          localStorage.setItem('userRole', response.user.role)
          localStorage.setItem('userName', response.user.name)

          ElMessage.success('登录成功')

          if (response.user.role === 'student') {
            await router.push('/topics/available')
          } else if (response.user.role === 'teacher') {
            await router.push('/teacher/topics')
          }
        } else {
          ElMessage.error(response.message || '登录失败')
        }
      } catch (error) {
        console.error('Login error:', error)
        ElMessage.error(error.response?.data?.message || '登录失败')
      }
    }
  })
}

const goToRegister = () => {
  router.push('/register')
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f7fa;
}

.login-card {
  width: 400px;
}

.login-title {
  text-align: center;
  color: #303133;
  margin: 0;
}

.login-button {
  width: 100%;
}

:deep(.el-card__header) {
  padding: 15px;
}

:deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

.register-link {
  text-align: center;
  margin-top: 15px;
}
</style>