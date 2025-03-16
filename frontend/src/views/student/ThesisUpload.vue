<template>
  <div class="thesis-upload-container">
    <el-card class="upload-card">
      <template #header>
        <div class="card-header">
          <h2>论文提交</h2>
          <el-tag v-if="thesis" :type="getStatusType(thesis.status)">
            {{ getStatusText(thesis.status) }}
          </el-tag>
        </div>
      </template>

      <div class="upload-content">
        <div v-if="!hasApprovedTopic" class="no-topic-warning">
          <!-- show-icon 显示对应类型的图标 :closable="false" 不显示关闭按钮 -->
          <el-alert title="无法提交论文" type="warning" description="你还没有通过的选题，请等待教师审核通过选题申请后再提交论文" show-icon
            :closable="false" />
        </div>

        <!-- 注意：action 是后端接口地址，headers 是请求头，before-upload 是上传前的钩子函数，用于校验文件（如格式、大小限制），on-success 上传成功时的回调函数（如提示用户、跳转页面），on-error 上传失败时的回调函数（如显示错误信息）,accept：限制用户只能选择特定格式的文件（.pdf, .doc, .docx）,name：上传文件的字段名，对应后端接口接收参数的名称（如 thesis）   如果验证通过，组件会向 :action 指定的接口地址发送 HTTP POST 请求，请求体中包含文件数据和文件名，后端接口会接收这些数据并进行处理-->
        <el-upload v-else class="thesis-upload" :action="`${baseUrl}/api/thesis/submit`" :headers="headers"
          :before-upload="beforeUpload" :on-success="handleSuccess" :on-error="handleError" accept=".pdf,.doc,.docx"
          name="thesis">
          <el-button type="primary">选择论文文件</el-button>
          <template #tip>
            <div class="el-upload__tip">
              请上传 PDF 或 Word 格式的论文文件，文件大小不超过 10MB
            </div>
          </template>
        </el-upload>

        <div v-if="thesis" class="thesis-info">
          <h3>已提交的论文</h3>
          <p>提交时间：{{ formatDate(thesis.submitted_at) }}</p>
          <p v-if="thesis.score">分数：{{ thesis.score }}</p>
          <div v-if="thesis.feedback" class="feedback">
            <h4>导师评语：</h4>
            <p>{{ thesis.feedback }}</p>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getMyThesis } from '../../api/thesis'
import { getSelectedTopics } from '../../api/topics'

const thesis = ref(null)
const hasApprovedTopic = ref(false)
const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const headers = {
  Authorization: `Bearer ${localStorage.getItem('token')}`
}

const getStatusType = (status) => {
  const types = {
    submitted: 'warning',
    reviewed: 'success',
    rejected: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    submitted: '已提交',
    reviewed: '已评阅',
    rejected: '已退回'
  }
  return texts[status] || '未知状态'
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString()
}

const beforeUpload = (file) => {
  // 检查文件类型
  const allowedTypes = [
    'application/pdf',     // 限制上传的文件类型为 PDF
    'application/msword',  // 限制上传的文件类型为 旧版 Word
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // 限制上传的文件类型为 新版 Word
  ]

  if (!allowedTypes.includes(file.type)) {  //Array.includes 是 JavaScript 中用于判断数组是否包含某个特定元素的方法，返回布尔值（true 或 false）
    ElMessage.error('只能上传 PDF 或 Word 格式的文件！')
    return false
  }

  // 检查文件大小（10MB）     file.size 是文件的大小，单位是字节
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过 10MB！')
    return false
  }

  return true
}

const handleSuccess = (response) => {  //response 是后端接口返回的数据
  if (response.success) {
    ElMessage.success(response.message)
    fetchThesis()     // 上传成功后，重新获取论文信息
  } else {
    ElMessage.error(response.message)
  }
}

const handleError = (error) => {
  console.error('上传失败:', error)
  if (error.response?.data?.message) {
    ElMessage.error(error.response?.data?.message)
  } else {
    ElMessage.error('论文上传失败')
  }
}

const fetchThesis = async () => {
  try {
    const response = await getMyThesis()
    if (response.success) {
      thesis.value = response.data
    }
  } catch (error) {
    ElMessage.error('获取论文信息失败')
  }
}

const checkTopicStatus = async () => {
  try {
    const response = await getSelectedTopics()
    if (response.success && response.data.length > 0) {
      const topic = response.data[0]
      hasApprovedTopic.value = topic.students[0]?.TopicSelection?.status === 'approved'
    }
  } catch (error) {
    console.error('获取选题状态失败:', error)
  }
}

onMounted(async () => {
  await checkTopicStatus()
  await fetchThesis()
})
</script>

<style scoped>
.thesis-upload-container {
  padding: 20px;
}

.upload-card {
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

.upload-content {
  padding: 20px 0;
}

.thesis-upload {
  margin-bottom: 20px;
}

.thesis-info {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.thesis-info h3 {
  margin: 0 0 15px;
  color: #303133;
}

.thesis-info p {
  margin: 8px 0;
  color: #606266;
}

.feedback {
  margin-top: 15px;
}

.feedback h4 {
  margin: 10px 0;
  color: #303133;
}

.el-upload__tip {
  color: #909399;
  font-size: 13px;
  margin-top: 8px;
}

.no-topic-warning {
  margin-bottom: 20px;
}
</style>