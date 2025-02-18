<template>
  <div class="topic-selection">
    <!-- ... 其他代码 ... -->
    <div v-if="currentSelection" class="current-selection">
      <el-alert
        title="当前选题状态"
        type="info"
        :description="`你已选择课题：${currentSelection.topic.title}`"
        show-icon
      >
        <template #default>
          <el-button type="danger" size="small" @click="handleCancel">
            取消选题
          </el-button>
        </template>
      </el-alert>
    </div>
    <!-- ... 其他代码 ... -->
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { getSelectionStatus, cancelTopicSelection } from '../../api/topics'
// ... 其他导入保持不变 ...

const currentSelection = ref(null)

const handleSelect = async (topic) => {
  try {
    const response = await selectTopic(topic.id)
    if (response.success) {
      ElMessage.success(response.message)
      // 刷新课题列表
      fetchTopics()
    }
  } catch (error) {
    console.error('选题失败:', error)
    ElMessage.error(error.response?.data?.message || '选题失败')
  }
}

const checkSelectionStatus = async () => {
  try {
    const response = await getSelectionStatus()
    if (response.success && response.data) {
      currentSelection.value = response.data
      console.log('Current selection status:', response.data)
    }
  } catch (error) {
    console.error('检查选题状态失败:', error)
  }
}

const handleCancel = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要取消当前选题吗？',
      '取消选题',
      {
        type: 'warning'
      }
    )
    
    const response = await cancelTopicSelection()
    if (response.success) {
      ElMessage.success('取消选题成功')
      currentSelection.value = null
      // 刷新课题列表
      fetchTopics()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('取消选题失败:', error)
      ElMessage.error(error.response?.data?.message || '取消选题失败')
    }
  }
}

onMounted(() => {
  checkSelectionStatus()
})
</script>

<style scoped>
.current-selection {
  margin-bottom: 20px;
}
</style> 