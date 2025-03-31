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

        <!-- 如果有批注版文档，添加下载按钮 -->
        <template v-if="thesis.has_annotated_file">
          <el-button type="success" @click="handleDownloadAnnotated">
            下载批注版文档
          </el-button>
        </template>
      </el-card>

      <!-- 批注查看对话框 fillscreen字面意思打开满屏对话框-->
      <el-dialog v-model="annotationDialogVisible" title="论文批注" width="90%" :fullscreen="true">
        <div class="annotation-container">
          <div class="pdf-viewer">
            <template v-if="isWordFile">
              <div class="word-file-notice">
                <el-empty description="Word文档暂不支持在线预览">
                  <template #image>
                    <el-icon :sawadize="48" color="#909399">
                      <Document />
                    </el-icon>
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
                <!-- ref="pdfViewer"在 Vue 中注册模板引用，通过 this.$refs.pdfViewer 直接操作该 <iframe> DOM 元素。
                frameborder="0"样式优化：移除默认边框，使嵌入内容视觉上更无缝。
                事件绑定：@load="handlePdfLoad"iframe 内容（PDF 或错误页）加载完成时。
                  @error="handlePdfError"资源加载失败（如 URL 无效、网络断开、跨域限制）。
                  它们两个都为系统自带的
                  为何这段代码可以实现pdf的预览效果？ 
                  现代浏览器（如 Chrome、Edge、Firefox）原生集成了 PDF 查看器，当浏览器检测到请求的 URL 返回的 Content-Type 为 application/pdf 时，会自动触发内置的 PDF 渲染引擎。通过 iframe 的 src 属性加载 PDF 文件，实际上是将 PDF 渲染流程委托给浏览器
                  -->
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
  return ext.endsWith('.doc') || ext.endsWith('.docx')  //通过 字符串.endsWith(目标字符串) 判断字符串是否以特定后缀结尾
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

    // 获取文件扩展名,例如 pdf,doc,docx
    const ext = thesis.value.file_url.split('.').pop().toLowerCase()

    // 尝试使用现代文件系统API
    try {
      // 根据文件扩展名配置文件类型
      const fileTypes = {
        'pdf': {
          description: 'PDF 文件',
          accept: {
            'application/pdf': ['.pdf']  //MIME 类型
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

      // window.showSaveFilePicker() 是 File System Access API 中的方法，允许网页通过浏览器原生对话框让用户选择文件保存位置，并直接写入内容，返回文件句柄，然后就可以直接写入文件内容。返回文件句柄，而不是文件路径，所以需要使用 File System Access API 的 createWritable() 方法来获取文件写入句柄，然后再写入文件内容。
      // 什么是 MIME 类型？
      // 功能：通过一个字符串（如 text / html）精确描述文件的 内容类型 和 子类型。

      // 格式：类型 / 子类型，例如：

      // text / plain（纯文本）
      // image / png（PNG 图片）
      // application / pdf（PDF 文档）
      // video / mp4（MP4 视频）

      const handle = await window.showSaveFilePicker({
        suggestedName: `我的论文.${ext}`,   // 推荐文件名（用户可修改）
        types: [fileTypes[ext] || {
          description: '所有文件',  // 文件类型描述,体现在保存对话框的文件类型列表中
          accept: {    // MIME 类型映射
            '*/*': [`.${ext}`]  // */*MIME 类型通配符：表示接受所有类型的文件        [.${ext}]，强制指定扩展名：无论用户输入什么文件名，默认追加扩展名 .${ext}
          }
        }]
      })

      // 用户已选择保存位置，此时开始下载
      ElMessage.info('正在下载文件...')

      const response = await fetch(downloadUrl)

      if (!response.ok) throw new Error('下载失败')
      //blob是二进制对象，blob对象可以创建一个文件对象，然后写入到文件中
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
        //为 Blob 生成一个临时 URL,让浏览器可以通过普通 URL 访问内存中的文件数据。
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        //download 属性指定下载后的文件名
        link.download = `我的论文.${ext}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        //释放临时 URL 内存
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

// 添加下载批注版文档的函数
const handleDownloadAnnotated = async () => {
  try {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    const token = localStorage.getItem('token')
    const downloadUrl = `${baseUrl}/api/thesis/${thesis.value.id}/annotated-document/download?token=${token}`

    // 获取文件扩展名
    const ext = thesis.value.annotated_file_url.split('.').pop().toLowerCase()

    // 尝试使用现代文件系统API
    try {
      // 根据文件类型配置选项
      const fileTypes = {
        'pdf': {
          description: 'PDF 文件',
          accept: { 'application/pdf': ['.pdf'] }
        },
        'doc': {
          description: 'Word 文档',
          accept: { 'application/msword': ['.doc'] }
        },
        'docx': {
          description: 'Word 文档',
          accept: { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] }
        }
      }

      // 弹出保存对话框
      const handle = await window.showSaveFilePicker({
        suggestedName: `论文批注版.${ext}`,
        types: [fileTypes[ext] || {
          description: '文档文件',
          accept: { 'application/octet-stream': [`.${ext}`] }
        }]
      })

      // 创建可写流
      const writable = await handle.createWritable()

      // 获取文件内容
      const response = await fetch(downloadUrl)
      const blob = await response.blob()

      // 写入文件并关闭
      await writable.write(blob)
      await writable.close()

      ElMessage.success('下载成功')
    } catch (error) {
      // 如果不支持File System Access API或用户取消，回退到传统方式
      if (error.name !== 'AbortError') {
        ElMessageBox.confirm(
          '您的浏览器不支持选择保存位置，文件将下载到默认下载文件夹',
          '提示',
          {
            confirmButtonText: '确定',
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
        link.download = `论文批注版.${ext}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        ElMessage.success('下载成功')
      }
    }
  } catch (error) {
    console.error('下载批注版文档失败:', error)
    ElMessage.error('下载失败')
  }
}
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
  /* 确保占满父容器高度 */
  min-height: 80vh;
  /* 添加最小高度 */
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  /* 添加相对定位 */
}

/* 确保iframe占满整个容器 */
.pdf-viewer iframe {
  width: 100%;
  height: 100%;
  position: absolute;
  /* 绝对定位使其填满容器 */
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: none;
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

/* 当在小屏幕上显示时调整高度 */
@media screen and (max-width: 768px) {
  .annotation-container {
    flex-direction: column;
    height: auto;
    min-height: calc(100vh - 120px);
  }

  .pdf-viewer {
    flex: none;
    height: 70vh;
    /* 在移动设备上设置为视口高度的70% */
    min-height: 400px;
  }

  .annotation-panel {
    height: auto;
    min-height: 300px;
  }
}
</style>