<template>
  <div class="my-selection-container">
    <h2>我的选题</h2>

    <div v-if="selectedTopics && selectedTopics.length > 0">
      <el-card v-for="topic in selectedTopics" :key="topic.id" class="topic-card">
        <template #header>
          <div class="card-header">
            <h3>{{ topic.title }}</h3>
            <el-tag :type="getStatusType(topic.students[0]?.TopicSelection?.status)">
              {{ getStatusText(topic.students[0]?.TopicSelection?.status) }}
            </el-tag>
          </div>
        </template>

        <div class="topic-content">
          <div class="info-item">
            <label>课题描述：</label>
            <p>{{ topic.description }}</p>
          </div>

          <div class="info-item">
            <label>指导教师：</label>
            <router-link :to="`/teacher-info/${topic.teacher.id}`" class="teacher-link">
              {{ topic.teacher.name }}
            </router-link>
          </div>

          <div class="info-item">
            <label>截止日期：</label>
            <span>{{ formatDate(topic.deadline) }}</span>
          </div>
        </div>
      </el-card>
    </div>

    <el-empty v-else description="暂未选择课题" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getSelectedTopics } from '../../api/topics'

const selectedTopics = ref([])

const getStatusType = (status) => {
  const types = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
  }
  return texts[status] || '未知状态'
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString()
}

const fetchSelectedTopics = async () => {
  try {
    const response = await getSelectedTopics()
    if (response.success) {
      selectedTopics.value = response.data
      console.log('Selected topics:', response.data) // 添加调试日志
    }
  } catch (error) {
    console.error('获取选题失败:', error)
    ElMessage.error('获取选题信息失败')
  }
}

onMounted(() => {
  fetchSelectedTopics()
})
</script>

<style scoped>
.my-selection-container {
  padding: 20px;
}

.topic-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
}

.info-item {
  margin-bottom: 15px;
}

.info-item label {
  font-weight: bold;
  color: #606266;
}

.info-item p {
  margin: 8px 0;
  line-height: 1.6;
}

.teacher-link {
  color: #409EFF;
  text-decoration: none;
}

.teacher-link:hover {
  text-decoration: underline;
}
</style>