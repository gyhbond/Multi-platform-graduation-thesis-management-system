<template>
  <div class="topics-container">
    <h2>可选课题列表</h2>
    <el-table :data="topics" style="width: 100%" v-loading="loading">
      <!-- v-loading是element-plus的指令，用于显示加载状态 -->
      <el-table-column prop="title" label="课题名称" />
      <el-table-column prop="description" label="课题描述" show-overflow-tooltip />
      <!-- show-overflow-tooltip 当内容过长超出列宽时，显示省略号，鼠标悬停时展示完整内容的 Tooltip。 -->
      <el-table-column label="指导教师">
        <template #default="{ row }">
          <!-- #default 是默认插槽，用于显示课题指导教师的名字。row 是 el-table 绑定的 :data 数组中当前遍历到的元素。例如，若 :data="topics"，则 row 对应 topics 中的某个课题对象。解构赋值：从子组件传递的插槽属性（Slot Props）中提取 row 字段。(底层通过作用与)-->
          <router-link :to="`/teacher-info/${row.teacher?.id}`" class="teacher-link">
            {{ row.teacher?.name }}
          </router-link>
        </template>
      </el-table-column>
      <el-table-column prop="maxStudents" label="最大选题人数" width="120" />
      <el-table-column prop="selectedCount" label="已选人数" width="100" />
      <el-table-column label="截止日期" width="180">
        <template #default="{ row }">
          {{ formatDate(row.deadline) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="handleSelect(row)"
            :disabled="row.selectedCount >= row.maxStudents">
            选择课题
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 课题详情对话框 -->
    <el-dialog v-model="dialogVisible" :title="currentTopic?.title" width="50%">
      <div class="topic-detail">
        <h4>课题描述</h4>
        <p>{{ currentTopic?.description }}</p>

        <h4>选题要求</h4>
        <p>{{ currentTopic?.requirements }}</p>

        <h4>其他信息</h4>
        <p>指导教师：{{ currentTopic?.teacher?.name }}</p>
        <p>已选人数：{{ currentTopic?.selectedCount }}/{{ currentTopic?.maxStudents }}</p>
        <p>截止日期：{{ formatDate(currentTopic?.deadline) }}</p>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmSelect">
            确认选择
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAvailableTopics, selectTopic } from '../../api/topics'

const loading = ref(false)
const topics = ref([])
const dialogVisible = ref(false)
const currentTopic = ref(null)

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString()
}

// 获取可选课题列表
const fetchTopics = async () => {
  loading.value = true
  try {
    const response = await getAvailableTopics()
    topics.value = response.data
  } catch (error) {
    ElMessage.error('获取课题列表失败')
  } finally {
    loading.value = false
  }
}

// 选择课题
const handleSelect = (topic) => {
  currentTopic.value = topic
  dialogVisible.value = true
}

// 确认选择
const confirmSelect = async () => {
  try {
    await selectTopic(currentTopic.value.id)
    ElMessage.success('选题成功')
    dialogVisible.value = false
    fetchTopics() // 刷新列表
  } catch (error) {
    ElMessage.error(error.message || '选题失败')
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

.topic-detail h4 {
  margin: 16px 0 8px;
}

.topic-detail p {
  margin: 8px 0;
  line-height: 1.5;
}

.teacher-link {
  color: #409EFF;
  text-decoration: none;
}

.teacher-link:hover {
  text-decoration: underline;
}
</style>