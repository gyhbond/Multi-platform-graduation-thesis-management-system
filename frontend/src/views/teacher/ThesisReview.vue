<template>
  <div class="thesis-review-container">
    <h2>论文审阅</h2>

    <el-table :data="thesisList" style="width: 100%" v-loading="loading">
      <el-table-column label="学生姓名" prop="student.name" />
      <el-table-column label="学号" prop="student.student_id" />
      <el-table-column label="课题名称" prop="topic.title" />
      <el-table-column label="提交时间">
        <template #default="{ row }">
          {{ formatDate(row.submitted_at) }}
        </template>
      </el-table-column>
      <el-table-column label="状态">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280">
        <template #default="{ row }">
          <el-button-group>
            <el-button type="primary" size="small" @click="handleDownload(row)">
              下载论文
            </el-button>
            <el-button type="warning" size="small" @click="handleAnnotate(row)">
              批注
            </el-button>
            <el-button type="success" size="small" @click="handleReview(row)"
              :icon="row.status === 'reviewed' ? Edit : Check">
              {{ row.status === 'reviewed' ? '修改评阅' : '评阅' }}
            </el-button>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>

    <!-- 评阅对话框 -->
    <el-dialog v-model="reviewDialogVisible" :title="currentThesis?.status === 'reviewed' ? '修改评阅' : '论文评阅'"
      width="500px">
      <el-form :model="reviewForm" ref="reviewFormRef" label-width="80px">
        <el-form-item label="分数" prop="score" :rules="[
          { required: true, message: '请输入分数' },
          { type: 'number', min: 0, max: 100, message: '分数范围为0-100' }
        ]">
          <el-input-number v-model="reviewForm.score" :min="0" :max="100" style="width: 180px" />
        </el-form-item>
        <el-form-item label="评语" prop="feedback" :rules="[
          { required: true, message: '请输入评语' }
        ]">
          <el-input v-model="reviewForm.feedback" type="textarea" :rows="4" placeholder="请输入评语" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="reviewDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitReview">
            {{ currentThesis?.status === 'reviewed' ? '保存修改' : '提交评阅' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 批注对话框 -->
    <el-dialog v-model="annotationDialogVisible" title="论文批注" width="90%" :fullscreen="true"
      :before-close="handleCloseAnnotation" class="thesis-annotation-dialog">
      <div class="annotation-container">
        <!-- PDF 预览区域 -->
        <div class="pdf-viewer">
          <template v-if="isWordFile">
            <div class="word-file-notice">
              <el-empty description="Word文档暂不支持在线预览">
                <template #extra>
                  <el-button type="primary" @click="handleDownload(currentPdfThesis)">
                    下载文档
                  </el-button>
                </template>
              </el-empty>
            </div>
          </template>
          <iframe v-else-if="pdfUrl" :src="pdfUrl" width="100%" height="100%" frameborder="0"></iframe>
        </div>

        <!-- 批注面板 -->
        <div class="annotation-panel">
          <div class="annotation-header">
            <h3>批注列表</h3>
            <div class="annotation-tools">
              <el-button type="primary" size="small" @click="addAnnotation">
                添加批注
              </el-button>
              <el-button type="success" size="small" @click="saveAnnotations">
                保存批注
              </el-button>
            </div>
          </div>

          <div class="annotation-list">
            <el-scrollbar>
              <div v-for="(annotation, index) in annotations" :key="index" class="annotation-item">
                <div class="annotation-item-header">
                  <div class="annotation-page">
                    <span class="label">页码：</span>
                    <el-input-number v-model="annotation.page" :min="1" controls-position="right" size="small" />
                  </div>
                  <el-button type="danger" size="small" circle @click="removeAnnotation(index)">
                    <el-icon>
                      <Delete />
                    </el-icon>
                  </el-button>
                </div>
                <el-input v-model="annotation.content" type="textarea" :rows="3" placeholder="请输入批注内容" />
                <div class="annotation-time">
                  {{ formatDate(annotation.timestamp) }}
                </div>
              </div>
            </el-scrollbar>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Edit, Check } from '@element-plus/icons-vue'
import { getTeacherThesisList, reviewThesis, saveAnnotations as saveThesisAnnotations } from '../../api/thesis'

const loading = ref(false)
const thesisList = ref([])
const reviewDialogVisible = ref(false)
const currentThesis = ref(null)
const reviewForm = ref({
  score: null,
  feedback: ''
})
const reviewFormRef = ref(null)

const annotationDialogVisible = ref(false)
const currentPdfThesis = ref(null)
const annotations = ref([])

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

const handleDownload = async (thesis) => {
  try {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    const token = localStorage.getItem('token')
    const downloadUrl = `${baseUrl}/api/thesis/${thesis.id}/download?token=${token}`

    // 获取文件扩展名
    const ext = thesis.file_url.split('.').pop().toLowerCase()

    // 使用 showSaveFilePicker API 让用户选择保存位置
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

      const handle = await window.showSaveFilePicker({
        suggestedName: `${thesis.student.name}-论文.${ext}`,
        types: [fileTypes[ext] || {
          description: '所有文件',
          accept: {
            '*/*': [`.${ext}`]
          }
        }]
      })

      const response = await fetch(downloadUrl)

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
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
        const token = localStorage.getItem('token')
        const downloadUrl = `${baseUrl}/api/thesis/${thesis.id}/download?token=${token}`
        const ext = thesis.file_url.split('.').pop().toLowerCase()

        const response = await fetch(downloadUrl)

        if (!response.ok) throw new Error('下载失败')

        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${thesis.student.name}-论文.${ext}`
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

const handleReview = (thesis) => {
  currentThesis.value = thesis
  // 如果是修改评阅，加载已有的评阅信息
  if (thesis.status === 'reviewed') {
    reviewForm.value = {
      score: thesis.score,
      feedback: thesis.feedback
    }
  } else {
    reviewForm.value = {
      score: null,
      feedback: ''
    }
  }
  reviewDialogVisible.value = true
}

const submitReview = async () => {
  if (!reviewFormRef.value) return

  await reviewFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const isModifying = currentThesis.value.status === 'reviewed'
        const confirmMessage = isModifying ?
          '确定要修改评阅结果吗？' :
          '确定要提交评阅结果吗？'

        await ElMessageBox.confirm(confirmMessage, '提示', {
          type: 'warning'
        })

        const response = await reviewThesis(currentThesis.value.id, reviewForm.value)
        if (response.success) {
          ElMessage.success(isModifying ? '评阅修改成功' : '评阅成功')
          reviewDialogVisible.value = false
          fetchThesisList()
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('评阅失败:', error)
          ElMessage.error('评阅失败')
        }
      }
    }
  })
}

const fetchThesisList = async () => {
  loading.value = true
  try {
    const response = await getTeacherThesisList()
    if (response.success) {
      thesisList.value = response.data
      console.log('Thesis list:', response.data)
    }
  } catch (error) {
    console.error('获取论文列表失败:', error)
    ElMessage.error('获取论文列表失败')
  } finally {
    loading.value = false
  }
}

const pdfUrl = computed(() => {
  if (!currentPdfThesis.value) return ''
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  return `${baseUrl}/uploads/${currentPdfThesis.value.file_url}`
})

const isWordFile = computed(() => {
  if (!currentPdfThesis.value?.file_url) return false
  const ext = currentPdfThesis.value.file_url.split('.').pop().toLowerCase()
  return ['doc', 'docx'].includes(ext)
})

const handleAnnotate = (thesis) => {
  currentPdfThesis.value = thesis

  if (isWordFile.value) {
    ElMessageBox.confirm(
      'Word文档暂不支持在线批注，建议下载后使用 Word 的批注功能。是否继续查看批注列表？',
      '提示',
      {
        confirmButtonText: '继续',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      annotations.value = thesis.annotations || []
      annotationDialogVisible.value = true
    }).catch(() => {
      // 用户取消，不打开批注对话框
    })
  } else {
    annotations.value = thesis.annotations || []
    annotationDialogVisible.value = true
  }
}

const handleCloseAnnotation = (done) => {
  ElMessageBox.confirm('确认关闭？未保存的批注将会丢失')
    .then(() => {
      done()
    })
    .catch(() => { })
}

const addAnnotation = () => {
  annotations.value.push({
    page: 1,
    content: '',
    timestamp: new Date().toISOString()
  })
}

const removeAnnotation = (index) => {
  ElMessageBox.confirm('确定要删除这条批注吗？')
    .then(() => {
      annotations.value.splice(index, 1)
    })
    .catch(() => { })
}

const handleAnnotationChange = () => {
  // 可以在这里添加自动保存逻辑
}

const saveAnnotations = async () => {
  try {
    const response = await saveThesisAnnotations(currentPdfThesis.value.id, annotations.value)
    if (response.success) {
      ElMessage.success('批注保存成功')
      annotationDialogVisible.value = false
      fetchThesisList()
    }
  } catch (error) {
    console.error('保存批注失败:', error)
    ElMessage.error('保存批注失败')
  }
}

onMounted(() => {
  fetchThesisList()
})
</script>

<style scoped>
.thesis-review-container {
  padding: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.thesis-annotation-dialog :deep(.el-dialog__body) {
  padding: 0;
  height: calc(100vh - 53px);
  overflow: hidden;
}

.annotation-container {
  display: flex;
  height: 100%;
  gap: 20px;
  padding: 20px;
}

.pdf-viewer {
  flex: 3;
  height: calc(100vh - 93px);
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  background-color: #f5f7fa;
  position: relative;
}

.pdf-viewer iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
}

.annotation-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 300px;
  max-width: 350px;
}

.annotation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.annotation-header h3 {
  margin: 0;
}

.annotation-tools {
  display: flex;
  gap: 10px;
}

.annotation-list {
  flex: 1;
  overflow: hidden;
}

.annotation-list .el-scrollbar {
  height: calc(100vh - 180px);
}

.annotation-item {
  background: #fff;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.annotation-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.annotation-page {
  display: flex;
  align-items: center;
  gap: 8px;
}

.annotation-time {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
  text-align: right;
}

.word-file-notice {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.word-file-notice :deep(.el-empty) {
  padding: 40px;
}

.word-file-notice :deep(.el-empty__description) {
  margin-top: 20px;
  font-size: 16px;
}

/* 移动端样式优化 */
@media screen and (max-width: 768px) {
  .annotation-container {
    flex-direction: column;
    padding: 10px;
    gap: 10px;
    height: 100%;
  }

  .pdf-viewer {
    flex: none;
    height: 45vh;
    min-height: 300px;
    position: relative;
  }

  .pdf-viewer iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: none;
  }

  .word-file-notice {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  .annotation-panel {
    min-width: 100%;
    max-width: 100%;
    height: calc(55vh - 53px);
  }

  .annotation-list .el-scrollbar {
    height: calc(55vh - 150px);
  }

  .thesis-annotation-dialog :deep(.el-dialog) {
    margin: 0 !important;
    display: flex;
    flex-direction: column;
  }

  .thesis-annotation-dialog :deep(.el-dialog__body) {
    flex: 1;
    overflow: auto;
    padding: 10px;
  }

  .thesis-annotation-dialog :deep(.el-dialog__header) {
    padding: 15px;
    margin-right: 0;
  }
}
</style>