<template>
  <div class="profile-container">
    <el-card class="profile-card">
      <template #header>
        <div class="card-header">
          <h2>个人信息</h2>
          <el-button type="primary" @click="isEditing = true" v-if="!isEditing">
            编辑资料
          </el-button>
        </div>
      </template>

      <el-form :model="profileForm" :rules="rules" ref="profileFormRef" label-width="100px" :disabled="!isEditing">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="profileForm.username" disabled />
        </el-form-item>

        <el-form-item label="姓名" prop="name">
          <el-input v-model="profileForm.name" />
        </el-form-item>

        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="profileForm.gender">
            <el-radio label="male">男</el-radio>
            <el-radio label="female">女</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="学号" prop="student_id">
          <el-input v-model="profileForm.student_id" disabled />
        </el-form-item>

        <el-form-item label="院系" prop="department">
          <el-select v-model="profileForm.department" placeholder="请选择院系">
            <el-option v-for="dept in departments" :key="dept.value" :label="dept.label" :value="dept.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="专业" prop="major">
          <el-input v-model="profileForm.major" placeholder="请输入专业" />
        </el-form-item>

        <el-form-item label="政治面貌" prop="political_status">
          <el-select v-model="profileForm.political_status" placeholder="请选择政治面貌">
            <el-option label="群众" value="群众" />
            <el-option label="共青团员" value="共青团员" />
            <el-option label="中共党员" value="中共党员" />
          </el-select>
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input v-model="profileForm.email" type="email" />
        </el-form-item>

        <el-form-item v-if="isEditing">
          <el-button type="primary" @click="handleSubmit">保存</el-button>
          <el-button @click="cancelEdit">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 添加修改密码卡片 -->
    <el-card class="profile-card" style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <h2>修改密码</h2>
        </div>
      </template>

      <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="100px">
        <el-form-item label="原密码" prop="oldPassword">
          <!-- show-password：当 show-password 设置为 true 时，输入框右侧会显示眼睛图标，点击可切换密码的显示状态（明文/密文）。 -->
          <el-input v-model="passwordForm.oldPassword" type="password" show-password placeholder="请输入原密码" />
        </el-form-item>

        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" show-password placeholder="请输入新密码" />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleChangePassword">
            修改密码
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getProfile, updateProfile } from '../../api/user'

const isEditing = ref(false)
const profileFormRef = ref(null)
const originalProfile = ref(null)

const departments = [
  { value: 'computer', label: '计算机科学与技术学院' },
  { value: 'math', label: '数学学院' },
  { value: 'physics', label: '物理学院' }
]

const profileForm = reactive({
  username: '',
  name: '',
  gender: '',
  student_id: '',
  department: '',
  major: '',
  political_status: '',
  email: ''
})

const rules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  gender: [
    { required: true, message: '请选择性别', trigger: 'change' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  major: [
    { required: true, message: '请选择专业', trigger: 'change' }
  ],
  political_status: [
    { required: true, message: '请选择政治面貌', trigger: 'change' }
  ]
}

const passwordFormRef = ref(null)
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6位', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value === passwordForm.oldPassword) {
          callback(new Error('新密码不能与原密码相同'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const fetchProfile = async () => {
  try {
    const response = await getProfile()
    if (response.success) {
      Object.assign(profileForm, response.data)  //浅拷贝 <-  浅拷贝会创建一个新对象，但新对象的属性值（尤其是引用类型的属性）与原始对象共享同一内存地址。这意味着修改浅拷贝对象的嵌套属性时，原始对象的对应属性也会被影响
      originalProfile.value = { ...response.data }
    }
  } catch (error) {
    ElMessage.error('获取个人信息失败')
  }
}

const handleSubmit = async () => {
  if (!profileFormRef.value) return

  await profileFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const response = await updateProfile(profileForm)
        if (response.success) {
          ElMessage.success('保存成功')
          isEditing.value = false
          originalProfile.value = { ...profileForm }  //修改源数据
        }
      } catch (error) {
        ElMessage.error(error.message || '保存失败')
      }
    }
  })
}

const cancelEdit = () => {
  Object.assign(profileForm, originalProfile.value)
  isEditing.value = false
}

const handleChangePassword = async () => {
  if (!passwordFormRef.value) return

  await passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const response = await updateProfile({
          password: passwordForm.newPassword,
          oldPassword: passwordForm.oldPassword
        })

        if (response.success) {
          ElMessage.success('密码修改成功')
          passwordForm.oldPassword = ''
          passwordForm.newPassword = ''
          passwordForm.confirmPassword = ''
          passwordFormRef.value.resetFields()//将表单字段重置为初始值
        }
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '密码修改失败')
      }
    }
  })
}

onMounted(() => {
  fetchProfile()
})
</script>

<style scoped>
.profile-container {
  padding: 20px;
}

.profile-card {
  max-width: 800px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
}
</style>