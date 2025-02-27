<template>
  <div class="register-container">
    <el-card class="register-card">
      <template #header>
        <h2 class="register-title">用户注册</h2>
      </template>

      <el-form :model="registerForm" :rules="rules" ref="registerFormRef" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="registerForm.username" placeholder="请输入用户名"></el-input>
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input v-model="registerForm.password" type="password" placeholder="请输入密码" show-password></el-input>
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="registerForm.confirmPassword" type="password" placeholder="请再次输入密码" show-password></el-input>
        </el-form-item>

        <el-form-item label="姓名" prop="name">
          <el-input v-model="registerForm.name" placeholder="请输入姓名"></el-input>
        </el-form-item>

        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="registerForm.gender">
            <el-radio label="male">男</el-radio>
            <el-radio label="female">女</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="身份" prop="role">
          <el-radio-group v-model="registerForm.role">
            <el-radio label="student">学生</el-radio>
            <el-radio label="teacher">教师</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="学号" prop="student_id" v-if="registerForm.role === 'student'">
          <el-input v-model="registerForm.student_id" placeholder="请输入学号"></el-input>
        </el-form-item>

        <el-form-item label="工号" prop="teacher_id" v-if="registerForm.role === 'teacher'">
          <el-input v-model="registerForm.teacher_id" placeholder="请输入教师工号"></el-input>
        </el-form-item>

        <el-form-item label="所属院系" prop="department">
          <el-select v-model="registerForm.department" placeholder="请选择院系">
            <el-option
              v-for="dept in departments"
              :key="dept.value"
              :label="dept.label"
              :value="dept.value"
            ></el-option>
          </el-select>
        </el-form-item>

        <el-form-item 
          label="专业" 
          prop="major" 
          v-if="registerForm.role === 'student'"
        >
          <el-input 
            v-model="registerForm.major" 
            placeholder="请输入专业"
          />
        </el-form-item>

        <el-form-item 
          label="政治面貌" 
          prop="political_status"
          v-if="registerForm.role === 'student'"
        >
          <el-select v-model="registerForm.political_status" placeholder="请选择政治面貌">
            <el-option label="群众" value="群众" />
            <el-option label="共青团员" value="共青团员" />
            <el-option label="中共党员" value="中共党员" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleRegister">注册</el-button>
          <el-button @click="goToLogin">返回登录</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { register } from '../api/auth'

const router = useRouter()
const registerFormRef = ref(null)

const departments = [
  { value: 'computer', label: '计算机科学与技术学院' },
  { value: 'math', label: '数学学院' },
  { value: 'physics', label: '物理学院' }
]

const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  name: '',
  gender: 'male',
  role: 'student',
  student_id: '',
  teacher_id: '',
  department: '',
  major: '',
  political_status: ''
})

// 动态验证规则
const rules = reactive({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== registerForm.password) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  gender: [
    { required: true, message: '请选择性别', trigger: 'change' }
  ],
  role: [
    { required: true, message: '请选择身份', trigger: 'change' }
  ],
  student_id: [
    { 
      required: true, 
      message: '请输入学号', 
      trigger: 'blur',
      validator: (rule, value, callback) => {
        if (registerForm.role === 'student' && !value) {
          callback(new Error('学生必须填写学号'))
        } else {
          callback()
        }
      }
    }
  ],
  teacher_id: [
    {
      required: true,
      message: '请输入教师工号',
      trigger: 'blur',
      validator: (rule, value, callback) => {
        if (registerForm.role === 'teacher' && !value) {
          callback(new Error('教师必须填写工号'))
        } else {
          callback()
        }
      }
    }
  ],
  department: [
    { required: true, message: '请选择院系', trigger: 'change' }
  ],
  major: [
    {
      required: true,
      message: '请选择专业',
      trigger: 'change',
      validator: (rule, value, callback) => {
        if (registerForm.role === 'student' && !value) {
          callback(new Error('请选择专业'))
        } else {
          callback()
        }
      }
    }
  ],
  political_status: [
    {
      required: true,
      message: '请选择政治面貌',
      trigger: 'change',
      validator: (rule, value, callback) => {
        if (registerForm.role === 'student' && !value) {
          callback(new Error('请选择政治面貌'))
        } else {
          callback()
        }
      }
    }
  ]
})

const handleRegister = async () => {
  if (!registerFormRef.value) return
  
  await registerFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await register(registerForm)
        ElMessage.success('注册成功')
        router.push('/login')
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '注册失败')
      }
    }
  })
}

const goToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f7fa;
}

.register-card {
  width: 500px;
}

.register-title {
  text-align: center;
  margin: 0;
}
</style>