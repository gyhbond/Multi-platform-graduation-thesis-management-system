<template>
  <div class="topics-container">
    <div class="header">
      <h2>我的课题列表</h2>
      <el-button type="primary" @click="goToCreate">发布新课题</el-button>
    </div>

    <!-- PC端表格 -->
    <div class="pc-table">
      <el-table :data="topics" style="width: 100%" v-loading="loading">
        <el-table-column prop="title" label="课题名称" />
        <el-table-column prop="description" label="课题描述" show-overflow-tooltip />
        <el-table-column prop="selectedCount" label="已选人数">
          <template #default="{ row }">
            {{ row.selectedCount }}/{{ row.maxStudents }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === 'open' ? 'success' : 'info'">
              {{ row.status === 'open' ? '开放选择' : '已关闭' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="选题学生" min-width="200">
          <template #default="{ row }">
            <div v-if="row.students && row.students.length > 0">
              <div
                v-for="student in row.students"
                :key="student.id"
                class="student-item"
              >
                <el-tag :type="getSelectionStatusType(student.selectionStatus)">
                  {{ student.name }} ({{ student.studentId }})
                  {{ getSelectionStatusText(student.selectionStatus) }}
                </el-tag>
                <div class="student-actions" v-if="student.selectionStatus === 'pending'">
                  <el-button 
                    type="success" 
                    size="small"
                    @click="handleReview(row.id, student.id, 'approved')"
                  >
                    通过
                  </el-button>
                  <el-button 
                    type="danger" 
                    size="small"
                    @click="handleReview(row.id, student.id, 'rejected')"
                  >
                    拒绝
                  </el-button>
                </div>
              </div>
            </div>
            <span v-else>暂无学生选择</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button-group>
              <el-button size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button size="small" :type="row.status === 'open' ? 'danger' : 'success'"
                @click="handleToggleStatus(row)">
                {{ row.status === 'open' ? '关闭' : '开放' }}
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 移动端卡片列表 -->
    <div class="mobile-list">
      <el-card v-for="topic in topics" :key="topic.id" class="topic-card">
        <template #header>
          <div class="card-header">
            <span class="title">{{ topic.title }}</span>
            <el-tag :type="topic.status === 'open' ? 'success' : 'info'">
              {{ topic.status === 'open' ? '开放选择' : '已关闭' }}
            </el-tag>
          </div>
        </template>
        
        <div class="card-content">
          <p class="description">{{ topic.description }}</p>
          <div class="count-info">
            已选人数: {{ topic.selectedCount }}/{{ topic.maxStudents }}
          </div>
          
          <div class="students-section" v-if="topic.students?.length">
            <h4>选题学生:</h4>
            <div class="student-tags">
              <el-tag
                v-for="student in topic.students"
                :key="student.id"
                :type="getSelectionStatusType(student.selectionStatus)"
                class="student-tag"
              >
                {{ student.name }} ({{ student.studentId }})
                {{ getSelectionStatusText(student.selectionStatus) }}
              </el-tag>
            </div>
          </div>
          
          <div class="actions">
            <el-button size="small" @click="handleEdit(topic)">编辑</el-button>
            <el-button
              size="small"
              :type="topic.status === 'open' ? 'danger' : 'success'"
              @click="handleToggleStatus(topic)"
            >
              {{ topic.status === 'open' ? '关闭' : '开放' }}
            </el-button>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getTeacherTopics, updateTopicStatus, updateTopicSelection } from '../../api/topics'

const router = useRouter()
const loading = ref(false)
const topics = ref([])

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

// 获取选题状态对应的标签类型
const getSelectionStatusType = (status) => {
  const types = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return types[status] || 'info'
}

// 获取选题状态的显示文本
const getSelectionStatusText = (status) => {
  const texts = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
  }
  return texts[status] || '未知状态'
}

const fetchTopics = async () => {
  loading.value = true
  try {
    const response = await getTeacherTopics()
    if (response.success) {
      topics.value = response.data
      console.log('Topics data:', response.data) // 添加调试日志
    }
  } catch (error) {
    console.error('获取课题列表失败:', error)
    ElMessage.error('获取课题列表失败')
  } finally {
    loading.value = false
  }
}

const handleApprove = async (topicId, studentId) => {
  try {
    await ElMessageBox.confirm('确定通过该学生的选题申请吗？', '确认', {
      type: 'warning'
    })
    
    const response = await updateTopicSelection(topicId, studentId, 'approved')
    if (response.success) {
      ElMessage.success('已通过选题申请')
      fetchTopics()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

const handleReject = async (topicId, studentId) => {
  try {
    await ElMessageBox.confirm('确定拒绝该学生的选题申请吗？', '确认', {
      type: 'warning'
    })
    
    const response = await updateTopicSelection(topicId, studentId, 'rejected')
    if (response.success) {
      ElMessage.success('已拒绝选题申请')
      fetchTopics()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

// 跳转到创建页面
const goToCreate = () => {
  router.push('/teacher/create-topic')
}

// 编辑课题
const handleEdit = (row) => {
  router.push({
    path: '/teacher/create-topic',
    query: { id: row.id }
  })
}

// 切换课题状态
const handleToggleStatus = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要${row.status === 'open' ? '关闭' : '开放'}该课题吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const newStatus = row.status === 'open' ? 'closed' : 'open'
    await updateTopicStatus(row.id, newStatus)
    row.status = newStatus
    ElMessage.success('更新成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

const handleReview = async (topicId, studentId, status) => {
  try {
    await ElMessageBox.confirm(
      `确定要${status === 'approved' ? '通过' : '拒绝'}该学生的选题申请吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: status === 'approved' ? 'success' : 'warning'
      }
    )

    await updateTopicSelection(topicId, studentId, status)
    ElMessage.success('审核成功')
    fetchTopics() // 刷新列表
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '审核失败')
    }
  }
}

onMounted(() => {
  fetchTopics()
})
</script>

<style scoped>
.topics-container {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
}

.student-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.status-tag {
  margin: 0 10px;
}

.student-actions {
  margin-left: 10px;
}

.student-actions .el-button {
  margin-left: 5px;
}

.student-tag {
  margin-right: 8px;
  margin-bottom: 8px;
}

/* 确保标签换行显示 */
.el-table .cell {
  white-space: normal;
  line-height: 2;
}

/* 响应式样式 */
.mobile-list {
  display: none;
}

@media screen and (max-width: 768px) {
  .pc-table {
    display: none;
  }

  .mobile-list {
    display: block;
  }

  .topic-card {
    margin-bottom: 15px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .card-header .title {
    font-weight: bold;
    font-size: 16px;
  }

  .description {
    color: #666;
    margin: 10px 0;
  }

  .count-info {
    margin: 10px 0;
    color: #409EFF;
  }

  .students-section {
    margin: 15px 0;
  }

  .students-section h4 {
    margin-bottom: 10px;
  }

  .student-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .actions {
    margin-top: 15px;
    display: flex;
    gap: 10px;
  }

  .header {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }

  .header h2 {
    text-align: center;
  }
}
</style>