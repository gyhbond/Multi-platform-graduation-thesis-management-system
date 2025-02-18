import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue')
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('../components/Layout.vue'),
    redirect: to => {
      const role = localStorage.getItem('userRole')
      if (role === 'student') return '/topics/available'
      if (role === 'teacher') return '/teacher/topics'
      return '/home'
    },
    children: [
      {
        path: 'home',
        name: 'Home',
        component: () => import('../views/Home.vue')
      },
      // 教师路由
      {
        path: 'teacher/topics',
        name: 'TeacherTopics',
        component: () => import('../views/teacher/Topics.vue')
      },
      {
        path: 'teacher/create-topic',
        name: 'CreateTopic',
        component: () => import('../views/teacher/CreateTopic.vue')
      },
      {
        path: 'teacher/thesis-review',
        name: 'TeacherThesisReview',
        component: () => import('../views/teacher/ThesisReview.vue'),
        meta: { requiresAuth: true, role: 'teacher' }
      },
      {
        path: 'teacher/thesis-scores',
        name: 'ThesisScores',
        component: () => import('../views/teacher/ThesisScores.vue')
      },
      // 学生路由
      {
        path: 'topics/available',
        name: 'AvailableTopics',
        component: () => import('../views/student/AvailableTopics.vue')
      },
      {
        path: 'topics/my-selection',
        name: 'MySelection',
        component: () => import('../views/student/MySelection.vue')
      },
      {
        path: 'thesis/upload',
        name: 'ThesisUpload',
        component: () => import('../views/student/ThesisUpload.vue')
      },
      {
        path: 'thesis/feedback',
        name: 'ThesisFeedback',
        component: () => import('../views/student/ThesisFeedback.vue')
      },
      // 管理员路由
      {
        path: 'admin/users',
        name: 'UserManagement',
        component: () => import('../views/admin/Users.vue')
      },
      {
        path: 'admin/departments',
        name: 'DepartmentManagement',
        component: () => import('../views/admin/Departments.vue')
      },
      {
        path: 'admin/topics',
        name: 'TopicManagement',
        component: () => import('../views/admin/Topics.vue')
      },
      // 修改学生和教师的 profile 路由路径
      {
        path: 'student/profile',
        name: 'StudentProfile',
        component: () => import('../views/student/Profile.vue'),
        meta: { requiresAuth: true, role: 'student' }
      },
      {
        path: 'teacher/profile',
        name: 'TeacherProfile',
        component: () => import('../views/teacher/Profile.vue'),
        meta: { requiresAuth: true, role: 'teacher' }
      },
      {
        path: 'teacher-info/:id',
        name: 'TeacherInfo',
        component: () => import('../views/teacher/TeacherInfo.vue'),
        meta: { requiresAuth: true }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const userRole = localStorage.getItem('userRole')
  const whiteList = ['/login', '/register']

  if (whiteList.includes(to.path)) {
    next()
  } else if (!token) {
    next('/login')
  } else {
    // 检查路由是否需要特定角色
    if (to.meta.role && to.meta.role !== userRole) {
      // 如果用户角色不匹配，重定向到对应的首页
      if (userRole === 'student') {
        next('/topics/available')
      } else if (userRole === 'teacher') {
        next('/teacher/topics')
      } else {
        next('/home')
      }
    } else {
      next()
    }
  }
})

export default router 