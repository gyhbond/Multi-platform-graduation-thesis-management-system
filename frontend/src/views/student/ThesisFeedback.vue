<template>
  <div class="thesis-feedback-container">
    <template v-if="thesis">
      <el-card class="feedback-card">
        <template #header>
          <div class="card-header">
            <h2>论文评阅结果</h2>
            <el-button-group> <!--效果：两个按钮紧密排列，无间隔边框 -->
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
            <h3>得分</h3> <!-- dashboard仪盘型进度条 -->
            <el-progress type="dashboard" :percentage="thesis.score" :color="getScoreColor(thesis.score)">
              <template #default="{ percentage }"><!-- 利用默认插槽内嵌自定义内容 -->
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
            <template #image> <!--覆盖 <el-empty> 默认的图标插槽 ，这玩意有默认的图标-->
              <el-icon class="waiting-icon">
                <Loading />
              </el-icon>
            </template>
          </el-empty>
        </div>

        <div class="thesis-actions">
          <el-button type="primary" @click="handleDownload" :disabled="!thesis.file_url">
            下载我的论文
          </el-button>
        </div>
      </el-card>

      <!-- 批注查看对话框 -->
      <el-dialog v-model="annotationDialogVisible" title="论文批注" width="90%" :fullscreen="true">
        <div class="annotation-container">
          <div class="pdf-viewer">
            <template v-if="isWordFile">
              <div class="word-file-notice">
                <el-empty description="Word文档暂不支持在线预览">
                  <template #image>
                    <el-icon :size="48" color="#909399">
                      <Document />
                    </el-icon>
                  </template>
                  <template #extra>
                    <div class="document-notice-actions">
                      <p class="notice-text">如需查看文档和老师的批注，请下载文档后使用Office或WPS软件打开</p>
                      <el-button type="primary" @click="handleDownload">
                        下载文档
                      </el-button>
                    </div>
                  </template>
                </el-empty>
              </div>
            </template>
            <template v-else-if="pdfUrl">
              <div class="pdf-loading" v-if="pdfLoading">
                <el-skeleton animated :rows="10" />
                <div class="loading-text">
                  <el-icon class="is-loading">
                    <Loading />
                  </el-icon>
                  加载文档中...
                </div>
              </div>
              <div v-show="!pdfLoading">
                <iframe ref="pdfViewer" :src="pdfUrl" width="100%" height="100%" frameborder="0" @load="handlePdfLoad"
                  @error="handlePdfError"></iframe>
              </div>
              <div class="pdf-error" v-if="pdfError">
                <el-empty description="文档加载失败">
                  <template #image>
                    <el-icon :size="48" color="#F56C6C">
                      <WarningFilled />
                    </el-icon>
                  </template>
                  <template #extra>
                    <div class="document-notice-actions">
                      <p class="notice-text">{{ pdfErrorMessage }}</p>
                      <el-button type="primary" @click="reloadPdf">重新加载</el-button>
                      <el-button @click="handleDownload">下载文档</el-button>
                    </div>
                  </template>
                </el-empty>
              </div>
            </template>
            <template v-else>
              <div class="no-document-notice">
                <el-empty description="暂无文档">
                  <template #image>
                    <el-icon :size="48" color="#909399">
                      <Document />
                    </el-icon>
                  </template>
                </el-empty>
              </div>
            </template>
          </div>
          <div class="annotation-panel">
            <div class="annotation-header">
              <h3>批注列表</h3>
            </div>
            <el-scrollbar height="calc(100vh - 200px)">
              <div class="annotation-list">
                <div v-for="(annotation, index) in annotations" :key="index" class="annotation-item">
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

    <el-empty v-else description="你还没有提交论文">
      <el-button type="primary" @click="$router.push('/thesis/upload')">
        去提交论文
      </el-button>
    </el-empty>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading, Document, WarningFilled } from '@element-plus/icons-vue'
import { getMyThesis } from '../../api/thesis'

const thesis = ref(null)
const annotationDialogVisible = ref(false)
const annotations = ref([])

const pdfUrl = computed(() => {
  if (!thesis.value) return ''
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  return `${baseUrl}/uploads/${thesis.value.file_url}`
})

const isWordFile = computed(() => {
  if (!thesis.value || !thesis.value.file_url) return false
  const ext = thesis.value.file_url.toLowerCase()
  return ext.endsWith('.doc') || ext.endsWith('.docx')
})

const pdfLoading = ref(true)
const pdfError = ref(false)
const pdfErrorMessage = ref('文档加载失败，请尝试重新加载或下载查看')
const pdfViewer = ref(null)

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
    const token = localStorage.getItem('token')
    const downloadUrl = `${baseUrl}/api/thesis/${thesis.value.id}/download?token=${token}`

    // 获取文件扩展名
    const ext = thesis.value.file_url.split('.').pop().toLowerCase()

    // 尝试使用现代文件系统API
    try {
      // 根据文件扩展名配置文件类型
      const fileTypes = {
        'pdf': {
          description: 'PDF 文件',
          accept: {
            'application/pdf': ['.pdf']
          }
        },
        'doc': {
          description: 'Word 文件',
          accept: {
            'application/msword': ['.doc']
          }
        },
        'docx': {
          description: 'Word 文件',
          accept: {
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
          }
        }
      }

      // 打开保存对话框
      const handle = await window.showSaveFilePicker({
        suggestedName: `我的论文.${ext}`,
        types: [fileTypes[ext] || {
          description: '所有文件',
          accept: {
            '*/*': [`.${ext}`]
          }
        }]
      })

      // 用户已选择保存位置，此时开始下载
      ElMessage.info('正在下载文件...')

      const response = await fetch(downloadUrl)

      if (!response.ok) throw new Error('下载失败')

      const blob = await response.blob()

      // 写入文件
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()

      ElMessage.success('下载成功')
    } catch (error) {
      // 用户取消选择或浏览器不支持，使用传统下载方式
      if (error.name === 'AbortError') {
        // 用户取消了保存对话框
        return
      }

      // 传统下载方式，但增加确认步骤
      if (error.name === 'TypeError' && !window.showSaveFilePicker) {
        await ElMessageBox.confirm(
          '你的浏览器不支持选择保存位置，文件将下载到默认下载目录。是否继续？',
          '下载确认',
          {
            confirmButtonText: '继续下载',
            cancelButtonText: '取消',
            type: 'info'
          }
        )

        // 用户确认后开始下载
        ElMessage.info('正在下载文件...')
        const response = await fetch(downloadUrl)

        if (!response.ok) throw new Error('下载失败')

        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `我的论文.${ext}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        ElMessage.success('下载成功')
      } else {
        throw error
      }
    }
  } catch (error) {
    console.error('下载论文失败:', error)
    ElMessage.error('下载失败')
  }
}

const showAnnotations = () => {
  annotations.value = thesis.value.annotations || []
  annotationDialogVisible.value = true
}

const handlePdfLoad = () => {
  pdfLoading.value = false
  pdfError.value = false
}

const handlePdfError = () => {
  pdfLoading.value = false
  pdfError.value = true
  pdfErrorMessage.value = '文档加载失败，可能是格式不支持或文件损坏'
}

const reloadPdf = () => {
  if (pdfViewer.value) {
    pdfLoading.value = true
    pdfError.value = false
    const timestamp = new Date().getTime()
    pdfViewer.value.src = `${pdfUrl.value}?t=${timestamp}`
  }
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

watch(thesis, () => {
  if (annotationDialogVisible.value) {
    pdfLoading.value = true
    pdfError.value = false
  }
}, { deep: true })

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

.pdf-loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #f9f9f9;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
}

.loading-text {
  text-align: center;
  margin-top: 20px;
  font-size: 16px;
  color: #409EFF;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.pdf-error {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.document-notice-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.notice-text {
  color: #909399;
  text-align: center;
  margin: 0 0 10px;
  font-size: 14px;
}

.no-document-notice {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>