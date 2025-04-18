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
              <el-empty description="Word文档暂不支持在线批注">
                <template #image>
                  <el-icon :size="48" color="#909399">
                    <Document />
                  </el-icon>
                </template>
                <template #extra>
                  <div class="word-annotation-actions">
                    <el-button type="primary" @click="handleDownload(currentPdfThesis)">
                      下载文档
                    </el-button>
                    <!-- 分割线 -->
                    <el-divider>本地批注后上传</el-divider>
                    <el-upload class="annotated-file-upload" :action="uploadAnnotatedUrl" :headers="uploadHeaders"
                      :on-success="handleAnnotatedUploadSuccess" :on-error="handleAnnotatedUploadError"
                      :before-upload="beforeAnnotatedUpload" accept=".doc,.docx,.pdf">
                      <el-button type="success">上传批注版文档</el-button>
                      <template #tip>
                        <div class="el-upload__tip">
                          请在本地添加批注后上传，支持 Word 和 PDF 格式
                        </div>
                      </template>
                    </el-upload>
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
                    <el-button @click="handleDownload(currentPdfThesis)">下载文档</el-button>
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
import { ref, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Edit, Check, Document, WarningFilled, Loading } from '@element-plus/icons-vue'
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

const pdfLoading = ref(true)
const pdfError = ref(false)
const pdfErrorMessage = ref('文档加载失败，请尝试重新加载或下载查看')
const pdfViewer = ref(null)

const uploadAnnotatedUrl = computed(() => {
  return currentPdfThesis.value ?
    `${baseUrl}/api/thesis/${currentPdfThesis.value.id}/annotated-document` : ''
})

const uploadHeaders = {
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

      // 打开保存对话框
      const handle = await window.showSaveFilePicker({
        suggestedName: `${thesis.student.name}-论文.${ext}`,
        types: [fileTypes[ext] || {
          description: '所有文件',
          accept: {
            '*/*': [`.${ext}`]
          }
        }]
      })

      // 用户已选择保存位置，此时再开始下载
      ElMessage.info('正在下载文件...')

      // 获取文件内容
      const response = await fetch(downloadUrl)

      if (!response.ok) throw new Error('下载失败')

      const blob = await response.blob()

      // 写入文件
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()

      ElMessage.success('下载成功')
    } catch (error) {
      // 如果用户取消了保存对话框，直接返回
      if (error.name === 'AbortError') {
        return
      }

      // 如果是其他错误，或者浏览器不支持现代文件API
      if (error.name === 'TypeError' && !window.showSaveFilePicker) {
        // 对于不支持现代文件API的浏览器，使用传统方式但增加确认步骤
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
        link.download = `${thesis.student.name}-论文.${ext}`
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

const handleAnnotatedUploadSuccess = (response) => {
  if (response.success) {
    ElMessage.success('批注版文档上传成功')
    // 刷新论文列表
    fetchThesisList()
  } else {
    ElMessage.error(response.message || '上传失败')
  }
}

const handleAnnotatedUploadError = (error) => {
  console.error('上传批注版文档失败:', error)
  ElMessage.error('上传失败，请重试')
}

const beforeAnnotatedUpload = (file) => {
  const validTypes = ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/pdf']
  const isValidType = validTypes.includes(file.type)
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isValidType) {
    ElMessage.error('只能上传 Word 或 PDF 文档')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过 10MB')
    return false
  }
  return true
}

watch(currentPdfThesis, () => {
  pdfLoading.value = true
  pdfError.value = false
})

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

.word-annotation-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.annotated-file-upload {
  width: 100%;
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