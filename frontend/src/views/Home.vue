<template>
  <div class="home-container">
    <!-- 欢迎横幅 -->
    <div class="welcome-banner">
      <h1>毕业论文选题系统</h1>
      <p class="subtitle">欢迎您，{{ userName }}{{ userRole === 'student' ? '同学' : '老师' }}</p>
    </div>

    <!-- 功能卡片区域 -->
    <div class="feature-cards">
      <!-- 学生卡片 -->
      <template v-if="userRole === 'student'">
        <el-card class="feature-card">
          <template #header>
            <div class="card-header">
              <el-icon><List /></el-icon>
              <span>选题管理</span>
            </div>
          </template>
          <div class="card-content">
            <router-link to="/topics/available">
              <el-button type="primary">浏览可选课题</el-button>
            </router-link>
            <router-link to="/topics/my-selection">
              <el-button>查看我的选题</el-button>
            </router-link>
          </div>
        </el-card>

        <el-card class="feature-card">
          <template #header>
            <div class="card-header">
              <el-icon><Document /></el-icon>
              <span>论文管理</span>
            </div>
          </template>
          <div class="card-content">
            <router-link to="/thesis/upload">
              <el-button type="primary">提交论文</el-button>
            </router-link>
            <router-link to="/thesis/feedback">
              <el-button>查看评阅</el-button>
            </router-link>
          </div>
        </el-card>
      </template>

      <!-- 教师卡片 -->
      <template v-if="userRole === 'teacher'">
        <el-card class="feature-card">
          <template #header>
            <div class="card-header">
              <el-icon><Management /></el-icon>
              <span>课题管理</span>
            </div>
          </template>
          <div class="card-content">
            <router-link to="/teacher/topics">
              <el-button type="primary">管理课题</el-button>
            </router-link>
            <router-link to="/teacher/create-topic">
              <el-button>发布新课题</el-button>
            </router-link>
          </div>
        </el-card>

        <el-card class="feature-card">
          <template #header>
            <div class="card-header">
              <el-icon><Reading /></el-icon>
              <span>论文审阅</span>
            </div>
          </template>
          <div class="card-content">
            <router-link to="/teacher/thesis-review">
              <el-button type="primary">审阅论文</el-button>
            </router-link>
          </div>
        </el-card>
      </template>

      <!-- 个人信息卡片 -->
      <el-card class="feature-card">
        <template #header>
          <div class="card-header">
            <el-icon><User /></el-icon>
            <span>个人中心</span>
          </div>
        </template>
        <div class="card-content">
          <router-link :to="userRole === 'student' ? '/student/profile' : '/teacher/profile'">
            <el-button type="primary">个人信息</el-button>
          </router-link>
        </div>
      </el-card>
    </div>

    <!-- 系统公告 -->
    <div class="announcement-section">
      <el-card>
        <template #header>
          <div class="card-header">
            <el-icon><Bell /></el-icon>
            <span>系统公告</span>
          </div>
        </template>
        <div class="announcement-content">
          <el-timeline>
            <el-timeline-item
              v-for="(activity, index) in announcements"
              :key="index"
              :timestamp="activity.date"
              :type="activity.type"
            >
              {{ activity.content }}
            </el-timeline-item>
          </el-timeline>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { List, Document, Management, Reading, User, Bell } from '@element-plus/icons-vue'

const userName = ref(localStorage.getItem('userName') || '访客')
const userRole = ref(localStorage.getItem('userRole'))

// 示例公告数据
const announcements = [
  {
    date: '2024-03-15',
    content: '2024届毕业论文选题系统正式开放',
    type: 'primary'
  },
  {
    date: '2024-03-20',
    content: '请同学们在4月15日前完成选题',
    type: 'warning'
  },
  {
    date: '2024-05-01',
    content: '论文提交截止时间：2024年6月1日',
    type: 'danger'
  }
]
</script>

<style scoped>
.home-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.welcome-banner {
  text-align: center;
  padding: 40px 20px;
  margin-bottom: 40px;
  background: linear-gradient(135deg, #1890ff 0%, #36cfc9 100%);
  color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.welcome-banner h1 {
  font-size: 2.5em;
  margin: 0;
  margin-bottom: 10px;
}

.subtitle {
  font-size: 1.2em;
  opacity: 0.9;
  margin: 0;
}

.feature-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.feature-card {
  transition: transform 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: bold;
}

.card-content {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.announcement-section {
  margin-top: 20px;
}

.announcement-content {
  padding: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .welcome-banner {
    padding: 20px;
    margin-bottom: 20px;
  }

  .welcome-banner h1 {
    font-size: 1.8em;
  }

  .feature-cards {
    grid-template-columns: 1fr;
  }

  .card-content {
    flex-direction: column;
  }

  .card-content .el-button {
    width: 100%;
  }
}

:deep(.el-timeline-item__content) {
  color: #606266;
}

:deep(.el-timeline-item__timestamp) {
  color: #909399;
}

:deep(.el-card__header) {
  padding: 15px 20px;
  border-bottom: 1px solid #ebeef5;
}

.el-button {
  padding: 12px 20px;
}

.el-icon {
  font-size: 20px;
}
</style>