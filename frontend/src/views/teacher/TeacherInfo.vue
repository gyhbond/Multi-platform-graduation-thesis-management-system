<template>
  <div class="teacher-info-container">
    <el-card class="teacher-info-card">
      <template #header>
        <div class="card-header">
          <h2>教师信息</h2>
        </div>
      </template>

      <div class="info-content" v-if="teacherInfo">
        <div class="info-item">
          <label>姓名：</label>
          <span>{{ teacherInfo.name }}</span>
        </div>

        <div class="info-item">
          <label>职称：</label>
          <span>{{ teacherInfo.title }}</span>
        </div>

        <div class="info-item">
          <label>院系：</label>
          <span>{{ getDepartmentLabel(teacherInfo.department) }}</span>
        </div>

        <div class="info-item">
          <label>研究方向：</label>
          <span>{{ teacherInfo.research_area }}</span>
        </div>

        <div class="info-item">
          <label>邮箱：</label>
          <span>{{ teacherInfo.email }}</span>
        </div>

        <div class="info-item">
          <label>办公室：</label>
          <span>{{ teacherInfo.office_location }}</span>
        </div>

        <div class="info-item bio">
          <label>自我介绍：</label>
          <p>{{ teacherInfo.bio }}</p>
        </div>
      </div>

      <el-empty v-else description="未找到教师信息" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getTeacherInfo } from '../../api/user'

const route = useRoute()
const teacherInfo = ref(null)

const departments = {
  computer: '计算机科学与技术学院',
  math: '数学学院',
  physics: '物理学院'
}

const getDepartmentLabel = (value) => {
  return departments[value] || value
}

const fetchTeacherInfo = async () => {
  try {
    const response = await getTeacherInfo(route.params.id)
    if (response.success) {
      teacherInfo.value = response.data
    }
  } catch (error) {
    ElMessage.error('获取教师信息失败')
  }
}

onMounted(() => {
  fetchTeacherInfo()
})
</script>

<style scoped>
.teacher-info-container {
  padding: 20px;
}

.teacher-info-card {
  max-width: 800px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-content {
  padding: 20px 0;
}

.info-item {
  margin-bottom: 15px;
  line-height: 1.5;
}

.info-item label {
  font-weight: bold;
  margin-right: 10px;
  color: #606266;
}

.info-item.bio {
  margin-top: 20px;
}

.info-item.bio p {
  margin-top: 10px;
  white-space: pre-line;
}
</style>