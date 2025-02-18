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

        <el-form-item label="学号" prop="student_id">
          <el-input v-model="profileForm.student_id" disabled />
        </el-form-item>

        <el-form-item label="院系" prop="department">
          <el-select v-model="profileForm.department" placeholder="请选择院系">
            <el-option v-for="dept in departments" :key="dept.value" :label="dept.label" :value="dept.value" />
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
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
  student_id: '',
  department: '',
  email: ''
})

const rules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}

const fetchProfile = async () => {
  try {
    const response = await getProfile()
    if (response.success) {
      Object.assign(profileForm, response.data)
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
          originalProfile.value = { ...profileForm }
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