<template>
  <div class="create-topic-container">
    <div class="header">
      <h2>{{ isEdit ? '编辑课题' : '发布新课题' }}</h2>
    </div>

    <el-form :model="topicForm" :rules="rules" ref="topicFormRef" label-width="100px" class="topic-form">
      <el-form-item label="课题名称" prop="title">
        <el-input v-model="topicForm.title" placeholder="请输入课题名称" />
      </el-form-item>

      <el-form-item label="课题描述" prop="description">
        <el-input v-model="topicForm.description" type="textarea" :rows="4" placeholder="请输入课题描述" />
      </el-form-item>

      <el-form-item label="选题要求" prop="requirements">
        <el-input v-model="topicForm.requirements" type="textarea" :rows="4" placeholder="请输入选题要求" />
      </el-form-item>

      <el-form-item label="最大选题人数" prop="maxStudents">
        <el-input-number v-model="topicForm.maxStudents" :min="1" :max="5" />
      </el-form-item>

      <el-form-item label="截止日期" prop="deadline">
        <el-date-picker v-model="topicForm.deadline" type="datetime" placeholder="选择截止日期" :disabled-date="disabledDate"
          :default-time="defaultTime" />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="handleSubmit">{{ isEdit ? '保存' : '发布' }}</el-button>
        <el-button @click="goBack">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { createTopic, updateTopic, getTopicDetail } from '../../api/topics'

const router = useRouter()
const route = useRoute()
const topicFormRef = ref(null)
const isEdit = ref(false)

const topicForm = reactive({
  title: '',
  description: '',
  requirements: '',
  maxStudents: 1,
  deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 默认30天后
})

const rules = {
  title: [
    { required: true, message: '请输入课题名称', trigger: 'blur' },
    { min: 3, max: 50, message: '长度在 3 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入课题描述', trigger: 'blur' }
  ],
  requirements: [
    { required: true, message: '请输入选题要求', trigger: 'blur' }
  ],
  maxStudents: [
    { required: true, message: '请设置最大选题人数', trigger: 'change' }
  ],
  deadline: [
    { required: true, message: '请选择截止日期', trigger: 'change' }
  ]
}

// 日期选择器配置
const disabledDate = (time) => {
  return time.getTime() < Date.now()
}

const defaultTime = new Date(2000, 0, 1, 23, 59, 59)

// 提交表单前格式化日期
const handleSubmit = async () => {
  if (!topicFormRef.value) return

  await topicFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const formData = {
          ...topicForm,
          deadline: topicForm.deadline.toISOString() // 确保日期格式正确
        }
        
        if (isEdit.value) {
          await updateTopic(route.query.id, formData)
        } else {
          await createTopic(formData)
        }
        ElMessage.success(isEdit.value ? '更新成功' : '发布成功')
        goBack()
      } catch (error) {
        ElMessage.error(error.message || '操作失败')
      }
    }
  })
}

// 返回列表页
const goBack = () => {
  router.push('/teacher/topics')
}

// 如果是编辑模式，获取课题详情
const fetchTopicDetail = async (id) => {
  try {
    const response = await getTopicDetail(id)
    if (response.success && response.data) {
      // 处理日期字段
      const topicData = {
        ...response.data,
        deadline: new Date(response.data.deadline)
      }
      Object.assign(topicForm, topicData)
    } else {
      throw new Error(response.message || '获取课题详情失败')
    }
  } catch (error) {
    console.error('获取课题详情失败:', error)
    ElMessage.error(error.message || '获取课题详情失败')
    goBack()
  }
}

onMounted(() => {
  const id = route.query.id
  if (id) {
    isEdit.value = true
    fetchTopicDetail(id)
  }
})
</script>

<style scoped>
.create-topic-container {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
}

.topic-form {
  max-width: 800px;
}
</style>