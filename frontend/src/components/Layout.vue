<template>
  <!-- 用于布局的容器组件，方便快速搭建页面的基本结构：
<el-container>：外层容器。 当子元素中包含 <el-header> 或 <el-footer> 时，全部子元素会垂直上下排列， 否则会水平左右排列。
<el-header>：顶栏容器。
<el-aside>：侧边栏容器。
<el-main>：主要区域容器。
<el-footer>：底栏容器。 -->
  <el-container class="layout-container">
    <!-- 移动端抽屉菜单   with-header="false"隐藏默认标题栏（若需要自定义标题，可通过 <template #header> 实现）-->
    <el-drawer v-model="drawerVisible" direction="ltr" size="200px" :with-header="false">
      <!-- :router="true:启用 Vue Router 模式，菜单项的 index 值会被视为路由路径（path）。点击菜单项时自动跳转到对应路由 
       :default-active="$route.path":设置当前激活菜单项的高亮标识。通过绑定当前路由路径 $route.path，确保页面刷新或手动输入 URL 时，菜单项能正确高亮 
      -->
      <el-menu :router="true" :default-active="$route.path" class="el-menu-vertical" :background-color="'#545c64'"
        :text-color="'#fff'" :active-text-color="'#ffd04b'">
        <!-- 所有用户可见 -->
        <el-menu-item index="/home">
          <el-icon>
            <House />
          </el-icon>
          <span>首页</span>
        </el-menu-item>

        <!-- 教师菜单 -->
        <template v-if="userRole === 'teacher'">
          <el-sub-menu index="teacher">
            <template #title>
              <el-icon>
                <Management />
              </el-icon>
              <span>课题管理</span>
            </template>
            <el-menu-item index="/teacher/topics">
              <el-icon>
                <List />
              </el-icon>
              <span>我的课题</span>
            </el-menu-item>
            <el-menu-item index="/teacher/create-topic">
              <el-icon>
                <Plus />
              </el-icon>
              <span>发布课题</span>
            </el-menu-item>
            <el-menu-item index="/teacher/thesis-review">
              <el-icon>
                <Document />
              </el-icon>
              <span>论文审阅</span>
            </el-menu-item>
          </el-sub-menu>

          <!-- 其他教师菜单项... -->
        </template>

        <!-- 学生菜单 -->
        <template v-if="userRole === 'student'">
          <el-sub-menu index="topics">
            <template #title>
              <el-icon>
                <Document />
              </el-icon>
              <span>选题管理</span>
            </template>
            <el-menu-item index="/topics/available">
              <el-icon>
                <List />
              </el-icon>
              <span>可选课题</span>
            </el-menu-item>
            <el-menu-item index="/topics/my-selection">
              <el-icon>
                <Document />
              </el-icon>
              <span>我的选题</span>
            </el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="thesis">
            <template #title>
              <el-icon>
                <Document />
              </el-icon>
              <span>论文管理</span>
            </template>
            <el-menu-item index="/thesis/upload">
              <el-icon>
                <Upload />
              </el-icon>
              <span>论文提交</span>
            </el-menu-item>
            <el-menu-item index="/thesis/feedback">
              <el-icon>
                <ChatDotRound />
              </el-icon>
              <span>导师评阅</span>
            </el-menu-item>
          </el-sub-menu>
        </template>

        <!-- 管理员菜单 -->
        <!-- <template v-if="userRole === 'admin'">
          <el-sub-menu index="admin">
            <template #title>
              <el-icon>
                <Setting />
              </el-icon>
              <span>系统管理</span>
            </template>
            <el-menu-item index="/admin/users">
              <el-icon>
                <User />
              </el-icon>
              <span>用户管理</span>
            </el-menu-item>
            <el-menu-item index="/admin/topics">
              <el-icon>
                <List />
              </el-icon>
              <span>课题管理</span>
            </el-menu-item>
          </el-sub-menu>
        </template> -->

        <!-- 个人中心 -->
        <el-menu-item v-if="userRole === 'student'" :index="'/student/profile'">
          个人信息
        </el-menu-item>

        <el-menu-item v-if="userRole === 'teacher'" :index="'/teacher/profile'">
          个人信息
        </el-menu-item>
      </el-menu>
    </el-drawer>

    <!-- PC端侧边栏 -->
    <el-aside width="200px" class="pc-sidebar">
      <el-menu :router="true" class="el-menu-vertical" :default-active="$route.path" :background-color="'#545c64'"
        :text-color="'#fff'" :active-text-color="'#ffd04b'">
        <!-- 所有用户可见 -->
        <el-menu-item index="/home">
          <el-icon>
            <House />
          </el-icon>
          <span>首页</span>
        </el-menu-item>

        <!-- 教师菜单 -->
        <template v-if="userRole === 'teacher'">
          <el-sub-menu index="teacher">
            <template #title>
              <el-icon>
                <Management />
              </el-icon>
              <span>课题管理</span>
            </template>
            <el-menu-item index="/teacher/topics">
              <el-icon>
                <List />
              </el-icon>
              <span>我的课题</span>
            </el-menu-item>
            <el-menu-item index="/teacher/create-topic">
              <el-icon>
                <Plus />
              </el-icon>
              <span>发布课题</span>
            </el-menu-item>
            <el-menu-item index="/teacher/thesis-review">
              <el-icon>
                <Document />
              </el-icon>
              <span>论文审阅</span>
            </el-menu-item>
          </el-sub-menu>

          <!-- 其他教师菜单项... -->
        </template>

        <!-- 学生菜单 -->
        <template v-if="userRole === 'student'">
          <el-sub-menu index="topics">
            <template #title>
              <el-icon>
                <Document />
              </el-icon>
              <span>选题管理</span>
            </template>
            <el-menu-item index="/topics/available">
              <el-icon>
                <List />
              </el-icon>
              <span>可选课题</span>
            </el-menu-item>
            <el-menu-item index="/topics/my-selection">
              <el-icon>
                <Document />
              </el-icon>
              <span>我的选题</span>
            </el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="thesis">
            <template #title>
              <el-icon>
                <Document />
              </el-icon>
              <span>论文管理</span>
            </template>
            <el-menu-item index="/thesis/upload">
              <el-icon>
                <Upload />
              </el-icon>
              <span>论文提交</span>
            </el-menu-item>
            <el-menu-item index="/thesis/feedback">
              <el-icon>
                <ChatDotRound />
              </el-icon>
              <span>导师评阅</span>
            </el-menu-item>
          </el-sub-menu>
        </template>

        <!-- 管理员菜单
        <template v-if="userRole === 'admin'">
          <el-sub-menu index="admin">
            <template #title>
              <el-icon>
                <Setting />
              </el-icon>
              <span>系统管理</span>
            </template>
            <el-menu-item index="/admin/users">
              <el-icon>
                <User />
              </el-icon>
              <span>用户管理</span>
            </el-menu-item>
            <el-menu-item index="/admin/topics">
              <el-icon>
                <List />
              </el-icon>
              <span>课题管理</span>
            </el-menu-item>
          </el-sub-menu>
        </template> -->

        <!-- 个人中心 -->
        <el-menu-item v-if="userRole === 'student'" :index="'/student/profile'">
          个人信息
        </el-menu-item>

        <el-menu-item v-if="userRole === 'teacher'" :index="'/teacher/profile'">
          个人信息
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header>
        <div class="header-content">
          <!-- 修改移动端菜单按钮 -->
          <el-button class="mobile-menu-btn" @click="drawerVisible = true">
            <el-icon>
              <Menu />
            </el-icon>
          </el-button>

          <span class="title">毕业论文选题系统</span>
          <div class="user-info">
            <!-- 下拉单 -->
            <el-dropdown>
              <span class="user-dropdown">
                {{ userName }}
                <el-icon>
                  <ArrowDown />
                </el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="goToProfile">个人信息</el-dropdown-item>
                  <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </el-header>

      <el-main>
        <router-view></router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  House,
  Management,
  List,
  Plus,
  Document,
  UserFilled,
  ArrowDown,
  Setting,
  User,
  Upload,
  ChatDotRound,
  Menu
} from '@element-plus/icons-vue'

const router = useRouter()
const userRole = ref(localStorage.getItem('userRole') || 'student')
const userName = ref(localStorage.getItem('userName') || '用户')
const drawerVisible = ref(false)

const goToProfile = () => {
  if (userRole.value === 'student') {
    router.push('/student/profile')
  } else if (userRole.value === 'teacher') {
    router.push('/teacher/profile')
  }
}

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('userRole')
  localStorage.removeItem('userName')
  router.push('/login')
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
  width: 100vw;
}

.el-header {
  background-color: #409EFF;
  padding: 0 20px;
  color: white;
  line-height: 60px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 20px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 修改移动端菜单按钮样式 */
.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  color: white;
  padding: 8px;
  margin-right: 10px;
}

.mobile-menu-btn:hover,
.mobile-menu-btn:focus {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.mobile-menu-btn :deep(.el-icon) {
  font-size: 20px;
  vertical-align: middle;
}

/* 调整移动端布局 */
@media screen and (max-width: 768px) {
  .pc-sidebar {
    display: none;
  }

  .mobile-menu-btn {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .title {
    font-size: 16px;
    flex: 1;
    text-align: center;
    margin: 0 10px;
  }

  .el-header {
    padding: 0 10px;
  }

  .user-dropdown {
    font-size: 14px;
  }

  /* 抽屉菜单样式优化 */
  /* 
    为什么需要 :deep()？ 当你在 Vue 组件的 <style>标签中添加 scoped 属性时，样式仅作用于当前组件。这是通过给每个 DOM 元素添加唯一属性（如 data-v-xxxxx）实现的
    :deep() 是 Vue 3 的样式穿透语法，它允许父组件的样式穿透到子组件内部
  */
  :deep(.el-drawer) {
    background-color: #545c64;
  }

  :deep(.el-drawer .el-menu) {
    border-right: none;
  }

  :deep(.el-drawer .el-menu-item),
  :deep(.el-drawer .el-sub-menu__title) {
    color: #fff;
  }

  :deep(.el-drawer .el-menu-item.is-active) {
    background-color: #409EFF;
  }

  :deep(.el-drawer .el-menu-item:hover),
  :deep(.el-drawer .el-sub-menu__title:hover) {
    background-color: #363d44;
  }
}

.user-info {
  cursor: pointer;
}

.user-dropdown {
  color: white;
  display: flex;
  align-items: center;
  gap: 4px;
}

.el-aside {
  background-color: #545c64;
  color: #fff;
}

.el-menu-vertical {
  height: 100%;
  background-color: #545c64;
  border-right: none;
}

/* 菜单样式优化 */
:deep(.el-menu) {
  border-right: none;
  background-color: #545c64;
}

:deep(.el-menu-item) {
  color: #fff !important;
}

:deep(.el-sub-menu__title) {
  color: #fff !important;
}

:deep(.el-menu-item:hover) {
  background-color: #363d44 !important;
}

:deep(.el-menu-item.is-active) {
  background-color: #409EFF !important;
  color: #fff !important;
}

:deep(.el-sub-menu__title:hover) {
  background-color: #363d44 !important;
}

:deep(.el-sub-menu.is-active .el-sub-menu__title) {
  color: #409EFF !important;
}

:deep(.el-menu--popup) {
  background-color: #545c64 !important;
  border: none;
}

:deep(.el-menu--popup .el-menu-item) {
  color: #fff !important;
  background-color: #545c64;
}

:deep(.el-menu--popup .el-menu-item:hover) {
  background-color: #363d44 !important;
}

:deep(.el-menu--popup .el-menu-item.is-active) {
  background-color: #409EFF !important;
}

/* 修复菜单图标对齐 */
:deep(.el-menu-item .el-icon),
:deep(.el-sub-menu__title .el-icon) {
  vertical-align: middle;
  margin-right: 5px;
  width: 24px;
  text-align: center;
}

/* 修复下拉菜单样式 */
:deep(.el-dropdown-menu) {
  background-color: #fff !important;
}

:deep(.el-dropdown-menu__item) {
  color: #606266 !important;
}

:deep(.el-dropdown-menu__item:hover) {
  background-color: #ecf5ff !important;
  color: #409EFF !important;
}
</style>