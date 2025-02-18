<template>
  <div class="thesis-feedback-container">
    <template v-if="thesis">
      <el-card class="feedback-card">
        <template #header>
          <div class="card-header">
            <h2>论文评阅结果</h2>
            <el-button-group>
              <el-button type="primary" @click="handleDownload">
                下载论文
              </el-button>
              <el-button type="warning" @click="showAnnotations">
                查看批注
              </el-button>
            </el-button-group>
          </div>
        </template>

        <div class="thesis-info">
          <div class="info-item">
            <span class="label">提交时间：</span>
            {{ formatDate(thesis.submitted_at) }}
          </div>
          <div class="info-item">
            <span class="label">状态：</span>
            <el-tag :type="getStatusType(thesis.status)">
              {{ getStatusText(thesis.status) }}
            </el-tag>
          </div>
        </div>

        <div v-if="thesis.status === 'reviewed'" class="review-result">
          <div class="score-section">
            <h3>得分</h3>
            <el-progress
              type="dashboard"
              :percentage="thesis.score"
              :color="getScoreColor(thesis.score)"
            >
              <template #default="{ percentage }">
                <span class="score-text">{{ formatScore(percentage) }}</span>
              </template>
            </el-progress>
          </div>

          <div class="feedback-section">
            <h3>评语</h3>
            <div class="feedback-content">
              {{ thesis.feedback || '暂无评语' }}
            </div>
          </div>
        </div>

        <div v-else-if="thesis.status === 'submitted'" class="waiting-review">
          <el-empty description="论文正在等待导师评阅">
            <template #image>
              <el-icon class="waiting-icon"><Loading /></el-icon>
            </template>
          </el-empty>
        </div>

        <div class="thesis-actions">
          <el-button 
            type="primary" 
            @click="handleDownload"
            :disabled="!thesis.file_url"
          >
            下载我的论文
          </el-button>
        </div>
      </el-card>

      <!-- 批注查看对话框 -->
      <el-dialog
        v-model="annotationDialogVisible"
        title="论文批注"
        width="90%"
        :fullscreen="true"
      >
        <div class="annotation-container">
          <div class="pdf-viewer">
            <iframe
              v-if="pdfUrl"
              :src="pdfUrl"
              width="100%"
              height="100%"
              frameborder="0"
            ></iframe>
          </div>
          <div class="annotation-panel">
            <div class="annotation-header">
              <h3>批注列表</h3>
            </div>
            <el-scrollbar height="calc(100vh - 200px)">
              <div class="annotation-list">
                <div
                  v-for="(annotation, index) in annotations"
                  :key="index"
                  class="annotation-item"
                >
                  <div class="annotation-item-header">
                    <div class="annotation-page">
                      <span class="label">第 {{ annotation.page }} 页</span>
                    </div>
                    <div class="annotation-time">
                      {{ formatDate(annotation.timestamp) }}
                    </div>
                  </div>
                  <div class="annotation-content">
                    {{ annotation.content }}
                  </div>
                </div>
                <div v-if="!annotations.length" class="no-annotations">
                  暂无批注
                </div>
              </div>
            </el-scrollbar>
          </div>
        </div>
      </el-dialog>
    </template>

    <el-empty 
      v-else
      description="你还没有提交论文"
    >
      <el-button type="primary" @click="$router.push('/thesis/upload')">
        去提交论文
      </el-button>
    </el-empty>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { getMyThesis } from '../../api/thesis'

const thesis = ref(null)
const annotationDialogVisible = ref(false)
const annotations = ref([])

const pdfUrl = computed(() => {
  if (!thesis.value) return ''
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  return `${baseUrl}/uploads/${thesis.value.file_url}`
})

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
    submitted: '待评阅',
    reviewed: '已评阅',
    rejected: '已退回'
  }
  return texts[status] || '未知状态'
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString()
}

const getScoreColor = (score) => {
  if (score >= 90) return '#67C23A'
  if (score >= 80) return '#409EFF'
  if (score >= 60) return '#E6A23C'
  return '#F56C6C'
}

const formatScore = (percentage) => {
  return `${percentage}分`
}

const handleDownload = async () => {
  try {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    const downloadUrl = `${baseUrl}/api/thesis/download/${thesis.value.id}`
    
    // 使用 showSaveFilePicker API 让用户选择保存位置
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: '我的论文.pdf',
        types: [{
          description: 'PDF 文件',
          accept: { 'application/pdf': ['.pdf'] }
        }]
      })

      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) throw new Error('下载失败')
      
      const blob = await response.blob()
      
      // 写入文件
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      
      ElMessage.success('下载成功')
    } catch (error) {
      if (error.name === 'AbortError') {
        // 用户取消了保存对话框
        return
      }
      throw error
    }
  } catch (error) {
    console.error('下载论文失败:', error)
    // 如果不支持 showSaveFilePicker，回退到传统下载方式
    if (error.name === 'TypeError' && !window.showSaveFilePicker) {
      try {
        const response = await fetch(downloadUrl, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        
        if (!response.ok) throw new Error('下载失败')
        
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = '我的论文.pdf'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        ElMessage.success('下载成功')
      } catch (e) {
        ElMessage.error('下载失败')
      }
    } else {
      ElMessage.error('下载失败')
    }
  }
}

const showAnnotations = () => {
  annotations.value = thesis.value.annotations || []
  annotationDialogVisible.value = true
}

const fetchThesis = async () => {
  try {
    const response = await getMyThesis()
    if (response.success) {
      thesis.value = response.data
    }
  } catch (error) {
    console.error('获取论文信息失败:', error)
    ElMessage.error('获取论文信息失败')
  }
}

onMounted(() => {
  fetchThesis()
})
</script>

<style scoped>
.thesis-feedback-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.feedback-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
}

.thesis-info {
  margin: 20px 0;
}

.info-item {
  margin: 10px 0;
  color: #606266;
}

.info-item .label {
  font-weight: bold;
  margin-right: 10px;
  color: #303133;
}

.review-result {
  padding: 20px 0;
}

.score-section {
  text-align: center;
  margin-bottom: 30px;
}

.score-section h3 {
  margin-bottom: 20px;
  color: #303133;
}

.score-text {
  font-size: 20px;
  font-weight: bold;
}

.feedback-section h3 {
  color: #303133;
  margin-bottom: 15px;
}

.feedback-content {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  color: #606266;
  line-height: 1.6;
  min-height: 100px;
}

.waiting-review {
  padding: 40px 0;
  text-align: center;
}

.waiting-icon {
  font-size: 48px;
  color: #909399;
  animation: rotate 2s linear infinite;
}

.thesis-actions {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.annotation-container {
  display: flex;
  height: calc(100vh - 100px);
  gap: 20px;
}

.pdf-viewer {
  flex: 2;
  height: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.annotation-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.annotation-header {
  padding: 0 10px;
}

.annotation-list {
  padding: 10px;
}

.annotation-item {
  margin-bottom: 15px;
  padding: 15px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #fff;
}

.annotation-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.annotation-page {
  color: #606266;
}

.annotation-time {
  font-size: 12px;
  color: #909399;
}

.annotation-content {
  color: #303133;
  line-height: 1.6;
}

.no-annotations {
  text-align: center;
  color: #909399;
  padding: 20px;
}
</style> 